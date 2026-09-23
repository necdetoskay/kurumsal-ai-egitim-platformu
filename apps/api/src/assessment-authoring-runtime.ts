import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseClient } from '@kaep/db';

export type AssessmentAuthorPrincipal={tenantId:string;userId:string};
export type AssessmentQuestionSelection={questionVersionId:string;objectiveId:string;points:number};
export class AssessmentAuthoringRuntimeError extends Error {
  constructor(public readonly code:
    'TRAINING_VERSION_NOT_AVAILABLE'|'QUESTION_VERSION_NOT_APPROVED'|'OBJECTIVE_NOT_AVAILABLE'|'INVALID_ASSESSMENT'|'IDEMPOTENCY_CONFLICT'){super(code);}
}
const OPERATION='ASSESSMENT_PUBLISH';

function signature(input:{trainingId:string;trainingVersionId:string;passPercent:number;questions:AssessmentQuestionSelection[]}){
 const payload=JSON.stringify({
  trainingId:input.trainingId,trainingVersionId:input.trainingVersionId,passPercent:input.passPercent,
  questions:[...input.questions].map(q=>({questionVersionId:q.questionVersionId,objectiveId:q.objectiveId,points:q.points})).sort((a,b)=>a.questionVersionId.localeCompare(b.questionVersionId)),
 });
 return createHash('sha256').update(payload).digest('hex');
}

