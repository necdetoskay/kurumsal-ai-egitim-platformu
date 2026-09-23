import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createAssessmentAuthoringRuntime, AssessmentAuthoringRuntimeError } from './assessment-authoring-runtime.js';

function env(name:string){const v=process.env[name];if(!v)throw new Error(`${name} required`);return v;}
async function rejectCode(p:Promise<unknown>,code:AssessmentAuthoringRuntimeError['code']){
 await assert.rejects(p,(e:unknown)=>e instanceof AssessmentAuthoringRuntimeError&&e.code===code);
}
async function count(pool:any,sql:string,params:unknown[]=[]){const r=await pool.query(sql,params);return Number(r.rows[0]?.count??0);}

async function main(){
 const db=createDatabase(env('DATABASE_URL'));
 try{
  const tenant=randomUUID(),tenant2=randomUUID(),training=randomUUID(),version=randomUUID(),objective=randomUUID(),otherTraining=randomUUID(),otherObjective=randomUUID();
  await db.pool.query('insert into tenants(id,name,slug) values($1,$2,$3),($4,$5,$6)',[tenant,'Assessment Author Tenant',`aa-${randomUUID()}`,tenant2,'Assessment Other',`aa-${randomUUID()}`]);
  await db.pool.query("insert into trainings(id,tenant_id,title,status) values($1,$2,'Mission Training','PUBLISHED'),($3,$2,'Other Training','PUBLISHED')",[training,tenant,otherTraining]);
  await db.pool.query("insert into learning_objectives(id,tenant_id,training_id,statement,status) values($1,$2,$3,'Recognize phishing','ACTIVE'),($4,$2,$5,'Other objective','ACTIVE')",[objective,tenant,training,otherObjective,otherTraining]);
  await db.pool.query("insert into training_versions(id,tenant_id,training_id,version,snapshot,published_at) values($1,$2,$3,1,$4::jsonb,now())",[version,tenant,training,JSON.stringify({title:'Mission Training',objectives:[{id:objective,tenantId:tenant,trainingId:training,statement:'Recognize phishing',active:true}],modules:[],contents:[]})]);

  const questionVersions:string[]=[];
  for(let i=0;i<3;i++){
   const q=randomUUID(),qv=randomUUID();questionVersions.push(qv);
   await db.pool.query("insert into questions(id,tenant_id,status) values($1,$2,'APPROVED')",[q,tenant]);
   await db.pool.query("insert into question_versions(id,tenant_id,question_id,version,prompt,options_json,correct_option_index) values($1,$2,$3,1,$4,$5::jsonb,$6)",[qv,tenant,q,`Question ${i+1}`,JSON.stringify(['Wrong','Correct']),1]);
  }
  const draftQ=randomUUID(),draftQv=randomUUID();
  await db.pool.query("insert into questions(id,tenant_id,status) values($1,$2,'DRAFT')",[draftQ,tenant]);
  await db.pool.query("insert into question_versions(id,tenant_id,question_id,version,prompt,options_json,correct_option_index) values($1,$2,$3,1,'Draft question','[\"A\",\"B\"]'::jsonb,0)",[draftQv,tenant,draftQ]);

  const otherQ=randomUUID(),otherQv=randomUUID();
  await db.pool.query("insert into questions(id,tenant_id,status) values($1,$2,'APPROVED')",[otherQ,tenant2]);
  await db.pool.query("insert into question_versions(id,tenant_id,question_id,version,prompt,options_json,correct_option_index) values($1,$2,$3,1,'Other tenant','[\"A\",\"B\"]'::jsonb,0)",[otherQv,tenant2,otherQ]);

  const runtime=createAssessmentAuthoringRuntime(db);const principal={tenantId:tenant,userId:randomUUID()};
  const approved=await runtime.listApprovedQuestions(principal);
  assert.equal(approved.length,3);assert.ok(approved.every((q:any)=>!('correctOptionIndex' in q)&&!('correct_option_index' in q)));

  const questions=questionVersions.map(questionVersionId=>({questionVersionId,objectiveId:objective,points:1}));
  const published=await runtime.publishAssessment(principal,{trainingId:training,trainingVersionId:version,passPercent:70,questions,idempotencyKey:'assessment-publish-1'});
  assert.equal(published.replayed,false);assert.equal(published.status,'PUBLISHED');assert.equal(published.questions.length,3);
  assert.equal(await count(db.pool,'select count(*) from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2',[tenant,published.id]),3);
  assert.equal(await count(db.pool,'select count(*) from training_assessments where tenant_id=$1 and training_version_id=$2 and assessment_id=$3',[tenant,version,published.id]),1);
  const stored=(await db.pool.query('select correct_option_index,prompt from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2 order by position',[tenant,published.id])).rows;
  assert.deepEqual(stored.map((x:any)=>x.correct_option_index),[1,1,1]);assert.equal(stored[0].prompt,'Question 1');

  const replay=await runtime.publishAssessment(principal,{trainingId:training,trainingVersionId:version,passPercent:70,questions,idempotencyKey:'assessment-publish-1'});
  assert.equal(replay.replayed,true);assert.equal(replay.id,published.id);
  assert.equal(await count(db.pool,"select count(*) from outbox_events where tenant_id=$1 and aggregate_id=$2 and event_type='ASSESSMENT_PUBLISHED'",[tenant,published.id]),1);

  await rejectCode(runtime.publishAssessment(principal,{trainingId:training,trainingVersionId:version,passPercent:80,questions,idempotencyKey:'assessment-publish-1'}),'IDEMPOTENCY_CONFLICT');
  await rejectCode(runtime.publishAssessment(principal,{trainingId:training,trainingVersionId:version,passPercent:70,questions:[{questionVersionId:draftQv,objectiveId:objective,points:1}],idempotencyKey:'draft-question'}),'QUESTION_VERSION_NOT_APPROVED');
  await rejectCode(runtime.publishAssessment(principal,{trainingId:training,trainingVersionId:version,passPercent:70,questions:[{questionVersionId:otherQv,objectiveId:objective,points:1}],idempotencyKey:'cross-tenant-question'}),'QUESTION_VERSION_NOT_APPROVED');
  await rejectCode(runtime.publishAssessment(principal,{trainingId:training,trainingVersionId:version,passPercent:70,questions:[{questionVersionId:questionVersions[0]!,objectiveId:otherObjective,points:1}],idempotencyKey:'wrong-objective'}),'OBJECTIVE_NOT_AVAILABLE');

  const list=await runtime.listAssessments(principal,training,version);assert.equal(list.length,1);assert.equal(list[0]?.questionCount,3);
  console.log('M7 assessment authoring PostgreSQL qualification PASS');
 }finally{await db.close();}
}
await main();
