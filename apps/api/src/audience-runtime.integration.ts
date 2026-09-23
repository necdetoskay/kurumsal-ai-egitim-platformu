import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createOrganizationRuntime } from './organization-runtime.js';
import { createAudienceRuntime, AudienceRuntimeError, TrainingAudienceInvariantError } from './audience-runtime.js';
import { persistConfirmedAudienceAssignments } from './audience-assignment-persistence.js';

function env(name:string){const v=process.env[name];if(!v)throw new Error(`${name} required`);return v;}
async function rejectCode(p:Promise<unknown>,code:string){
  await assert.rejects(p,(e:unknown)=>
    (e instanceof AudienceRuntimeError||e instanceof TrainingAudienceInvariantError) && e.code===code);
}
async function count(pool:any,sql:string,params:unknown[]=[]){
  const r=await pool.query(sql,params);return Number(r.rows[0]?.count??0);
}

async function main(){
 const db=createDatabase(env('DATABASE_URL'));
 try{
  const tenant=randomUUID(),tenant2=randomUUID();
  const admin=randomUUID(),learner=randomUUID(),learner2=randomUUID();
  await db.pool.query('insert into tenants(id,name,slug) values($1,$2,$3),($4,$5,$6)',[tenant,'M7 Tenant',`m7-${randomUUID()}`,tenant2,'M7 Other',`m7-${randomUUID()}`]);
  await db.pool.query('insert into users(id,display_name,email,is_active) values($1,$2,$3,true),($4,$5,$6,true),($7,$8,$9,true)',[
    admin,'M7 Admin',`${randomUUID()}@example.invalid`,
    learner,'M7 Learner',`${randomUUID()}@example.invalid`,
    learner2,'Other Learner',`${randomUUID()}@example.invalid`,
  ]);
  await db.pool.query("insert into memberships(tenant_id,user_id,status) values($1,$2,'active'),($1,$3,'active'),($4,$5,'active')",[tenant,admin,learner,tenant2,learner2]);

  const org=randomUUID(),org2=randomUUID(),company=randomUUID(),department=randomUUID(),group=randomUUID();
  await db.pool.query("insert into organizations(id,tenant_id,name,code,default_locale,timezone) values($1,$2,'M7 Org','M7','tr-TR','Europe/Istanbul'),($3,$4,'Other Org','OTHER','tr-TR','Europe/Istanbul')",[org,tenant,org2,tenant2]);
  await db.pool.query("insert into companies(id,tenant_id,organization_id,name,code) values($1,$2,$3,'M7 Company','M7C')",[company,tenant,org]);
  await db.pool.query("insert into departments(id,tenant_id,company_id,name,code) values($1,$2,$3,'M7 Department','M7D')",[department,tenant,company]);
  await db.pool.query("insert into groups(id,tenant_id,organization_id,name,code,type) values($1,$2,$3,'M7 Group','M7G','MANUAL')",[group,tenant,org]);

  const employee1=randomUUID(),employee2=randomUUID(),employment1=randomUUID(),employment2=randomUUID();
  await db.pool.query("insert into employees(id,tenant_id,organization_id,first_name,last_name,status) values($1,$2,$3,'Linked','Learner','ACTIVE'),($4,$2,$3,'Unlinked','Learner','ACTIVE')",[employee1,tenant,org,employee2]);
  await db.pool.query("insert into employments(id,tenant_id,employee_id,company_id,department_id,employment_type,start_date,is_primary,status) values($1,$2,$3,$4,$5,'FULL_TIME','2026-01-01',true,'ACTIVE'),($6,$2,$7,$4,$5,'FULL_TIME','2026-01-01',true,'ACTIVE')",[employment1,tenant,employee1,company,department,employment2,employee2]);
  await db.pool.query("insert into group_memberships(tenant_id,group_id,employee_id,source) values($1,$2,$3,'MANUAL')",[tenant,group,employee1]);

  const orgRuntime=createOrganizationRuntime(db);
  const adminPrincipal={tenantId:tenant,userId:admin};
  const link=await orgRuntime.linkEmployeeUser(adminPrincipal,employee1,learner);
  assert.equal(link?.user_id,learner);
  const replayLink=await orgRuntime.linkEmployeeUser(adminPrincipal,employee1,learner);
  assert.equal(replayLink?.id,link?.id);
  const crossTenantLink=await orgRuntime.linkEmployeeUser(adminPrincipal,employee2,learner2);
  assert.equal(crossTenantLink,null);
  assert.equal(await count(db.pool,"select count(*) from organization_audit_events where tenant_id=$1 and action='EMPLOYEE_USER_LINKED'",[tenant]),2);

  const training=randomUUID(),version=randomUUID();
  await db.pool.query("insert into trainings(id,tenant_id,title,status) values($1,$2,'M7 Training','PUBLISHED')",[training,tenant]);
  await db.pool.query("insert into training_versions(id,tenant_id,training_id,version,snapshot,published_at) values($1,$2,$3,1,'{}'::jsonb,now())",[version,tenant,training]);

  const runtime=createAudienceRuntime(db);
  const targets=[{type:'DEPARTMENT' as const,id:department},{type:'GROUP' as const,id:group}];
  const preview=await runtime.preview(adminPrincipal,{organizationId:org,trainingId:training,trainingVersionId:version,targets});
  assert.equal(preview.expandedCandidateCount,3);
  assert.equal(preview.uniqueEmployeeCount,2);
  assert.equal(preview.overlapCount,1);
  assert.equal(preview.assignableLearnerCount,1);
  assert.deepEqual(preview.unlinkedEmployeeIds,[employee2]);

  await rejectCode(runtime.preview(adminPrincipal,{organizationId:org,trainingId:training,trainingVersionId:version,targets:[{type:'ORGANIZATION',id:org2}]}),'CROSS_TENANT_REFERENCE');

  const confirmed=await runtime.confirm(adminPrincipal,{
    organizationId:org,trainingId:training,trainingVersionId:version,targets,
    resolutionFingerprint:preview.fingerprint,idempotencyKey:'m7-confirm-1',
  });
  assert.equal(confirmed.assignmentCandidateLearnerIds.length,1);
  assert.deepEqual(confirmed.assignmentCandidateLearnerIds,[learner]);
  assert.deepEqual(confirmed.unlinkedEmployeeIds,[employee2]);

  await db.pool.query('update group_memberships set valid_until=now() where tenant_id=$1 and group_id=$2 and employee_id=$3 and valid_until is null',[tenant,group,employee1]);
  const replay=await runtime.confirm(adminPrincipal,{
    organizationId:org,trainingId:training,trainingVersionId:version,targets,
    resolutionFingerprint:preview.fingerprint,idempotencyKey:'m7-confirm-1',
  });
  assert.equal(replay.resolutionId,confirmed.resolutionId);
  assert.deepEqual(replay.assignmentCandidateLearnerIds,[learner]);
  assert.equal(await count(db.pool,'select count(*) from training_audience_resolutions where tenant_id=$1 and id=$2',[tenant,confirmed.resolutionId]),1);

  await rejectCode(runtime.confirm(adminPrincipal,{
    organizationId:org,trainingId:training,trainingVersionId:version,targets,
    resolutionFingerprint:'f'.repeat(64),idempotencyKey:'m7-confirm-1',
  }),'IDEMPOTENCY_CONFLICT');

  const assignment=await persistConfirmedAudienceAssignments(db,{
    tenantId:tenant,trainingId:training,trainingVersionId:version,
    resolutionId:confirmed.resolutionId,resolutionFingerprint:confirmed.resolutionFingerprint,
    idempotencyKey:'m7-assign-1',
  });
  assert.equal(assignment.result.createdCount,1);
  assert.deepEqual(assignment.result.unlinkedEmployeeIds,[employee2]);
  assert.equal(await count(db.pool,'select count(*) from training_assignments where tenant_id=$1 and learner_id=$2 and training_version_id=$3',[tenant,learner,version]),1);
  assert.equal(await count(db.pool,"select count(*) from training_assignment_origins where tenant_id=$1 and source_ref_id=$2 and origin_type='AUDIENCE_RESOLUTION'",[tenant,confirmed.resolutionId]),1);

  const unlinked=await orgRuntime.unlinkEmployeeUser(adminPrincipal,employee1);
  assert.equal(unlinked?.employee_id,employee1);
  const relink=await orgRuntime.linkEmployeeUser(adminPrincipal,employee1,learner);
  assert.notEqual(relink?.id,link?.id);
  assert.equal(await count(db.pool,'select count(*) from employee_user_links where tenant_id=$1 and employee_id=$2',[tenant,employee1]),2);
  assert.equal(await count(db.pool,'select count(*) from employee_user_links where tenant_id=$1 and employee_id=$2 and valid_until is null',[tenant,employee1]),1);

  console.log('M7 employee-user and audience resolution PostgreSQL qualification PASS');
 } finally { await db.close(); }
}
await main();
