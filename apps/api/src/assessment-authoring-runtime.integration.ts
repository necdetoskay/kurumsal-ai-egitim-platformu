import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createAssessmentAuthoringRuntime, AssessmentAuthoringError } from './assessment-authoring-runtime.js';
import { createAssessmentRuntime } from './assessment-runtime.js';

function env(name:string){const v=process.env[name];if(!v)throw new Error(`${name} required`);return v;}
async function rejectCode(p:Promise<unknown>,code:AssessmentAuthoringError['code']){
  await assert.rejects(p,(e:unknown)=>e instanceof AssessmentAuthoringError&&e.code===code);
}
async function count(pool:any,sql:string,params:unknown[]=[]){const r=await pool.query(sql,params);return Number(r.rows[0]?.count??0);}

async function main(){
 const db=createDatabase(env('DATABASE_URL'));
 try{
  const tenant=randomUUID(),tenant2=randomUUID(),training=randomUUID(),version=randomUUID(),objective=randomUUID();
  await db.pool.query('insert into tenants(id,name,slug) values($1,$2,$3),($4,$5,$6)',[tenant,'M7 Assessment Tenant',`m7as-${randomUUID()}`,tenant2,'M7 Other',`m7ao-${randomUUID()}`]);
  await db.pool.query("insert into trainings(id,tenant_id,title,status) values($1,$2,'M7 Published Training','PUBLISHED')",[training,tenant]);
  await db.pool.query("insert into learning_objectives(id,tenant_id,training_id,statement,status) values($1,$2,$3,'Recognize phishing','ACTIVE')",[objective,tenant,training]);
  const snapshot={title:'M7 Published Training',objectives:[{id:objective,tenantId:tenant,trainingId:training,statement:'Recognize phishing',active:true}],modules:[],contents:[]};
  await db.pool.query('insert into training_versions(id,tenant_id,training_id,version,snapshot,published_at) values($1,$2,$3,1,$4::jsonb,now())',[version,tenant,training,JSON.stringify(snapshot)]);

  const runtime=createAssessmentAuthoringRuntime(db);
  const principal={tenantId:tenant,userId:randomUUID()};
  const question=await runtime.createQuestion(principal,{prompt:'Which is a phishing indicator?',options:['Expected domain','Urgent credential request'],correctOptionIndex:1});
  assert.equal(question.status,'DRAFT');assert.equal(question.versions.length,1);
  const questionVersionId=question.versions[0]!.id;

  await rejectCode(runtime.getQuestion({tenantId:tenant2,userId:randomUUID()},question.id),'QUESTION_NOT_FOUND');
  const review=await runtime.submitQuestionReview(principal,question.id);assert.equal(review.status,'IN_REVIEW');

  const blockedAssessment=await runtime.createAssessment(principal,{title:'Blocked Assessment',passPercent:60});
  await rejectCode(runtime.publishAssessment(principal,blockedAssessment.id,{
    trainingId:training,trainingVersionId:version,questions:[{questionVersionId,objectiveId:objective,points:1}],
  }),'QUESTION_NOT_APPROVED');

  const approved=await runtime.approveQuestion(principal,question.id);assert.equal(approved.status,'APPROVED');
  const assessment=await runtime.createAssessment(principal,{title:'Phishing Final',passPercent:60});
  assert.equal(assessment.status,'DRAFT');assert.equal(assessment.title,'Phishing Final');

  const published=await runtime.publishAssessment(principal,assessment.id,{
    trainingId:training,trainingVersionId:version,required:true,
    questions:[{questionVersionId,objectiveId:objective,points:2}],
  });
  assert.equal(published.status,'PUBLISHED');assert.equal(published.replayed,false);
  assert.equal(published.link.trainingVersionId,version);assert.equal(published.questions.length,1);
  assert.equal(published.questions[0]?.objectiveId,objective);assert.equal(published.questions[0]?.prompt,'Which is a phishing indicator?');

  const replay=await runtime.publishAssessment(principal,assessment.id,{
    trainingId:randomUUID(),trainingVersionId:randomUUID(),questions:[],
  });
  assert.equal(replay.replayed,true);assert.equal(replay.questions.length,1);
  assert.equal(await count(db.pool,'select count(*) from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2',[tenant,assessment.id]),1);
  assert.equal(await count(db.pool,'select count(*) from training_assessments where tenant_id=$1 and assessment_id=$2',[tenant,assessment.id]),1);

  await rejectCode(runtime.getAssessment({tenantId:tenant2,userId:randomUUID()},assessment.id),'ASSESSMENT_NOT_FOUND');

  const learner=randomUUID(),assignment=randomUUID();
  await db.pool.query('insert into users(id,display_name,email,is_active) values($1,$2,$3,true)',[learner,'M7 Learner',`${randomUUID()}@example.invalid`]);
  await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[assignment,tenant,learner,training,version]);
  const learnerRuntime=createAssessmentRuntime(db);
  const learnerAssessments=await learnerRuntime.listAssessments({tenantId:tenant,userId:learner});
  assert.equal(learnerAssessments.length,1);
  const safe:any=learnerAssessments[0]?.questions[0];
  assert.equal(safe.prompt,'Which is a phishing indicator?');
  assert.equal('correctOptionIndex' in safe,false);

  const foreignObjective=randomUUID(),foreignTraining=randomUUID();
  await db.pool.query("insert into trainings(id,tenant_id,title,status) values($1,$2,'Other Training','PUBLISHED')",[foreignTraining,tenant]);
  await db.pool.query("insert into learning_objectives(id,tenant_id,training_id,statement,status) values($1,$2,$3,'Other objective','ACTIVE')",[foreignObjective,tenant,foreignTraining]);
  const second=await runtime.createAssessment(principal,{title:'Invalid Objective Assessment',passPercent:50});
  await rejectCode(runtime.publishAssessment(principal,second.id,{
    trainingId:training,trainingVersionId:version,questions:[{questionVersionId,objectiveId:foreignObjective,points:1}],
  }),'OBJECTIVE_NOT_FOUND');

  console.log('M7 assessment authoring PostgreSQL qualification PASS');
 } finally { await db.close(); }
}
await main();
