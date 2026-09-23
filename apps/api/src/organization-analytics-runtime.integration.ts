import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createOrganizationAnalyticsRuntime, OrganizationAnalyticsError, MIN_ANALYTICS_COHORT } from './organization-analytics-runtime.js';

function env(name:string){const v=process.env[name];if(!v)throw new Error(`${name} required`);return v;}
async function rejectCode(p:Promise<unknown>,code:OrganizationAnalyticsError['code']){await assert.rejects(p,(e:unknown)=>e instanceof OrganizationAnalyticsError&&e.code===code);}

async function main(){
 const db=createDatabase(env('DATABASE_URL'));
 try{
  const tenant=randomUUID(),tenant2=randomUUID(),org=randomUUID(),org2=randomUUID(),company=randomUUID(),department=randomUUID(),group=randomUUID();
  await db.pool.query('insert into tenants(id,name,slug) values($1,$2,$3),($4,$5,$6)',[tenant,'M6 Tenant',`m6-${randomUUID()}`,tenant2,'M6 Other',`m6-${randomUUID()}`]);
  await db.pool.query("insert into organizations(id,tenant_id,name,code,default_locale,timezone) values($1,$2,'M6 Org','M6','tr-TR','Europe/Istanbul'),($3,$4,'Other Org','OTHER','tr-TR','Europe/Istanbul')",[org,tenant,org2,tenant2]);
  await db.pool.query("insert into companies(id,tenant_id,organization_id,name,code) values($1,$2,$3,'M6 Company','M6C')",[company,tenant,org]);
  await db.pool.query("insert into departments(id,tenant_id,company_id,name,code) values($1,$2,$3,'M6 Department','M6D')",[department,tenant,company]);
  await db.pool.query("insert into groups(id,tenant_id,organization_id,name,code,type) values($1,$2,$3,'Small Group','SMALL','MANUAL')",[group,tenant,org]);

  const training=randomUUID(),version=randomUUID(),objective=randomUUID(),assessment=randomUUID(),resolution=randomUUID();
  await db.pool.query("insert into trainings(id,tenant_id,title,status) values($1,$2,'M6 Training','PUBLISHED')",[training,tenant]);
  await db.pool.query("insert into learning_objectives(id,tenant_id,training_id,statement,status) values($1,$2,$3,'Recognize phishing','ACTIVE')",[objective,tenant,training]);
  await db.pool.query("insert into training_versions(id,tenant_id,training_id,version,snapshot,published_at) values($1,$2,$3,1,'{}'::jsonb,now())",[version,tenant,training]);
  await db.pool.query("insert into assessments(id,tenant_id,status,pass_percent) values($1,$2,'PUBLISHED',60)",[assessment,tenant]);
  await db.pool.query("insert into training_audience_resolutions(id,tenant_id,training_id,training_version_id,status,fingerprint,target_count,overlap_count,unique_employee_count,assignable_learner_count) values($1,$2,$3,$4,'CONFIRMED',$5,5,0,5,5)",[resolution,tenant,training,version,'a'.repeat(64)]);

  const qvs:string[]=[];
  for(let q=0;q<3;q++){
   const qid=randomUUID(),qv=randomUUID();qvs.push(qv);
   await db.pool.query("insert into questions(id,tenant_id,status) values($1,$2,'APPROVED')",[qid,tenant]);
   await db.pool.query("insert into question_versions(id,tenant_id,question_id,version,prompt,options_json,correct_option_index) values($1,$2,$3,1,$4,'[\"No\",\"Yes\"]'::jsonb,1)",[qv,tenant,qid,`Q${q+1}`]);
  }

  for(let i=0;i<5;i++){
   const user=randomUUID(),employee=randomUUID(),employment=randomUUID(),assignment=randomUUID(),attempt=randomUUID();
   await db.pool.query('insert into users(id,display_name,email,is_active) values($1,$2,$3,true)',[user,`Learner ${i+1}`,`${randomUUID()}@example.invalid`]);
   await db.pool.query("insert into employees(id,tenant_id,organization_id,first_name,last_name) values($1,$2,$3,$4,'M6')",[employee,tenant,org,`Learner ${i+1}`]);
   await db.pool.query("insert into employments(id,tenant_id,employee_id,company_id,department_id,employment_type,start_date,is_primary,status) values($1,$2,$3,$4,$5,'FULL_TIME','2026-01-01',true,'ACTIVE')",[employment,tenant,employee,company,department]);
   if(i<2)await db.pool.query("insert into group_memberships(tenant_id,group_id,employee_id,source) values($1,$2,$3,'MANUAL')",[tenant,group,employee]);
   await db.pool.query("insert into training_audience_resolution_members(tenant_id,resolution_id,employee_id,learner_user_id,source_audience_ids) values($1,$2,$3,$4,'[]'::jsonb)",[tenant,resolution,employee,user]);
   await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[assignment,tenant,user,training,version]);
   await db.pool.query("insert into training_assignment_origins(tenant_id,assignment_id,origin_type,origin_key,source_ref_id,source_fingerprint) values($1,$2,'AUDIENCE_RESOLUTION',$3,$4,$5)",[tenant,assignment,`AUDIENCE_RESOLUTION:${resolution}`,resolution,'a'.repeat(64)]);
   if(i<3)await db.pool.query("insert into training_completions(tenant_id,assignment_id,learner_id,training_id,training_version_id,evidence_snapshot,completed_at) values($1,$2,$3,$4,$5,'{}'::jsonb,now())",[tenant,assignment,user,training,version]);
   await db.pool.query("insert into attempts(id,tenant_id,assessment_id,learner_user_id,status,score_percent,submitted_at,completed_at) values($1,$2,$3,$4,'COMPLETED',$5,now(),now())",[attempt,tenant,assessment,user,i===0?100:33]);
   for(let q=0;q<3;q++){
    const correct=i===0||q===0;
    await db.pool.query("insert into objective_evidence(tenant_id,assignment_id,learner_id,training_id,training_version_id,objective_id,assessment_id,attempt_id,question_version_id,earned_points,possible_points,correct) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,$11)",[tenant,assignment,user,training,version,objective,assessment,attempt,qvs[q]!,correct?1:0,correct]);
   }
  }

  const directUser=randomUUID(),directAssignment=randomUUID();
  await db.pool.query('insert into users(id,display_name,email,is_active) values($1,$2,$3,true)',[directUser,'Direct Learner',`${randomUUID()}@example.invalid`]);
  await db.pool.query("insert into training_assignments(id,tenant_id,learner_id,training_id,training_version_id,status,assigned_at) values($1,$2,$3,$4,$5,'ACTIVE',now())",[directAssignment,tenant,directUser,training,version]);
  await db.pool.query("insert into training_assignment_origins(tenant_id,assignment_id,origin_type,origin_key) values($1,$2,'DIRECT','DIRECT')",[tenant,directAssignment]);

  const runtime=createOrganizationAnalyticsRuntime(db);
  const aggregate=await runtime.getAggregate({tenantId:tenant,userId:randomUUID()},{scopeType:'ORGANIZATION',scopeId:org,trainingVersionId:version});
  assert.equal(aggregate.privacy.suppressed,false);assert.equal(aggregate.privacy.cohortSize,MIN_ANALYTICS_COHORT);
  assert.equal(aggregate.assignmentSummary?.assigned,5);assert.equal(aggregate.assignmentSummary?.completed,3);assert.equal(aggregate.assignmentSummary?.completionRatePercent,60);
  assert.equal(aggregate.objectiveSignals.length,1);assert.equal(aggregate.objectiveSignals[0]?.qualifiedLearners,5);assert.equal(aggregate.objectiveSignals[0]?.weakLearners,4);
  assert.equal(aggregate.questionSignals.length,3);assert.equal(aggregate.unmappedAudienceAssignments,1);

  const small=await runtime.getAggregate({tenantId:tenant,userId:randomUUID()},{scopeType:'GROUP',scopeId:group,trainingVersionId:version});
  assert.equal(small.privacy.suppressed,true);assert.equal(small.privacy.cohortSize,null);assert.equal(small.assignmentSummary,null);assert.deepEqual(small.objectiveSignals,[]);

  await rejectCode(runtime.getAggregate({tenantId:tenant,userId:randomUUID()},{scopeType:'ORGANIZATION',scopeId:org2,trainingVersionId:version}),'ANALYTICS_SCOPE_NOT_AVAILABLE');
  await rejectCode(runtime.getAggregate({tenantId:tenant2,userId:randomUUID()},{scopeType:'ORGANIZATION',scopeId:org2,trainingVersionId:version}),'TRAINING_VERSION_NOT_AVAILABLE');
  console.log('Organization analytics M6 PostgreSQL qualification PASS');
 }finally{await db.close();}
}
await main();
