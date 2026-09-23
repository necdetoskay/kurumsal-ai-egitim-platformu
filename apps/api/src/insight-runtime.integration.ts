import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createInsightRuntime, InsightRuntimeError } from './insight-runtime.js';

function env(name:string){const v=process.env[name];if(!v)throw new Error(`${name} required`);return v;}
async function seedUser(pool:any,id:string,label:string){await pool.query('insert into users(id,display_name,email,is_active) values($1,$2,$3,true)',[id,label,`${randomUUID()}@example.invalid`]);}
async function rejectCode(p:Promise<unknown>,code:InsightRuntimeError['code']){await assert.rejects(p,(e:unknown)=>e instanceof InsightRuntimeError&&e.code===code);}

async function main(){
 const db=createDatabase(env('DATABASE_URL'));
 try{
  const tenant=randomUUID(),learnerA=randomUUID(),learnerB=randomUUID(),unassigned=randomUUID();
  await db.pool.query('insert into tenants(id,name,slug) values($1,$2,$3)',[tenant,'M5 Tenant',`m5-${randomUUID()}`]);
  await seedUser(db.pool,learnerA,'Insight A');await seedUser(db.pool,learnerB,'Insight B');await seedUser(db.pool,unassigned,'Insight None');
  const training=randomUUID(),version=randomUUID(),objective=randomUUID(),moduleId=randomUUID(),contentId=randomUUID();
  const snapshot={title:'M5 Training',objectives:[{id:objective,tenantId:tenant,trainingId:training,statement:'Detect phishing',active:true}],modules:[{id:moduleId,tenantId:tenant,trainingId:training,title:'Phishing',position:1,active:true}],contents:[{id:contentId,tenantId:tenant,trainingId:training,moduleId,title:'Phishing refresher',type:'VIDEO',position:1,active:true,objectiveIds:[objective]}]};
  await db.pool.query("insert into trainings(id,tenant_id,title,status) values($1,$2,'M5 Training','PUBLISHED')",[training,tenant]);
  await db.pool.query("insert into learning_objectives(id,tenant_id,training_id,statement,status) values($1,$2,$3,'Detect phishing','ACTIVE')",[objective,tenant,training]);
  await db.pool.query('insert into training_versions(id,tenant_id,training_id,version,snapshot,published_at) values($1,$2,$3,1,$4::jsonb,now())',[version,tenant,training,JSON.stringify(snapshot)]);
  const assignmentA=randomUUID(),assignmentB=randomUUID();
  await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[assignmentA,tenant,learnerA,training,version]);
  await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[assignmentB,tenant,learnerB,training,version]);
  const assessment=randomUUID(); await db.pool.query("insert into assessments(id,tenant_id,status,pass_percent) values($1,$2,'PUBLISHED',60)",[assessment,tenant]);
  const attemptA=randomUUID(),attemptB=randomUUID();
  await db.pool.query("insert into attempts(id,tenant_id,assessment_id,learner_user_id,status,score_percent,submitted_at,completed_at) values($1,$2,$3,$4,'COMPLETED',33,now(),now())",[attemptA,tenant,assessment,learnerA]);
  await db.pool.query("insert into attempts(id,tenant_id,assessment_id,learner_user_id,status,score_percent,submitted_at,completed_at) values($1,$2,$3,$4,'COMPLETED',0,now(),now())",[attemptB,tenant,assessment,learnerB]);

  const versions:string[]=[];
  for(let i=0;i<3;i++){
    const qid=randomUUID(),qv=randomUUID();versions.push(qv);
    await db.pool.query("insert into questions(id,tenant_id,status) values($1,$2,'APPROVED')",[qid,tenant]);
    await db.pool.query('insert into question_versions(id,tenant_id,question_id,version,prompt,options_json,correct_option_index) values($1,$2,$3,1,$4,$5::jsonb,1)',[qv,tenant,qid,`Q${i+1}`,JSON.stringify(['No','Yes'])]);
    await db.pool.query('insert into assessment_question_snapshots(tenant_id,assessment_id,question_id,question_version_id,objective_id,position,prompt,options_json,correct_option_index,points) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb,1,1)',[tenant,assessment,qid,qv,objective,i+1,`Q${i+1}`,JSON.stringify(['No','Yes'])]);
    await db.pool.query('insert into objective_evidence(tenant_id,assignment_id,learner_id,training_id,training_version_id,objective_id,assessment_id,attempt_id,question_version_id,earned_points,possible_points,correct) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,$11)',[tenant,assignmentA,learnerA,training,version,objective,assessment,attemptA,qv,i===0?1:0,i===0]);
  }
  await db.pool.query('insert into objective_evidence(tenant_id,assignment_id,learner_id,training_id,training_version_id,objective_id,assessment_id,attempt_id,question_version_id,earned_points,possible_points,correct) values($1,$2,$3,$4,$5,$6,$7,$8,$9,0,1,false)',[tenant,assignmentB,learnerB,training,version,objective,assessment,attemptB,versions[0]!]);

  const runtime=createInsightRuntime(db);
  const a=await runtime.getInsights({tenantId:tenant,userId:learnerA},version);
  assert.equal(a.status,'BOUNDED_INSIGHT');assert.equal(a.insights.length,1);assert.equal(a.insights[0]!.sampleCount,3);assert.equal(a.insights[0]!.weak,true);assert.equal(a.recommendations.length,1);assert.equal(a.recommendations[0]!.contentId,contentId);
  const b=await runtime.getInsights({tenantId:tenant,userId:learnerB},version);
  assert.equal(b.status,'INSUFFICIENT_EVIDENCE');assert.equal(b.insights.length,0);assert.equal(b.recommendations.length,0);
  await rejectCode(runtime.getInsights({tenantId:tenant,userId:unassigned},version),'TRAINING_NOT_AVAILABLE');
  console.log('Insight M5 PostgreSQL qualification PASS');
 }finally{await db.close();}
}
await main();
