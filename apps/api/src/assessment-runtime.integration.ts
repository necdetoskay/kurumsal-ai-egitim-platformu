import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createAssessmentRuntime, AssessmentRuntimeError } from './assessment-runtime.js';

function env(name:string){const v=process.env[name];if(!v)throw new Error(`${name} required`);return v;}
async function rejectCode(p:Promise<unknown>,code:AssessmentRuntimeError['code']){await assert.rejects(p,(e:unknown)=>e instanceof AssessmentRuntimeError&&e.code===code);}
async function seedTenant(pool:any,id:string){await pool.query('insert into tenants(id,name,slug) values($1,$2,$3)',[id,'M3 Tenant',`m3-${randomUUID()}`]);}
async function seedUser(pool:any,id:string,label:string){await pool.query('insert into users(id,display_name,email,is_active) values($1,$2,$3,true)',[id,label,`${randomUUID()}@example.invalid`]);}

async function main(){
 const db=createDatabase(env('DATABASE_URL'));
 try{
  const tenant=randomUUID(),learnerA=randomUUID(),learnerB=randomUUID(),otherUser=randomUUID();
  await seedTenant(db.pool,tenant); await seedUser(db.pool,learnerA,'M3 Learner A'); await seedUser(db.pool,learnerB,'M3 Learner B'); await seedUser(db.pool,otherUser,'M3 Other');
  const training=randomUUID(),version=randomUUID(),moduleId=randomUUID(),objectiveId=randomUUID();
  const snapshot={title:'M3 Training',objectives:[],modules:[{id:moduleId,tenantId:tenant,trainingId:training,title:'Module',position:1,active:true}]};
  await db.pool.query("insert into trainings(id,tenant_id,title,status) values($1,$2,'M3 Training','PUBLISHED')",[training,tenant]);
  await db.pool.query("insert into learning_objectives(id,tenant_id,training_id,statement,status) values($1,$2,$3,'Know the correct option','ACTIVE')",[objectiveId,tenant,training]);
  await db.pool.query('insert into training_versions(id,tenant_id,training_id,version,snapshot,published_at) values($1,$2,$3,1,$4::jsonb,now())',[version,tenant,training,JSON.stringify(snapshot)]);
  const assignmentA=randomUUID(),assignmentB=randomUUID();
  await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[assignmentA,tenant,learnerA,training,version]);
  await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[assignmentB,tenant,learnerB,training,version]);
  await db.pool.query("insert into learning_progress(tenant_id,assignment_id,learner_id,training_id,training_version_id,kind,source_id,progress_permille,completed) values($1,$2,$3,$4,$5,'MODULE',$6,1000,true)",[tenant,assignmentA,learnerA,training,version,moduleId]);

  const question=randomUUID(),qv=randomUUID(),assessment=randomUUID();
  await db.pool.query("insert into questions(id,tenant_id,status) values($1,$2,'APPROVED')",[question,tenant]);
  await db.pool.query('insert into question_versions(id,tenant_id,question_id,version,prompt,options_json,correct_option_index) values($1,$2,$3,1,$4,$5::jsonb,1)',[qv,tenant,question,'Correct option?',JSON.stringify(['No','Yes'])]);
  await db.pool.query("insert into assessments(id,tenant_id,status,pass_percent) values($1,$2,'PUBLISHED',60)",[assessment,tenant]);
  await db.pool.query('insert into assessment_question_snapshots(tenant_id,assessment_id,question_id,question_version_id,objective_id,position,prompt,options_json,correct_option_index,points) values($1,$2,$3,$4,$5,1,$6,$7::jsonb,1,1)',[tenant,assessment,question,qv,objectiveId,'Correct option?',JSON.stringify(['No','Yes'])]);
  await db.pool.query('insert into training_assessments(tenant_id,training_id,training_version_id,assessment_id,required) values($1,$2,$3,$4,true)',[tenant,training,version,assessment]);

  const runtime=createAssessmentRuntime(db),pA={tenantId:tenant,userId:learnerA},pB={tenantId:tenant,userId:learnerB};
  const listing=await runtime.listAssessments(pA);
  assert.equal(listing.length,1);
  assert.equal('correctOptionIndex' in listing[0].questions[0],false);

  const attemptA:any=await runtime.startAttempt(pA,assessment);
  assert.equal(attemptA.status,'IN_PROGRESS');
  assert.equal(attemptA.questions.some((x:any)=>'correctOptionIndex' in x),false);
  await rejectCode(runtime.getAttempt({tenantId:tenant,userId:otherUser},attemptA.id),'ATTEMPT_NOT_AVAILABLE');
  await runtime.saveAnswer(pA,attemptA.id,qv,1);
  const resultA=await runtime.submitAttempt(pA,attemptA.id);
  assert.equal(resultA.scorePercent,100); assert.equal(resultA.passed,true); assert.equal(resultA.replayed,false);
  await rejectCode(runtime.saveAnswer(pA,attemptA.id,qv,0),'ATTEMPT_NOT_MUTABLE');
  const replay=await runtime.submitAttempt(pA,attemptA.id); assert.equal(replay.replayed,true); assert.equal(replay.scorePercent,100);
  const objectiveReplay=await db.pool.query('select count(*)::int as count from objective_evidence where tenant_id=$1 and attempt_id=$2',[tenant,attemptA.id]); assert.equal(objectiveReplay.rows[0].count,1);
  const certs=await runtime.listCertificates(pA); assert.equal(certs.length,1);
  const evidence=await db.pool.query("select count(*)::int as count from learning_evidence where tenant_id=$1 and assignment_id=$2 and type='ASSESSMENT_RESULT'",[tenant,assignmentA]); assert.equal(evidence.rows[0].count,1);
  const objectiveEvidence=await db.pool.query('select count(*)::int as count from objective_evidence where tenant_id=$1 and assignment_id=$2 and objective_id=$3 and attempt_id=$4',[tenant,assignmentA,objectiveId,attemptA.id]); assert.equal(objectiveEvidence.rows[0].count,1);
  const completion=await db.pool.query('select count(*)::int as count from training_completions where tenant_id=$1 and assignment_id=$2',[tenant,assignmentA]); assert.equal(completion.rows[0].count,1);

  const attemptB:any=await runtime.startAttempt(pB,assessment);
  await runtime.saveAnswer(pB,attemptB.id,qv,0);
  const resultB=await runtime.submitAttempt(pB,attemptB.id); assert.equal(resultB.passed,false);
  const retake1=await runtime.requestRetake(pB,attemptB.id); const retake2=await runtime.requestRetake(pB,attemptB.id);
  assert.equal(retake1.id,retake2.id);
  const prior=await runtime.getAttempt(pB,attemptB.id); assert.equal(prior.status,'COMPLETED'); assert.equal(prior.scorePercent,0);
  assert.equal((await runtime.listCertificates(pB)).length,0);

  console.log('Assessment M3 PostgreSQL qualification PASS');
 } finally { await db.close(); }
}
await main();
