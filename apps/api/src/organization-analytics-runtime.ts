import type { DatabaseClient } from '@kaep/db';

export const MIN_ANALYTICS_COHORT = 5;
export const MIN_OBJECTIVE_EVIDENCE = 3;
export type AnalyticsScopeType = 'ORGANIZATION'|'COMPANY'|'DEPARTMENT'|'GROUP';
export type AnalyticsPrincipal = { tenantId:string; userId:string };
export class OrganizationAnalyticsError extends Error {
  constructor(public readonly code:'ANALYTICS_SCOPE_NOT_AVAILABLE'|'TRAINING_VERSION_NOT_AVAILABLE'){ super(code); }
}

const scopeTable:Record<AnalyticsScopeType,string>={
  ORGANIZATION:'organizations', COMPANY:'companies', DEPARTMENT:'departments', GROUP:'groups',
};
const scopeColumn:Record<AnalyticsScopeType,string>={
  ORGANIZATION:'e.organization_id', COMPANY:'emp.company_id', DEPARTMENT:'emp.department_id', GROUP:'gm.group_id',
};
const scopeBasis:Record<AnalyticsScopeType,string>={
  ORGANIZATION:'EMPLOYEE_ORGANIZATION',
  COMPANY:'CURRENT_PRIMARY_EMPLOYMENT',
  DEPARTMENT:'CURRENT_PRIMARY_EMPLOYMENT',
  GROUP:'CURRENT_ACTIVE_GROUP_MEMBERSHIP',
};

