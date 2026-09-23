import { randomUUID } from 'node:crypto';
import type { DatabaseClient } from '@kaep/db';
import {
  TrainingAudienceResolver,
  TrainingAudienceInvariantError,
  type TrainingAudienceRepository,
  type TrainingAudienceTarget,
} from '@kaep/organization-management';

export type AudiencePrincipal={tenantId:string;userId:string};
export const AUDIENCE_CONFIRM_OPERATION='TRAINING_AUDIENCE_CONFIRM';
export class AudienceRuntimeError extends Error {
  constructor(public readonly code:
    'TRAINING_VERSION_NOT_AVAILABLE'|'RESOLUTION_FINGERPRINT_MISMATCH'|'IDEMPOTENCY_CONFLICT'|'AUDIENCE_NOT_AVAILABLE'){super(code);}
}

function key(target:TrainingAudienceTarget){return `${target.type}:${target.id}`;}

export function createAudienceRuntime(database:DatabaseClient){
 const q=(sql:string,params:readonly unknown[]=[])=>database.pool.query(sql,[...params]);

 const candidateSelect=`select e.id as "employeeId",e.tenant_id as "tenantId",e.organization_id as "organizationId",
   case when m.status='active' and u.is_active=true then l.user_id else null end as "learnerUserId"
   from employees e
   left join employee_user_links l on l.tenant_id=e.tenant_id and l.employee_id=e.id and l.valid_until is null
   left join memberships m on m.tenant_id=l.tenant_id and m.user_id=l.user_id
   left join users u on u.id=l.user_id`;

 const repo:TrainingAudienceRepository={
  async getTargetScope(target){
   if(target.type==='ORGANIZATION'){
    const r=await q("select tenant_id as \"tenantId\",id as \"organizationId\",(status='ACTIVE') as active from organizations where id=$1",[target.id]);return r.rows[0]??null;
   }
   if(target.type==='COMPANY'){
    const r=await q("select c.tenant_id as \"tenantId\",c.organization_id as \"organizationId\",(c.status='ACTIVE' and o.status='ACTIVE') as active from companies c join organizations o on o.tenant_id=c.tenant_id and o.id=c.organization_id where c.id=$1",[target.id]);return r.rows[0]??null;
   }
   if(target.type==='DEPARTMENT'){
    const r=await q("select d.tenant_id as \"tenantId\",c.organization_id as \"organizationId\",(d.status='ACTIVE' and c.status='ACTIVE') as active from departments d join companies c on c.tenant_id=d.tenant_id and c.id=d.company_id where d.id=$1",[target.id]);return r.rows[0]??null;
   }
   if(target.type==='GROUP'){
    const r=await q("select tenant_id as \"tenantId\",organization_id as \"organizationId\",(status='ACTIVE') as active from groups where id=$1",[target.id]);return r.rows[0]??null;
   }
   const r=await q("select tenant_id as \"tenantId\",organization_id as \"organizationId\",(status='ACTIVE') as active from employees where id=$1",[target.id]);return r.rows[0]??null;
  },
  async listActiveEmployeesForOrganization(organizationId){
   return (await q(`${candidateSelect} where e.organization_id=$1 and e.status='ACTIVE'`,[organizationId])).rows;
  },
  async listActiveEmployeesForCompany(companyId){
   return (await q(`${candidateSelect} join employments emp on emp.tenant_id=e.tenant_id and emp.employee_id=e.id
     where emp.company_id=$1 and emp.is_primary=true and emp.end_date is null and emp.status='ACTIVE' and e.status='ACTIVE'`,[companyId])).rows;
  },
  async listActiveEmployeesForDepartment(departmentId){
   return (await q(`${candidateSelect} join employments emp on emp.tenant_id=e.tenant_id and emp.employee_id=e.id
     where emp.department_id=$1 and emp.is_primary=true and emp.end_date is null and emp.status='ACTIVE' and e.status='ACTIVE'`,[departmentId])).rows;
  },
  async listActiveEmployeesForGroup(groupId){
   return (await q(`${candidateSelect} join group_memberships gm on gm.tenant_id=e.tenant_id and gm.employee_id=e.id
     where gm.group_id=$1 and gm.valid_until is null and e.status='ACTIVE'`,[groupId])).rows;
  },
  async getActiveEmployee(employeeId){
   return (await q(`${candidateSelect} where e.id=$1 and e.status='ACTIVE'`,[employeeId])).rows[0]??null;
  },
 };
 const resolver=new TrainingAudienceResolver(repo);

 async function assertTrainingVersion(p:AudiencePrincipal,trainingId:string,trainingVersionId:string){
  const r=await q('select id from training_versions where tenant_id=$1 and training_id=$2 and id=$3',[p.tenantId,trainingId,trainingVersionId]);
  if(!r.rowCount)throw new AudienceRuntimeError('TRAINING_VERSION_NOT_AVAILABLE');
 }
 async function handoff(tenantId:string,resolutionId:string){
  const r=await q(`select id,tenant_id as "tenantId",training_id as "trainingId",training_version_id as "trainingVersionId",fingerprint
    from training_audience_resolutions where tenant_id=$1 and id=$2 and status='CONFIRMED'`,[tenantId,resolutionId]);
  const resolution=r.rows[0]; if(!resolution)throw new AudienceRuntimeError('AUDIENCE_NOT_AVAILABLE');
  const members=(await q('select employee_id as "employeeId",learner_user_id as "learnerUserId" from training_audience_resolution_members where tenant_id=$1 and resolution_id=$2 order by employee_id',[tenantId,resolutionId])).rows;
  return {
   tenantId,trainingId:resolution.trainingId,trainingVersionId:resolution.trainingVersionId,resolutionId,
   resolutionFingerprint:resolution.fingerprint,
   assignmentCandidateLearnerIds:members.map((m:any)=>m.learnerUserId).filter((x:any):x is string=>typeof x==='string'),
   unlinkedEmployeeIds:members.filter((m:any)=>!m.learnerUserId).map((m:any)=>m.employeeId),
  };
 }

 return {
  async preview(p:AudiencePrincipal,input:{organizationId:string;trainingId:string;trainingVersionId:string;targets:TrainingAudienceTarget[]}){
   await assertTrainingVersion(p,input.trainingId,input.trainingVersionId);
   return resolver.preview({tenantId:p.tenantId,organizationId:input.organizationId,targets:input.targets});
  },
  async confirm(p:AudiencePrincipal,input:{organizationId:string;trainingId:string;trainingVersionId:string;targets:TrainingAudienceTarget[];resolutionFingerprint:string;idempotencyKey:string}){
   if(!input.idempotencyKey.trim())throw new AudienceRuntimeError('IDEMPOTENCY_CONFLICT');
   await assertTrainingVersion(p,input.trainingId,input.trainingVersionId);
   const preview=await resolver.preview({tenantId:p.tenantId,organizationId:input.organizationId,targets:input.targets});
   if(preview.fingerprint!==input.resolutionFingerprint)throw new AudienceRuntimeError('RESOLUTION_FINGERPRINT_MISMATCH');
   const signature=`${input.trainingId}:${input.trainingVersionId}:${preview.fingerprint}`;
   const resolutionId=randomUUID();
   const client=await database.pool.connect();
   try{
    await client.query('begin');
    const claimed=await client.query(`insert into command_idempotency(tenant_id,operation,idempotency_key,resource_id,result_ref)
      values($1,$2,$3,$4,$5) on conflict(tenant_id,operation,idempotency_key) do nothing returning resource_id`,
      [p.tenantId,AUDIENCE_CONFIRM_OPERATION,input.idempotencyKey,resolutionId,signature]);
    if(!claimed.rowCount){
     const existing=await client.query('select resource_id,result_ref from command_idempotency where tenant_id=$1 and operation=$2 and idempotency_key=$3',[p.tenantId,AUDIENCE_CONFIRM_OPERATION,input.idempotencyKey]);
     await client.query('commit');
     if(existing.rows[0]?.result_ref!==signature)throw new AudienceRuntimeError('IDEMPOTENCY_CONFLICT');
     return handoff(p.tenantId,existing.rows[0].resource_id);
    }
    await client.query(`insert into training_audience_resolutions
      (id,tenant_id,training_id,training_version_id,status,fingerprint,target_count,overlap_count,unique_employee_count,assignable_learner_count,created_by_user_id)
      values($1,$2,$3,$4,'CONFIRMED',$5,$6,$7,$8,$9,$10)`,
      [resolutionId,p.tenantId,input.trainingId,input.trainingVersionId,preview.fingerprint,preview.targetCount,preview.overlapCount,preview.uniqueEmployeeCount,preview.assignableLearnerCount,p.userId]);
    const targetIds=new Map<string,string>();
    for(const target of input.targets){
     const audienceId=randomUUID();targetIds.set(key(target),audienceId);
     const cols:{organizationId:string|null;companyId:string|null;departmentId:string|null;groupId:string|null;employeeId:string|null}={organizationId:null,companyId:null,departmentId:null,groupId:null,employeeId:null};
     if(target.type==='ORGANIZATION')cols.organizationId=target.id;
     else if(target.type==='COMPANY')cols.companyId=target.id;
     else if(target.type==='DEPARTMENT')cols.departmentId=target.id;
     else if(target.type==='GROUP')cols.groupId=target.id;
     else cols.employeeId=target.id;
     await client.query(`insert into training_assignment_audiences
       (id,tenant_id,training_id,training_version_id,target_type,organization_id,company_id,department_id,group_id,employee_id,created_by_user_id)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
       [audienceId,p.tenantId,input.trainingId,input.trainingVersionId,target.type,cols.organizationId,cols.companyId,cols.departmentId,cols.groupId,cols.employeeId,p.userId]);
    }
    for(const member of preview.members){
     await client.query(`insert into training_audience_resolution_members
       (tenant_id,resolution_id,employee_id,learner_user_id,source_audience_ids)
       values($1,$2,$3,$4,$5::jsonb)`,
       [p.tenantId,resolutionId,member.employeeId,member.learnerUserId,JSON.stringify(member.sourceTargets.map(t=>targetIds.get(t)).filter(Boolean))]);
    }
    await client.query('commit');
    return handoff(p.tenantId,resolutionId);
   }catch(error){try{await client.query('rollback');}catch{}throw error;}finally{client.release();}
  },
 };
}

export { TrainingAudienceInvariantError };
