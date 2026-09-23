import type { DatabaseClient } from '@kaep/db';

export type LearnerPrincipal={tenantId:string;userId:string};
export type ProgressKind='TRAINING'|'MODULE'|'CONTENT'|'VIDEO';
export class LearnerRuntimeError extends Error {
  constructor(public readonly code:'ASSIGNMENT_NOT_AVAILABLE'|'SOURCE_NOT_AVAILABLE'|'INVALID_PROGRESS'){super(code);}
}

function containsSource(snapshot:any,kind:ProgressKind,sourceId:string,trainingVersionId:string):boolean {
  if(kind==='TRAINING') return sourceId===trainingVersionId;
  if(kind==='MODULE') return Array.isArray(snapshot?.modules)&&snapshot.modules.some((x:any)=>x?.id===sourceId&&x?.active!==false);
  if(kind==='CONTENT'||kind==='VIDEO') return Array.isArray(snapshot?.contents)&&snapshot.contents.some((x:any)=>x?.id===sourceId&&x?.active!==false&&(kind!=='VIDEO'||x?.type==='VIDEO'));
  return false;
}

export function createLearnerRuntime(database:DatabaseClient){
 const q=(sql:string,params:readonly unknown[]=[])=>database.pool.query(sql,[...params]);
 return {
  async listAssignments(p:LearnerPrincipal){
   return (await q(`select a.id, a.training_id as "trainingId", a.training_version_id as "trainingVersionId",
      a.status, a.assigned_at as "assignedAt", a.completed_at as "completedAt", t.title, t.description
      from training_assignments a join trainings t on t.id=a.training_id and t.tenant_id=a.tenant_id
      where a.tenant_id=$1 and a.learner_id=$2 order by a.assigned_at desc`,[p.tenantId,p.userId])).rows;
  },
  async getTraining(p:LearnerPrincipal,trainingId:string){
   const r=await q(`select a.id as "assignmentId", a.training_id as "trainingId", a.training_version_id as "trainingVersionId",
      a.status,t.title,t.description,v.version,v.snapshot
      from training_assignments a
      join trainings t on t.id=a.training_id and t.tenant_id=a.tenant_id
      join training_versions v on v.id=a.training_version_id and v.training_id=a.training_id and v.tenant_id=a.tenant_id
      where a.tenant_id=$1 and a.learner_id=$2 and a.training_id=$3
      order by a.assigned_at desc limit 1`,[p.tenantId,p.userId,trainingId]);
   return r.rows[0]??null;
  },
  async putProgress(p:LearnerPrincipal,input:{assignmentId:string;trainingVersionId:string;kind:ProgressKind;sourceId:string;progressPermille:number;positionSeconds?:number|null;completed?:boolean}){
   if(!Number.isInteger(input.progressPermille)||input.progressPermille<0||input.progressPermille>1000||input.positionSeconds!==undefined&&input.positionSeconds!==null&&(!Number.isInteger(input.positionSeconds)||input.positionSeconds<0)) throw new LearnerRuntimeError('INVALID_PROGRESS');
   const a=await q(`select a.id,a.training_id as "trainingId",v.snapshot
      from training_assignments a
      join training_versions v on v.tenant_id=a.tenant_id and v.training_id=a.training_id and v.id=a.training_version_id
      where a.id=$1 and a.tenant_id=$2 and a.learner_id=$3 and a.training_version_id=$4 and a.status='ACTIVE'`,
      [input.assignmentId,p.tenantId,p.userId,input.trainingVersionId]);
   if(!a.rowCount) throw new LearnerRuntimeError('ASSIGNMENT_NOT_AVAILABLE');
   const row=a.rows[0];
   if(!containsSource(row.snapshot,input.kind,input.sourceId,input.trainingVersionId)) throw new LearnerRuntimeError('SOURCE_NOT_AVAILABLE');
   const completed=input.completed===true;
   const progress=input.kind==='MODULE'&&completed?1000:input.progressPermille;
   const written=await q(`insert into learning_progress
      (tenant_id,assignment_id,learner_id,training_id,training_version_id,kind,source_id,progress_permille,position_seconds,completed,updated_at)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
      on conflict (tenant_id,assignment_id,kind,source_id) do update set
       progress_permille=greatest(learning_progress.progress_permille,excluded.progress_permille),
       position_seconds=case
        when learning_progress.position_seconds is null then excluded.position_seconds
        when excluded.position_seconds is null then learning_progress.position_seconds
        else greatest(learning_progress.position_seconds,excluded.position_seconds) end,
       completed=learning_progress.completed or excluded.completed,
       updated_at=now()
      returning id,kind,source_id as "sourceId",progress_permille as "progressPermille",position_seconds as "positionSeconds",completed,updated_at as "updatedAt"`,
      [p.tenantId,input.assignmentId,p.userId,row.trainingId,input.trainingVersionId,input.kind,input.sourceId,progress,input.positionSeconds??null,completed]);
   return written.rows[0];
  },
  async resume(p:LearnerPrincipal,trainingVersionId:string){
   const assignment=await q(`select id from training_assignments where tenant_id=$1 and learner_id=$2 and training_version_id=$3 and status='ACTIVE' order by assigned_at desc limit 1`,[p.tenantId,p.userId,trainingVersionId]);
   if(!assignment.rowCount) throw new LearnerRuntimeError('ASSIGNMENT_NOT_AVAILABLE');
   const progress=await q(`select kind,source_id as "sourceId",progress_permille as "progressPermille",position_seconds as "positionSeconds",completed,updated_at as "updatedAt"
      from learning_progress where tenant_id=$1 and learner_id=$2 and training_version_id=$3 and assignment_id=$4 order by updated_at desc`,
      [p.tenantId,p.userId,trainingVersionId,assignment.rows[0].id]);
   return {trainingVersionId,assignmentId:assignment.rows[0].id,progress:progress.rows};
  },
 };
}