export function createOrganizationAnalyticsRuntime(database:DatabaseClient){
  const q=(sql:string,params:readonly unknown[]=[])=>database.pool.query(sql,[...params]);

  async function assertScope(p:AnalyticsPrincipal,scopeType:AnalyticsScopeType,scopeId:string){
    const table=scopeTable[scopeType];
    const r=await q(`select id from ${table} where tenant_id=$1 and id=$2 limit 1`,[p.tenantId,scopeId]);
    if(!r.rowCount) throw new OrganizationAnalyticsError('ANALYTICS_SCOPE_NOT_AVAILABLE');
  }
  async function assertVersion(p:AnalyticsPrincipal,trainingVersionId?:string){
    if(!trainingVersionId)return;
    const r=await q('select id from training_versions where tenant_id=$1 and id=$2 limit 1',[p.tenantId,trainingVersionId]);
    if(!r.rowCount) throw new OrganizationAnalyticsError('TRAINING_VERSION_NOT_AVAILABLE');
  }
  function selectedCte(scopeType:AnalyticsScopeType,includeVersion:boolean){
    const versionFilter=includeVersion?'and a.training_version_id=$2':'';
    const scopeParam=includeVersion?'$3':'$2';
    return `with selected as (
      select distinct a.id as assignment_id,a.learner_id,a.training_id,a.training_version_id
      from training_assignments a
      join training_assignment_origins o
        on o.tenant_id=a.tenant_id and o.assignment_id=a.id and o.origin_type='AUDIENCE_RESOLUTION'
      join training_audience_resolution_members arm
        on arm.tenant_id=a.tenant_id and arm.resolution_id=o.source_ref_id::uuid and arm.learner_user_id=a.learner_id
      join employees e on e.tenant_id=arm.tenant_id and e.id=arm.employee_id
      left join employments emp on emp.tenant_id=e.tenant_id and emp.employee_id=e.id and emp.is_primary=true and emp.end_date is null
      left join group_memberships gm on gm.tenant_id=e.tenant_id and gm.employee_id=e.id and gm.valid_until is null
      where a.tenant_id=$1 ${versionFilter} and ${scopeColumn[scopeType]}=${scopeParam}
    )`;
  }

  return {
    async getAggregate(p:AnalyticsPrincipal,input:{scopeType:AnalyticsScopeType;scopeId:string;trainingVersionId?:string}){
      await assertScope(p,input.scopeType,input.scopeId);
      await assertVersion(p,input.trainingVersionId);
      const hasVersion=Boolean(input.trainingVersionId);
      const selectedParams=hasVersion?[p.tenantId,input.trainingVersionId,input.scopeId]:[p.tenantId,input.scopeId];
      const cte=selectedCte(input.scopeType,hasVersion);

      const cohort=(await q(`${cte}
        select count(distinct learner_id)::int as "cohortSize",count(*)::int as "assignmentCount"
        from selected`,selectedParams)).rows[0]??{cohortSize:0,assignmentCount:0};
      const actualCohort=Number(cohort.cohortSize??0);
      const suppressed=actualCohort<MIN_ANALYTICS_COHORT;

      const unmappedParams=hasVersion?[p.tenantId,input.trainingVersionId]:[p.tenantId];
      const unmapped=(await q(`select count(*)::int as count
        from training_assignments a
        where a.tenant_id=$1 ${hasVersion?'and a.training_version_id=$2':''}
          and not exists (
            select 1 from training_assignment_origins o
            where o.tenant_id=a.tenant_id and o.assignment_id=a.id and o.origin_type='AUDIENCE_RESOLUTION'
          )`,unmappedParams)).rows[0]?.count??0;

      if(suppressed){
        return {
          scope:{type:input.scopeType,id:input.scopeId,basis:scopeBasis[input.scopeType]},
          trainingVersionId:input.trainingVersionId??null,
          privacy:{minimumCohort:MIN_ANALYTICS_COHORT,suppressed:true,cohortSize:null},
          assignmentSummary:null,objectiveSignals:[],questionSignals:[],
          tenantUnmappedAudienceAssignments:Number(unmapped),
        };
      }

      const assignmentSummary=(await q(`${cte}
        select count(*)::int as assigned,
          count(tc.id)::int as completed,
          round(100.0*count(tc.id)/nullif(count(*),0),1)::float as "completionRatePercent"
        from selected s
        left join training_completions tc on tc.tenant_id=$1 and tc.assignment_id=s.assignment_id`,selectedParams)).rows[0];

      const objectiveSignals=(await q(`${cte},
        per_learner as (
          select oe.learner_id,oe.objective_id,count(*)::int as evidence_count,
            sum(oe.earned_points)::float as earned,sum(oe.possible_points)::float as possible
          from objective_evidence oe join selected s on s.assignment_id=oe.assignment_id
          where oe.tenant_id=$1
          group by oe.learner_id,oe.objective_id
          having count(*)>=${MIN_OBJECTIVE_EVIDENCE} and sum(oe.possible_points)>0
        )
        select pl.objective_id as "objectiveId",lo.statement,
          count(*)::int as "qualifiedLearners",
          count(*) filter(where pl.earned/pl.possible<0.70)::int as "weakLearners",
          sum(pl.evidence_count)::int as "evidenceCount",
          round(100.0*count(*) filter(where pl.earned/pl.possible<0.70)/nullif(count(*),0),1)::float as "weakPrevalencePercent"
        from per_learner pl
        join learning_objectives lo on lo.tenant_id=$1 and lo.id=pl.objective_id
        group by pl.objective_id,lo.statement
        order by "weakPrevalencePercent" desc,pl.objective_id`,selectedParams)).rows;

      const questionSignals=(await q(`${cte}
        select oe.question_version_id as "questionVersionId",
          count(distinct oe.learner_id)::int as "learnerCount",
          count(*)::int as "responseCount",
          round(100.0*avg(case when oe.correct then 1 else 0 end),1)::float as "correctRatePercent"
        from objective_evidence oe join selected s on s.assignment_id=oe.assignment_id
        where oe.tenant_id=$1
        group by oe.question_version_id
        having count(distinct oe.learner_id)>=${MIN_ANALYTICS_COHORT}
        order by "correctRatePercent" asc,oe.question_version_id`,selectedParams)).rows;

      return {
        scope:{type:input.scopeType,id:input.scopeId,basis:scopeBasis[input.scopeType]},
        trainingVersionId:input.trainingVersionId??null,
        privacy:{minimumCohort:MIN_ANALYTICS_COHORT,suppressed:false,cohortSize:actualCohort},
        assignmentSummary,objectiveSignals,questionSignals,
        tenantUnmappedAudienceAssignments:Number(unmapped),
      };
    },
  };
}
