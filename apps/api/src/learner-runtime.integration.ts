import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createLearnerRuntime, LearnerRuntimeError } from './learner-runtime.js';

function env(name:string){const v=process.env[name];if(!v)throw new Error(`${name} required`);return v;}
async function rejectCode(p:Promise<unknown>,code:LearnerRuntimeError['code']){await assert.rejects(p,(e:unknown)=>e instanceof LearnerRuntimeError&&e.code===code);}
async function tenant(pool:any,id:string,label:string){await pool.query('insert into tenants(id,name,slug) values($1,$2,$3)',[id,label,`m2-${randomUUID()}`]);}
async function user(pool:any,id:string,label:string){await pool.query('insert into users(id,display_name,email,is_active) values($1,$2,$3,true)',[id,label,`${randomUUID()}@example.invalid`]);}

async function main(){
 const db=createDatabase(env('DATABASE_URL'));
 try{
  const tenantA=randomUUID(),tenantB=randomUUID(),learnerA=randomUUID(),learnerB=randomUUID(),learnerOtherTenant=randomUUID();
  await tenant(db.pool,tenantA,'M2 Tenant A'); await tenant(db.pool,tenantB,'M2 Tenant B');
  await user(db.pool,learnerA,'Learner A'); await user(db.pool,learnerB,'Learner B'); await user(db.pool,learnerOtherTenant,'Learner B Tenant');
  const training=randomUUID(),version=randomUUID(),moduleId=randomUUID(),textId=randomUUID(),videoId=randomUUID();
  const snapshot={title:'M2 Training',objectives:[],modules:[{id:moduleId,tenantId:tenantA,trainingId:training,title:'Module',position:1,active:true}],contents:[
   {id:textId,tenantId:tenantA,trainingId:training,moduleId,title:'Text',type:'TEXT',position:1,active:true},
   {id:videoId,tenantId:tenantA,trainingId:training,moduleId,title:'Video',type:'VIDEO',position:2,active:true,durationSeconds:120},
  ]};
  await db.pool.query("insert into trainings(id,tenant_id,title,status) values($1,$2,'M2 Training','PUBLISHED')",[training,tenantA]);
  await db.pool.query('insert into training_versions(id,tenant_id,training_id,version,snapshot,published_at) values($1,$2,$3,1,$4::jsonb,now())',[version,tenantA,training,JSON.stringify(snapshot)]);
  const assignmentA=randomUUID(),assignmentB=randomUUID();
  await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[assignmentA,tenantA,learnerA,training,version]);
  await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[assignmentB,tenantA,learnerB,training,version]);

  const runtime=createLearnerRuntime(db); const pA={tenantId:tenantA,userId:learnerA}; const pB={tenantId:tenantA,userId:learnerB};
  const listed=await runtime.listAssignments(pA); assert.deepEqual(listed.map((x:any)=>x.id),[assignmentA]);
  assert.equal((await runtime.getTraining(pA,training))?.assignmentId,assignmentA);
  assert.equal((await runtime.getTraining({tenantId:tenantB,userId:learnerOtherTenant},training)),null);

  let progress=await runtime.putProgress(pA,{assignmentId:assignmentA,trainingVersionId:version,kind:'MODULE',sourceId:moduleId,progressPermille:300});
  assert.equal(progress.progressPermille,300);
  progress=await runtime.putProgress(pA,{assignmentId:assignmentA,trainingVersionId:version,kind:'MODULE',sourceId:moduleId,progressPermille:100});
  assert.equal(progress.progressPermille,300);
  progress=await runtime.putProgress(pA,{assignmentId:assignmentA,trainingVersionId:version,kind:'MODULE',sourceId:moduleId,progressPermille:500,completed:true});
  assert.equal(progress.progressPermille,1000); assert.equal(progress.completed,true);

  let video=await runtime.putProgress(pA,{assignmentId:assignmentA,trainingVersionId:version,kind:'VIDEO',sourceId:videoId,progressPermille:400,positionSeconds:48});
  assert.equal(video.positionSeconds,48);
  video=await runtime.putProgress(pA,{assignmentId:assignmentA,trainingVersionId:version,kind:'VIDEO',sourceId:videoId,progressPermille:200,positionSeconds:20});
  assert.equal(video.progressPermille,400); assert.equal(video.positionSeconds,48);

  await runtime.putProgress(pA,{assignmentId:assignmentA,trainingVersionId:version,kind:'CONTENT',sourceId:textId,progressPermille:1000,completed:true});
  await rejectCode(runtime.putProgress(pA,{assignmentId:assignmentA,trainingVersionId:version,kind:'MODULE',sourceId:randomUUID(),progressPermille:1}),'SOURCE_NOT_AVAILABLE');
  await rejectCode(runtime.putProgress(pB,{assignmentId:assignmentA,trainingVersionId:version,kind:'MODULE',sourceId:moduleId,progressPermille:1}),'ASSIGNMENT_NOT_AVAILABLE');
  await rejectCode(runtime.putProgress(pA,{assignmentId:assignmentA,trainingVersionId:version,kind:'VIDEO',sourceId:textId,progressPermille:1}),'SOURCE_NOT_AVAILABLE');

  const reconnectDb=createDatabase(env('DATABASE_URL'));
  const reconnect=createLearnerRuntime(reconnectDb);
  try{
    const resume=await reconnect.resume(pA,version);
    assert.equal(resume.assignmentId,assignmentA);
    assert.equal(resume.progress.length,3);
    assert.equal(resume.progress.some((x:any)=>x.kind==='MODULE'&&x.completed===true&&x.progressPermille===1000),true);
    assert.equal(resume.progress.some((x:any)=>x.kind==='VIDEO'&&x.positionSeconds===48),true);
  } finally { await reconnectDb.close(); }

  console.log('Learner M2 PostgreSQL qualification PASS');
 } finally { await db.close(); }
}
await main();
