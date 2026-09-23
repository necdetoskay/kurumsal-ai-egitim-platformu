import type { DatabaseClient } from '@kaep/db';

export type InsightPrincipal={tenantId:string;userId:string};
export const MIN_OBJECTIVE_EVIDENCE=3;
export class InsightRuntimeError extends Error { constructor(public readonly code:'TRAINING_NOT_AVAILABLE'){super(code);} }

export function createInsightRuntime(database:DatabaseClient){
 const q=(sql:string,params:readonly unknown[]=[])=>database.pool.query(sql,[...params]);
 return {
  async getInsights(p:InsightPrincipal,trainingVersionId:string){
   const ar=await q(`select a.id as "assignmentId",a.training_id as "trainingId",a.training_version_id as "trainingVersionId",v.snapshot
     from training_assignments a join training_versions v on v.tenant_id=a.tenant_id and v.training_id=a.training_id and v.id=a.training_version_id
     where a.tenant_id=$1 and a.learner_id=$2 and a.training_version_id=$3 and a.status in ('ACTIVE','COMPLETED')
     order by a.assigned_at desc limit 1`,[p.tenantId,p.userId,trainingVersionId]);
   const assignment=ar.rows[0]; if(!assignment)throw new InsightRuntimeError('TRAINING_NOT_AVAILABLE');
   const evidence=(await q(`select oe.objective_id as "objectiveId",lo.statement,count(*)::int as "sampleCount",
      sum(oe.earned_points)::int as "earnedPoints",sum(oe.possible_points)::int as "possiblePoints"
     from objective_evidence oe join learning_objectives lo on lo.tenant_id=oe.tenant_id and lo.id=oe.objective_id
     where oe.tenant_id=$1 and oe.learner_id=$2 and oe.training_version_id=$3 and oe.assignment_id=$4
     group by oe.objective_id,lo.statement order by oe.objective_id`,[p.tenantId,p.userId,trainingVersionId,assignment.assignmentId])).rows;
   const totalEvidence=evidence.reduce((n:number,x:any)=>n+x.sampleCount,0);
   const sufficient=evidence.filter((x:any)=>x.sampleCount>=MIN_OBJECTIVE_EVIDENCE&&x.possiblePoints>0);
   if(sufficient.length===0)return {status:'INSUFFICIENT_EVIDENCE' as const,trainingVersionId,evidenceCount:totalEvidence,minimumPerObjective:MIN_OBJECTIVE_EVIDENCE,insights:[],recommendations:[]};
   const insights=sufficient.map((x:any)=>{
    const scorePercent=Math.round(x.earnedPoints/x.possiblePoints*100);
    return {objectiveId:x.objectiveId,statement:x.statement,sampleCount:x.sampleCount,scorePercent,confidence:x.sampleCount>=5?'HIGH' as const:'MEDIUM' as const,weak:scorePercent<70};
   });
   const weak=insights.filter((x:any)=>x.weak);
   const contents=Array.isArray(assignment.snapshot?.contents)?assignment.snapshot.contents:[];
   const recommendations=weak.flatMap((insight:any)=>contents
    .filter((content:any)=>content?.active!==false&&Array.isArray(content?.objectiveIds)&&content.objectiveIds.includes(insight.objectiveId))
    .slice(0,3)
    .map((content:any)=>({objectiveId:insight.objectiveId,contentId:content.id,moduleId:content.moduleId,title:content.title,type:content.type})));
   return {status:weak.length?'BOUNDED_INSIGHT' as const:'SUFFICIENT_NO_WEAK_AREA' as const,trainingVersionId,evidenceCount:totalEvidence,minimumPerObjective:MIN_OBJECTIVE_EVIDENCE,insights,recommendations};
  },
 };
}
