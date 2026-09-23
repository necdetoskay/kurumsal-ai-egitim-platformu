import { randomUUID } from 'node:crypto';
import type { DatabaseClient } from '@kaep/db';
import { publishAssessment, type Assessment, type AssessmentQuestionSnapshot } from '@kaep/assessment';

export type AssessmentAuthorPrincipal={tenantId:string;userId:string};
export class AssessmentAuthoringError extends Error {
  constructor(public readonly code:
    'QUESTION_NOT_FOUND'|'QUESTION_NOT_APPROVED'|'INVALID_QUESTION'|'INVALID_QUESTION_TRANSITION'|
    'ASSESSMENT_NOT_FOUND'|'INVALID_ASSESSMENT'|'INVALID_ASSESSMENT_TRANSITION'|
    'TRAINING_VERSION_NOT_FOUND'|'OBJECTIVE_NOT_FOUND'){super(code);}
}
type Query=(sql:string,params?:readonly unknown[])=>Promise<any>;

export function createAssessmentAuthoringRuntime(database:DatabaseClient){
 const q:Query=(sql,params=[])=>database.pool.query(sql,[...params]);

 async function getQuestion(p:AssessmentAuthorPrincipal,questionId:string){
   const question=(await q('select id,status,created_at as "createdAt",updated_at as "updatedAt" from questions where tenant_id=$1 and id=$2',[p.tenantId,questionId])).rows[0];
   if(!question)throw new AssessmentAuthoringError('QUESTION_NOT_FOUND');
   const versions=(await q('select id,version,prompt,options_json as options,correct_option_index as "correctOptionIndex",created_at as "createdAt" from question_versions where tenant_id=$1 and question_id=$2 order by version',[p.tenantId,questionId])).rows;
   return {...question,versions};
 }
 function validateQuestion(input:{prompt?:string;options?:unknown;correctOptionIndex?:unknown}){
   if(typeof input.prompt!=='string'||!input.prompt.trim())throw new AssessmentAuthoringError('INVALID_QUESTION');
   if(!Array.isArray(input.options)||input.options.length<2||input.options.some(x=>typeof x!=='string'||!x.trim()))throw new AssessmentAuthoringError('INVALID_QUESTION');
   if(!Number.isInteger(input.correctOptionIndex)||Number(input.correctOptionIndex)<0||Number(input.correctOptionIndex)>=input.options.length)throw new AssessmentAuthoringError('INVALID_QUESTION');
 }
 async function getAssessment(p:AssessmentAuthorPrincipal,assessmentId:string){
   const a=(await q('select id,title,status,pass_percent as "passPercent",created_at as "createdAt",updated_at as "updatedAt" from assessments where tenant_id=$1 and id=$2',[p.tenantId,assessmentId])).rows[0];
   if(!a)throw new AssessmentAuthoringError('ASSESSMENT_NOT_FOUND');
   const link=(await q('select training_id as "trainingId",training_version_id as "trainingVersionId",required from training_assessments where tenant_id=$1 and assessment_id=$2 limit 1',[p.tenantId,assessmentId])).rows[0]??null;
   const questions=(await q('select question_id as "questionId",question_version_id as "questionVersionId",objective_id as "objectiveId",position,prompt,options_json as options,points from assessment_question_snapshots where tenant_id=$1 and assessment_id=$2 order by position',[p.tenantId,assessmentId])).rows;
   return {...a,link,questions};
 }

 return {
   async listQuestions(p:AssessmentAuthorPrincipal){
     const rows=(await q(`select q.id,q.status,q.updated_at as "updatedAt",
       v.id as "questionVersionId",v.version,v.prompt,v.options_json as options
       from questions q
       join lateral (select * from question_versions x where x.tenant_id=q.tenant_id and x.question_id=q.id order by x.version desc limit 1) v on true
       where q.tenant_id=$1 order by q.updated_at desc`,[p.tenantId])).rows;
     return rows;
   },
   getQuestion,
   async createQuestion(p:AssessmentAuthorPrincipal,input:{prompt?:string;options?:unknown;correctOptionIndex?:unknown}){
     validateQuestion(input);
     const questionId=randomUUID(),versionId=randomUUID();
     const client=await database.pool.connect();
     try{
       await client.query('begin');
       await client.query("insert into questions(id,tenant_id,status) values($1,$2,'DRAFT')",[questionId,p.tenantId]);
       await client.query('insert into question_versions(id,tenant_id,question_id,version,prompt,options_json,correct_option_index) values($1,$2,$3,1,$4,$5::jsonb,$6)',[versionId,p.tenantId,questionId,input.prompt!.trim(),JSON.stringify(input.options),input.correctOptionIndex]);
       await client.query('commit');
     }catch(error){await client.query('rollback');throw error;}finally{client.release();}
     return getQuestion(p,questionId);
   },
   async submitQuestionReview(p:AssessmentAuthorPrincipal,questionId:string){
     const r=await q("update questions set status='IN_REVIEW',updated_at=now() where tenant_id=$1 and id=$2 and status='DRAFT' returning id",[p.tenantId,questionId]);
     if(r.rowCount)return getQuestion(p,questionId);
     const current=(await q('select status from questions where tenant_id=$1 and id=$2',[p.tenantId,questionId])).rows[0];
     if(!current)throw new AssessmentAuthoringError('QUESTION_NOT_FOUND');
     throw new AssessmentAuthoringError('INVALID_QUESTION_TRANSITION');
   },
   async approveQuestion(p:AssessmentAuthorPrincipal,questionId:string){
     const r=await q("update questions set status='APPROVED',updated_at=now() where tenant_id=$1 and id=$2 and status='IN_REVIEW' returning id",[p.tenantId,questionId]);
     if(r.rowCount)return getQuestion(p,questionId);
     const current=(await q('select status from questions where tenant_id=$1 and id=$2',[p.tenantId,questionId])).rows[0];
     if(!current)throw new AssessmentAuthoringError('QUESTION_NOT_FOUND');
     if(current.status==='APPROVED')return getQuestion(p,questionId);
     throw new AssessmentAuthoringError('INVALID_QUESTION_TRANSITION');
   },
   async listAssessments(p:AssessmentAuthorPrincipal){
     return (await q(`select a.id,a.title,a.status,a.pass_percent as "passPercent",
       ta.training_id as "trainingId",ta.training_version_id as "trainingVersionId",a.updated_at as "updatedAt"
       from assessments a left join training_assessments ta on ta.tenant_id=a.tenant_id and ta.assessment_id=a.id
       where a.tenant_id=$1 order by a.updated_at desc`,[p.tenantId])).rows;
   },
   getAssessment,
   async createAssessment(p:AssessmentAuthorPrincipal,input:{title?:string;passPercent?:number}){
     if(typeof input.title!=='string'||!input.title.trim()||!Number.isInteger(input.passPercent)||Number(input.passPercent)<0||Number(input.passPercent)>100)throw new AssessmentAuthoringError('INVALID_ASSESSMENT');
     const id=randomUUID();
     await q("insert into assessments(id,tenant_id,title,status,pass_percent) values($1,$2,$3,'DRAFT',$4)",[id,p.tenantId,input.title.trim(),input.passPercent]);
     return getAssessment(p,id);
   },
   async publishAssessment(p:AssessmentAuthorPrincipal,assessmentId:string,input:{
     trainingId?:string;trainingVersionId?:string;required?:boolean;
     questions?:Array<{questionVersionId?:string;objectiveId?:string;points?:number}>;
   }){
     if(!input.trainingId||!input.trainingVersionId||!Array.isArray(input.questions)||input.questions.length===0)throw new AssessmentAuthoringError('INVALID_ASSESSMENT');
     const current=await getAssessment(p,assessmentId);
     if(current.status==='PUBLISHED')return {...current,replayed:true};
     if(current.status!=='DRAFT')throw new AssessmentAuthoringError('INVALID_ASSESSMENT_TRANSITION');
     const version=(await q('select id from training_versions where tenant_id=$1 and training_id=$2 and id=$3',[p.tenantId,input.trainingId,input.trainingVersionId])).rows[0];
     if(!version)throw new AssessmentAuthoringError('TRAINING_VERSION_NOT_FOUND');

     const snapshots:Array<AssessmentQuestionSnapshot&{objectiveId:string}>=[];
     let position=1;
     for(const item of input.questions){
       if(!item.questionVersionId||!item.objectiveId||!Number.isInteger(item.points)||Number(item.points)<=0)throw new AssessmentAuthoringError('INVALID_ASSESSMENT');
       const row=(await q(`select q.id as "questionId",q.status,v.id as "questionVersionId",v.prompt,v.options_json as options,v.correct_option_index as "correctOptionIndex"
         from question_versions v join questions q on q.tenant_id=v.tenant_id and q.id=v.question_id
         where v.tenant_id=$1 and v.id=$2`,[p.tenantId,item.questionVersionId])).rows[0];
       if(!row)throw new AssessmentAuthoringError('QUESTION_NOT_FOUND');
       if(row.status!=='APPROVED')throw new AssessmentAuthoringError('QUESTION_NOT_APPROVED');
       const objective=(await q('select id from learning_objectives where tenant_id=$1 and training_id=$2 and id=$3 and status=\'ACTIVE\'',[p.tenantId,input.trainingId,item.objectiveId])).rows[0];
       if(!objective)throw new AssessmentAuthoringError('OBJECTIVE_NOT_FOUND');
       snapshots.push({questionId:row.questionId,questionVersionId:row.questionVersionId,prompt:row.prompt,options:row.options,correctOptionIndex:row.correctOptionIndex,points:Number(item.points),objectiveId:item.objectiveId});
       position++;
     }
     const domain:Assessment={id:assessmentId,tenantId:p.tenantId,status:'DRAFT',snapshots:[],passPercent:current.passPercent};
     try{publishAssessment(domain,snapshots);}
     catch{throw new AssessmentAuthoringError('INVALID_ASSESSMENT');}

     const client=await database.pool.connect();
     try{
       await client.query('begin');
       const locked=(await client.query('select status from assessments where tenant_id=$1 and id=$2 for update',[p.tenantId,assessmentId])).rows[0];
       if(!locked)throw new AssessmentAuthoringError('ASSESSMENT_NOT_FOUND');
       if(locked.status==='PUBLISHED'){await client.query('commit');return {...await getAssessment(p,assessmentId),replayed:true};}
       if(locked.status!=='DRAFT')throw new AssessmentAuthoringError('INVALID_ASSESSMENT_TRANSITION');
       let pos=1;
       for(const s of snapshots){
         await client.query(`insert into assessment_question_snapshots
           (tenant_id,assessment_id,question_id,question_version_id,objective_id,position,prompt,options_json,correct_option_index,points)
           values($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)`,
           [p.tenantId,assessmentId,s.questionId,s.questionVersionId,s.objectiveId,pos++,s.prompt,JSON.stringify(s.options),s.correctOptionIndex,s.points]);
       }
       await client.query(`insert into training_assessments(tenant_id,training_id,training_version_id,assessment_id,required)
         values($1,$2,$3,$4,$5)`,[p.tenantId,input.trainingId,input.trainingVersionId,assessmentId,input.required!==false]);
       await client.query("update assessments set status='PUBLISHED',updated_at=now() where tenant_id=$1 and id=$2",[p.tenantId,assessmentId]);
       await client.query('commit');
     }catch(error){await client.query('rollback');throw error;}finally{client.release();}
     return {...await getAssessment(p,assessmentId),replayed:false};
   },
 };
}