export function createAssessmentAuthoringRuntime(database:DatabaseClient){
 const q=(sql:string,params:readonly unknown[]=[])=>database.pool.query(sql,[...params]);

 async function readAssessment(tenantId:string,assessmentId:string){
  const assessment=(await q(`select a.id,a.status,a.pass_percent as "passPercent",ta.training_id as "trainingId",ta.training_version_id as "trainingVersionId"
    from assessments a join training_assessments ta on ta.tenant_id=a.tenant_id and ta.assessment_id=a.id
    where a.tenant_id=$1 and a.id=$2`,[tenantId,assessmentId])).rows[0];
  if(!assessment)return null;
  const questions=(await q(`select question_version_id as "questionVersionId",objective_id as "objectiveId",position,prompt,options_json as options,points
    from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2 order by position`,[tenantId,assessmentId])).rows;
  return {...assessment,questions};
 }

 return {
  async listApprovedQuestions(p:AssessmentAuthorPrincipal){
   return (await q(`select qv.id as "questionVersionId",qv.question_id as "questionId",qv.version,qv.prompt,qv.options_json as options
     from question_versions qv join questions q on q.tenant_id=qv.tenant_id and q.id=qv.question_id
     where qv.tenant_id=$1 and q.status='APPROVED' order by qv.created_at,qv.id`,[p.tenantId])).rows;
  },
  async listAssessments(p:AssessmentAuthorPrincipal,trainingId:string,trainingVersionId:string){
   const v=await q('select id from training_versions where tenant_id=$1 and training_id=$2 and id=$3',[p.tenantId,trainingId,trainingVersionId]);
   if(!v.rowCount)throw new AssessmentAuthoringRuntimeError('TRAINING_VERSION_NOT_AVAILABLE');
   return (await q(`select a.id,a.status,a.pass_percent as "passPercent",count(s.id)::int as "questionCount",a.created_at as "createdAt"
     from training_assessments ta join assessments a on a.tenant_id=ta.tenant_id and a.id=ta.assessment_id
     left join assessment_question_snapshots s on s.tenant_id=a.tenant_id and s.assessment_id=a.id
     where ta.tenant_id=$1 and ta.training_id=$2 and ta.training_version_id=$3
     group by a.id order by a.created_at desc`,[p.tenantId,trainingId,trainingVersionId])).rows;
  },
  async publishAssessment(p:AssessmentAuthorPrincipal,input:{trainingId:string;trainingVersionId:string;passPercent:number;questions:AssessmentQuestionSelection[];idempotencyKey:string}){
   if(!Number.isInteger(input.passPercent)||input.passPercent<0||input.passPercent>100||input.questions.length===0||!input.idempotencyKey.trim())throw new AssessmentAuthoringRuntimeError('INVALID_ASSESSMENT');
   if(input.questions.some(x=>!Number.isInteger(x.points)||x.points<=0))throw new AssessmentAuthoringRuntimeError('INVALID_ASSESSMENT');
   const sig=signature(input);
   const replay=(await q('select resource_id,result_ref from command_idempotency where tenant_id=$1 and operation=$2 and idempotency_key=$3',[p.tenantId,OPERATION,input.idempotencyKey])).rows[0];
   if(replay){
    if(replay.result_ref!==sig)throw new AssessmentAuthoringRuntimeError('IDEMPOTENCY_CONFLICT');
    const existing=await readAssessment(p.tenantId,replay.resource_id);
    if(!existing)throw new AssessmentAuthoringRuntimeError('IDEMPOTENCY_CONFLICT');
    return {replayed:true,...existing};
   }

   const client=await database.pool.connect();
   try{
    await client.query('begin');
    const version=(await client.query('select id from training_versions where tenant_id=$1 and training_id=$2 and id=$3 for share',[p.tenantId,input.trainingId,input.trainingVersionId])).rows[0];
    if(!version)throw new AssessmentAuthoringRuntimeError('TRAINING_VERSION_NOT_AVAILABLE');

    const resolved=[];
    for(const selection of input.questions){
     const objective=(await client.query(`select id from learning_objectives where tenant_id=$1 and training_id=$2 and id=$3 and status='ACTIVE'`,[p.tenantId,input.trainingId,selection.objectiveId])).rows[0];
     if(!objective)throw new AssessmentAuthoringRuntimeError('OBJECTIVE_NOT_AVAILABLE');
     const question=(await client.query(`select qv.id as "questionVersionId",qv.question_id as "questionId",qv.prompt,qv.options_json as options,qv.correct_option_index as "correctOptionIndex"
       from question_versions qv join questions q on q.tenant_id=qv.tenant_id and q.id=qv.question_id
       where qv.tenant_id=$1 and qv.id=$2 and q.status='APPROVED'`,[p.tenantId,selection.questionVersionId])).rows[0];
     if(!question)throw new AssessmentAuthoringRuntimeError('QUESTION_VERSION_NOT_APPROVED');
     resolved.push({...question,objectiveId:selection.objectiveId,points:selection.points});
    }

    const assessmentId=randomUUID();
    const claim=await client.query(`insert into command_idempotency(tenant_id,operation,idempotency_key,resource_id,result_ref)
      values($1,$2,$3,$4,$5) on conflict(tenant_id,operation,idempotency_key) do nothing returning resource_id`,
      [p.tenantId,OPERATION,input.idempotencyKey,assessmentId,sig]);
    if(!claim.rowCount)throw new AssessmentAuthoringRuntimeError('IDEMPOTENCY_CONFLICT');

    await client.query("insert into assessments(id,tenant_id,status,pass_percent) values($1,$2,'PUBLISHED',$3)",[assessmentId,p.tenantId,input.passPercent]);
    await client.query(`insert into training_assessments(tenant_id,training_id,training_version_id,assessment_id,required)
      values($1,$2,$3,$4,true)`,[p.tenantId,input.trainingId,input.trainingVersionId,assessmentId]);
    let position=1;
    for(const x of resolved){
     await client.query(`insert into assessment_question_snapshots
       (tenant_id,assessment_id,question_id,question_version_id,objective_id,position,prompt,options_json,correct_option_index,points)
       values($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)`,
       [p.tenantId,assessmentId,x.questionId,x.questionVersionId,x.objectiveId,position++,x.prompt,JSON.stringify(x.options),x.correctOptionIndex,x.points]);
    }
    await client.query(`insert into outbox_events(tenant_id,aggregate_type,aggregate_id,event_type,payload)
      values($1,'ASSESSMENT',$2,'ASSESSMENT_PUBLISHED',$3::jsonb)`,[p.tenantId,assessmentId,JSON.stringify({assessmentId,trainingId:input.trainingId,trainingVersionId:input.trainingVersionId})]);
    await client.query('commit');
    const created=await readAssessment(p.tenantId,assessmentId);
    return {replayed:false,...created};
   }catch(error){await client.query('rollback');throw error;}finally{client.release();}
  },
 };
}
