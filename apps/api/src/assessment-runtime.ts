import type { DatabaseClient } from '@kaep/db';

export type AssessmentPrincipal={tenantId:string;userId:string};
export class AssessmentRuntimeError extends Error {
  constructor(public readonly code:'ASSESSMENT_NOT_ELIGIBLE'|'ATTEMPT_NOT_AVAILABLE'|'ATTEMPT_NOT_MUTABLE'|'QUESTION_NOT_AVAILABLE'|'INVALID_ANSWER'|'RETAKE_NOT_AVAILABLE'){super(code);}
}
function safeQuestion(row:any){return {id:row.id,questionId:row.question_id,questionVersionId:row.question_version_id,position:row.position,prompt:row.prompt,options:row.options_json,points:row.points};}

export function createAssessmentRuntime(database:DatabaseClient){
 const q=(sql:string,params:readonly unknown[]=[])=>database.pool.query(sql,[...params]);

 async function eligibility(p:AssessmentPrincipal,assessmentId:string){
  const r=await q(`select a.id as "assignmentId",a.training_id as "trainingId",a.training_version_id as "trainingVersionId",
      s.id as "assessmentId",s.pass_percent as "passPercent"
    from training_assignments a
    join training_assessments ta on ta.tenant_id=a.tenant_id and ta.training_id=a.training_id and ta.training_version_id=a.training_version_id
    join assessments s on s.tenant_id=ta.tenant_id and s.id=ta.assessment_id
    where a.tenant_id=$1 and a.learner_id=$2 and a.status='ACTIVE' and s.id=$3 and s.status='PUBLISHED'
    order by a.assigned_at desc limit 1`,[p.tenantId,p.userId,assessmentId]);
  return r.rows[0]??null;
 }

 return {
  async listAssessments(p:AssessmentPrincipal){
   const rows=(await q(`select distinct s.id,s.status,s.pass_percent as "passPercent",a.id as "assignmentId",a.training_id as "trainingId",a.training_version_id as "trainingVersionId"
     from training_assignments a
     join training_assessments ta on ta.tenant_id=a.tenant_id and ta.training_id=a.training_id and ta.training_version_id=a.training_version_id
     join assessments s on s.tenant_id=ta.tenant_id and s.id=ta.assessment_id
     where a.tenant_id=$1 and a.learner_id=$2 and a.status='ACTIVE' and s.status='PUBLISHED'`,[p.tenantId,p.userId])).rows;
   const items=[];
   for(const row of rows){
    const questions=(await q('select id,question_id,question_version_id,position,prompt,options_json,points from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2 order by position',[p.tenantId,row.id])).rows.map(safeQuestion);
    items.push({...row,questions});
   }
   return items;
  },

  async startAttempt(p:AssessmentPrincipal,assessmentId:string){
   const eligible=await eligibility(p,assessmentId);
   if(!eligible) throw new AssessmentRuntimeError('ASSESSMENT_NOT_ELIGIBLE');
   const existing=await q(`select id from attempts where tenant_id=$1 and assessment_id=$2 and learner_user_id=$3 and status in ('CREATED','IN_PROGRESS') order by created_at desc limit 1`,[p.tenantId,assessmentId,p.userId]);
   let attemptId=existing.rows[0]?.id;
   if(!attemptId){
    try{
     attemptId=(await q(`insert into attempts(tenant_id,assessment_id,learner_user_id,status) values($1,$2,$3,'IN_PROGRESS') returning id`,[p.tenantId,assessmentId,p.userId])).rows[0].id;
    }catch(error:any){
     if(error?.code!=='23505')throw error;
     attemptId=(await q(`select id from attempts where tenant_id=$1 and assessment_id=$2 and learner_user_id=$3 and status in ('CREATED','IN_PROGRESS') order by created_at desc limit 1`,[p.tenantId,assessmentId,p.userId])).rows[0]?.id;
    }
   }
   if(!attemptId) throw new AssessmentRuntimeError('ATTEMPT_NOT_AVAILABLE');
   return this.getAttempt(p,attemptId);
  },

  async getAttempt(p:AssessmentPrincipal,attemptId:string){
   const attempt=(await q(`select a.id,a.assessment_id as "assessmentId",a.status,a.score_percent as "scorePercent",a.created_at as "createdAt",a.submitted_at as "submittedAt",a.completed_at as "completedAt",s.pass_percent as "passPercent"
     from attempts a join assessments s on s.tenant_id=a.tenant_id and s.id=a.assessment_id
     where a.tenant_id=$1 and a.id=$2 and a.learner_user_id=$3`,[p.tenantId,attemptId,p.userId])).rows[0];
   if(!attempt) throw new AssessmentRuntimeError('ATTEMPT_NOT_AVAILABLE');
   const questions=(await q('select id,question_id,question_version_id,position,prompt,options_json,points from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2 order by position',[p.tenantId,attempt.assessmentId])).rows.map(safeQuestion);
   const answers=(await q('select question_version_id as "questionVersionId",selected_option_index as "selectedOptionIndex",updated_at as "updatedAt" from attempt_answers where tenant_id=$1 and attempt_id=$2',[p.tenantId,attemptId])).rows;
   return {...attempt,passed:attempt.scorePercent==null?null:attempt.scorePercent>=attempt.passPercent,questions,answers};
  },

  async saveAnswer(p:AssessmentPrincipal,attemptId:string,questionVersionId:string,selectedOptionIndex:number){
   if(!Number.isInteger(selectedOptionIndex)||selectedOptionIndex<0) throw new AssessmentRuntimeError('INVALID_ANSWER');
   const a=(await q(`select assessment_id as "assessmentId",status from attempts where tenant_id=$1 and id=$2 and learner_user_id=$3`,[p.tenantId,attemptId,p.userId])).rows[0];
   if(!a)throw new AssessmentRuntimeError('ATTEMPT_NOT_AVAILABLE');
   if(a.status!=='IN_PROGRESS')throw new AssessmentRuntimeError('ATTEMPT_NOT_MUTABLE');
   const s=(await q(`select options_json from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2 and question_version_id=$3`,[p.tenantId,a.assessmentId,questionVersionId])).rows[0];
   if(!s)throw new AssessmentRuntimeError('QUESTION_NOT_AVAILABLE');
   if(!Array.isArray(s.options_json)||selectedOptionIndex>=s.options_json.length)throw new AssessmentRuntimeError('INVALID_ANSWER');
   return (await q(`insert into attempt_answers(tenant_id,attempt_id,question_version_id,selected_option_index,updated_at)
    values($1,$2,$3,$4,now())
    on conflict(tenant_id,attempt_id,question_version_id) do update set selected_option_index=excluded.selected_option_index,updated_at=now()
    returning question_version_id as "questionVersionId",selected_option_index as "selectedOptionIndex",updated_at as "updatedAt"`,[p.tenantId,attemptId,questionVersionId,selectedOptionIndex])).rows[0];
  },

  async submitAttempt(p:AssessmentPrincipal,attemptId:string){
   const client=await database.pool.connect();
   try{
    await client.query('begin');
    const ar=await client.query(`select a.id,a.assessment_id as "assessmentId",a.status,a.score_percent as "scorePercent",s.pass_percent as "passPercent"
      from attempts a join assessments s on s.tenant_id=a.tenant_id and s.id=a.assessment_id
      where a.tenant_id=$1 and a.id=$2 and a.learner_user_id=$3 for update of a`,[p.tenantId,attemptId,p.userId]);
    const attempt=ar.rows[0]; if(!attempt)throw new AssessmentRuntimeError('ATTEMPT_NOT_AVAILABLE');
    if(attempt.status==='COMPLETED'){
      await client.query('commit');
      return {attemptId,status:'COMPLETED',scorePercent:attempt.scorePercent,passed:attempt.scorePercent>=attempt.passPercent,replayed:true};
    }
    if(attempt.status!=='IN_PROGRESS')throw new AssessmentRuntimeError('ATTEMPT_NOT_MUTABLE');
    const snapshots=(await client.query('select question_version_id,correct_option_index,points from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2',[p.tenantId,attempt.assessmentId])).rows;
    const answers=(await client.query('select question_version_id,selected_option_index from attempt_answers where tenant_id=$1 and attempt_id=$2',[p.tenantId,attemptId])).rows;
    const amap=new Map(answers.map((x:any)=>[x.question_version_id,x.selected_option_index]));
    const total=snapshots.reduce((n:number,x:any)=>n+x.points,0);
    const earned=snapshots.reduce((n:number,x:any)=>n+(amap.get(x.question_version_id)===x.correct_option_index?x.points:0),0);
    const scorePercent=total===0?0:Math.round(earned/total*100);
    const passed=scorePercent>=attempt.passPercent;
    await client.query("update attempts set status='COMPLETED',score_percent=$1,submitted_at=now(),completed_at=now() where tenant_id=$2 and id=$3",[scorePercent,p.tenantId,attemptId]);

    const er=await client.query(`select a.id as "assignmentId",a.training_id as "trainingId",a.training_version_id as "trainingVersionId",v.snapshot
      from training_assignments a
      join training_assessments ta on ta.tenant_id=a.tenant_id and ta.training_id=a.training_id and ta.training_version_id=a.training_version_id and ta.assessment_id=$3
      join training_versions v on v.tenant_id=a.tenant_id and v.training_id=a.training_id and v.id=a.training_version_id
      where a.tenant_id=$1 and a.learner_id=$2 and a.status='ACTIVE' order by a.assigned_at desc limit 1`,[p.tenantId,p.userId,attempt.assessmentId]);
    const eligible=er.rows[0];
    if(!eligible)throw new AssessmentRuntimeError('ASSESSMENT_NOT_ELIGIBLE');
    await client.query(`insert into learning_evidence(tenant_id,assignment_id,learner_id,training_id,training_version_id,type,source_id,payload,occurred_at)
      values($1,$2,$3,$4,$5,'ASSESSMENT_RESULT',$6,$7::jsonb,now())
      on conflict(tenant_id,assignment_id,type,source_id) do nothing`,[p.tenantId,eligible.assignmentId,p.userId,eligible.trainingId,eligible.trainingVersionId,attemptId,JSON.stringify({assessmentId:attempt.assessmentId,scorePercent,passed})]);

    const requiredModules=(eligible.snapshot?.modules??[]).filter((x:any)=>x?.active!==false).map((x:any)=>x.id);
    const completed=requiredModules.length===0?true:Number((await client.query(`select count(*)::int as count from learning_progress where tenant_id=$1 and assignment_id=$2 and kind='MODULE' and completed=true and source_id=any($3::text[])`,[p.tenantId,eligible.assignmentId,requiredModules])).rows[0]?.count??0)===requiredModules.length;
    if(passed&&completed){
      const evidenceSnapshot={assessmentAttemptId:attemptId,requiredModuleIds:requiredModules};
      await client.query(`insert into training_completions(tenant_id,assignment_id,learner_id,training_id,training_version_id,evidence_snapshot,completed_at)
        values($1,$2,$3,$4,$5,$6::jsonb,now()) on conflict(tenant_id,assignment_id) do nothing`,[p.tenantId,eligible.assignmentId,p.userId,eligible.trainingId,eligible.trainingVersionId,JSON.stringify(evidenceSnapshot)]);
      await client.query("update training_assignments set status='COMPLETED',completed_at=coalesce(completed_at,now()),updated_at=now() where tenant_id=$1 and id=$2",[p.tenantId,eligible.assignmentId]);
      await client.query(`insert into certificates(tenant_id,learner_id,training_id,training_version_id,eligibility_evidence_key,status,issued_at)
        values($1,$2,$3,$4,$5,'ISSUED',now()) on conflict(tenant_id,eligibility_evidence_key) do nothing`,[p.tenantId,p.userId,eligible.trainingId,eligible.trainingVersionId,`M3:${eligible.assignmentId}:${attemptId}`]);
    }
    await client.query('commit');
    return {attemptId,status:'COMPLETED',scorePercent,passed,replayed:false};
   }catch(error){await client.query('rollback');throw error;}finally{client.release();}
  },

  async requestRetake(p:AssessmentPrincipal,priorAttemptId:string){
   const r=await q(`select a.id,a.score_percent,s.pass_percent from attempts a join assessments s on s.tenant_id=a.tenant_id and s.id=a.assessment_id
    where a.tenant_id=$1 and a.id=$2 and a.learner_user_id=$3 and a.status='COMPLETED'`,[p.tenantId,priorAttemptId,p.userId]);
   const prior=r.rows[0]; if(!prior||prior.score_percent>=prior.pass_percent)throw new AssessmentRuntimeError('RETAKE_NOT_AVAILABLE');
   try{return (await q("insert into retake_requests(tenant_id,learner_user_id,prior_attempt_id,status) values($1,$2,$3,'REQUESTED') returning *",[p.tenantId,p.userId,priorAttemptId])).rows[0];}
   catch(error:any){if(error?.code!=='23505')throw error;return (await q("select * from retake_requests where tenant_id=$1 and prior_attempt_id=$2 and status='REQUESTED'",[p.tenantId,priorAttemptId])).rows[0];}
  },

  async listCertificates(p:AssessmentPrincipal){
   return (await q(`select id,training_id as "trainingId",training_version_id as "trainingVersionId",status,issued_at as "issuedAt",revoked_at as "revokedAt",revoke_reason as "revokeReason"
     from certificates where tenant_id=$1 and learner_id=$2 order by issued_at desc`,[p.tenantId,p.userId])).rows;
  },
 };
}
