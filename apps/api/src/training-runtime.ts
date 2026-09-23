import { randomUUID } from 'node:crypto';
import type { DatabaseClient } from '@kaep/db';
import { publishTraining, type TrainingAggregateState, type TrainingContentItem, type TrainingModule, type LearningObjective } from '@kaep/training';

export type TrainingPrincipal={tenantId:string;userId:string};
export type DraftObjectiveInput={id?:string;statement:string};
export type DraftContentInput={id?:string;title:string;type:'TEXT'|'VIDEO';objectiveIds:string[];durationSeconds?:number};
export type DraftModuleInput={id?:string;title:string;contents:DraftContentInput[]};
export type TrainingDraftInput={title:string;description?:string;revision?:number;objectives:DraftObjectiveInput[];modules:DraftModuleInput[]};

export class TrainingRuntimeError extends Error {
  constructor(public readonly code:'TRAINING_NOT_FOUND'|'INVALID_STATE_TRANSITION'|'VALIDATION_FAILED'|'VERSION_CONFLICT'|'IDEMPOTENCY_CONFLICT'){super(code);}
}

type Query=(sql:string,params?:readonly unknown[])=>Promise<any>;
export function createTrainingRuntime(database:DatabaseClient){
 const q:Query=(sql,params=[])=>database.pool.query(sql,[...params]);

 async function readDraft(p:TrainingPrincipal,trainingId:string){
   const training=(await q('select * from trainings where tenant_id=$1 and id=$2',[p.tenantId,trainingId])).rows[0];
   if(!training)throw new TrainingRuntimeError('TRAINING_NOT_FOUND');
   const objectives=(await q('select id,statement,status from learning_objectives where tenant_id=$1 and training_id=$2 order by created_at,id',[p.tenantId,trainingId])).rows;
   const modules=(await q('select id,title,position,status from training_modules where tenant_id=$1 and training_id=$2 order by position,id',[p.tenantId,trainingId])).rows;
   const contents=(await q('select id,module_id as "moduleId",title,type,position,status,duration_seconds as "durationSeconds",objective_ids as "objectiveIds" from training_contents where tenant_id=$1 and training_id=$2 order by position,id',[p.tenantId,trainingId])).rows;
   const versions=(await q('select id,version,published_at as "publishedAt" from training_versions where tenant_id=$1 and training_id=$2 order by version desc',[p.tenantId,trainingId])).rows;
   return {
     id:training.id,title:training.title,description:training.description,status:training.status,revision:training.revision,
     objectives,modules:modules.map((m:any)=>({...m,contents:contents.filter((c:any)=>c.moduleId===m.id)})),versions,
   };
 }

 async function replaceStructure(query:Query,p:TrainingPrincipal,trainingId:string,input:TrainingDraftInput){
   const objectiveIds=new Set<string>();
   for(const objective of input.objectives){
     const id=objective.id??randomUUID(); objectiveIds.add(id);
     await query('insert into learning_objectives(id,tenant_id,training_id,statement,status) values($1,$2,$3,$4,\'ACTIVE\')',[id,p.tenantId,trainingId,objective.statement]);
   }
   let contentPosition=1;
   let modulePosition=1;
   for(const module of input.modules){
     const moduleId=module.id??randomUUID();
     await query('insert into training_modules(id,tenant_id,training_id,title,position,status) values($1,$2,$3,$4,$5,\'ACTIVE\')',[moduleId,p.tenantId,trainingId,module.title,modulePosition++]);
     for(const content of module.contents){
       if(content.objectiveIds.length===0||content.objectiveIds.some(id=>!objectiveIds.has(id)))throw new TrainingRuntimeError('VALIDATION_FAILED');
       const contentId=content.id??randomUUID();
       await query(`insert into training_contents(id,tenant_id,training_id,module_id,title,type,position,status,duration_seconds,objective_ids)
         values($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8,$9::jsonb)`,
         [contentId,p.tenantId,trainingId,moduleId,content.title,content.type,contentPosition++,content.durationSeconds??null,JSON.stringify(content.objectiveIds)]);
     }
   }
 }

 function validateInput(input:TrainingDraftInput){
   if(!input.title?.trim()||input.objectives.length===0||input.modules.length===0)throw new TrainingRuntimeError('VALIDATION_FAILED');
   if(input.objectives.some(x=>!x.statement.trim()))throw new TrainingRuntimeError('VALIDATION_FAILED');
   if(input.modules.some(x=>!x.title.trim()||x.contents.length===0))throw new TrainingRuntimeError('VALIDATION_FAILED');
 }

 async function aggregateState(p:TrainingPrincipal,trainingId:string):Promise<TrainingAggregateState>{
   const draft=await readDraft(p,trainingId);
   const objectives:LearningObjective[]=draft.objectives.map((o:any)=>({id:o.id,tenantId:p.tenantId,trainingId,statement:o.statement,active:o.status==='ACTIVE'}));
   const modules:TrainingModule[]=draft.modules.map((m:any)=>({id:m.id,tenantId:p.tenantId,trainingId,title:m.title,position:m.position,active:m.status==='ACTIVE'}));
   const contents:TrainingContentItem[]=draft.modules.flatMap((m:any)=>m.contents.map((c:any)=>({
     id:c.id,tenantId:p.tenantId,trainingId,moduleId:m.id,title:c.title,type:c.type,position:c.position,active:c.status==='ACTIVE',
     ...(c.durationSeconds!==null&&c.durationSeconds!==undefined?{durationSeconds:c.durationSeconds}:{}),
     objectiveIds:Array.isArray(c.objectiveIds)?c.objectiveIds:[],
   })));
   const versions=(await q('select id,version,snapshot,published_at as "publishedAt" from training_versions where tenant_id=$1 and training_id=$2 order by version',[p.tenantId,trainingId])).rows.map((v:any)=>({
     id:v.id,tenantId:p.tenantId,trainingId,version:v.version,snapshot:v.snapshot,publishedAt:new Date(v.publishedAt),
   }));
   return {
     id:trainingId,tenantId:p.tenantId,title:draft.title,...(draft.description?{description:draft.description}:{}),
     status:draft.status,revision:draft.revision,objectives,modules,contents,publishedVersions:versions,
   } as TrainingAggregateState;
 }

 return {
   async listTrainings(p:TrainingPrincipal){
     return (await q(`select id,title,description,status,revision,created_at as "createdAt",updated_at as "updatedAt"
       from trainings where tenant_id=$1 order by updated_at desc`,[p.tenantId])).rows;
   },
   getTraining:readDraft,
   async createTraining(p:TrainingPrincipal,input:TrainingDraftInput){
     validateInput(input);
     const client=await database.pool.connect(); const cq:Query=(sql,params=[])=>client.query(sql,[...params]);
     const id=randomUUID();
     try{
       await client.query('begin');
       await cq('insert into trainings(id,tenant_id,title,description,status,revision) values($1,$2,$3,$4,\'DRAFT\',1)',[id,p.tenantId,input.title.trim(),input.description??null]);
       await replaceStructure(cq,p,id,input);
       await client.query('commit');
     }catch(error){await client.query('rollback');throw error;}finally{client.release();}
     return readDraft(p,id);
   },
   async updateTraining(p:TrainingPrincipal,trainingId:string,input:TrainingDraftInput){
     validateInput(input);
     const client=await database.pool.connect(); const cq:Query=(sql,params=[])=>client.query(sql,[...params]);
     try{
       await client.query('begin');
       const current=(await cq('select status,revision from trainings where tenant_id=$1 and id=$2 for update',[p.tenantId,trainingId])).rows[0];
       if(!current)throw new TrainingRuntimeError('TRAINING_NOT_FOUND');
       if(current.status!=='DRAFT')throw new TrainingRuntimeError('INVALID_STATE_TRANSITION');
       if(input.revision===undefined||input.revision!==current.revision)throw new TrainingRuntimeError('VERSION_CONFLICT');
       await cq('delete from training_contents where tenant_id=$1 and training_id=$2',[p.tenantId,trainingId]);
       await cq('delete from training_modules where tenant_id=$1 and training_id=$2',[p.tenantId,trainingId]);
       await cq('delete from learning_objectives where tenant_id=$1 and training_id=$2',[p.tenantId,trainingId]);
       await replaceStructure(cq,p,trainingId,input);
       await cq('update trainings set title=$3,description=$4,revision=revision+1,updated_at=now() where tenant_id=$1 and id=$2',[p.tenantId,trainingId,input.title.trim(),input.description??null]);
       await client.query('commit');
     }catch(error){await client.query('rollback');throw error;}finally{client.release();}
     return readDraft(p,trainingId);
   },
   async submitReview(p:TrainingPrincipal,trainingId:string){
     const state=await aggregateState(p,trainingId);
     if(state.status!=='DRAFT')throw new TrainingRuntimeError('INVALID_STATE_TRANSITION');
     if(!state.title.trim()||state.objectives.filter(x=>x.active).length===0||state.modules.filter(x=>x.active).length===0||(state.contents??[]).filter(x=>x.active).length===0)throw new TrainingRuntimeError('VALIDATION_FAILED');
     await q("update trainings set status='IN_REVIEW',revision=revision+1,updated_at=now() where tenant_id=$1 and id=$2 and status='DRAFT'",[p.tenantId,trainingId]);
     return readDraft(p,trainingId);
   },
   async publish(p:TrainingPrincipal,trainingId:string,idempotencyKey:string){
     if(!idempotencyKey.trim())throw new TrainingRuntimeError('IDEMPOTENCY_CONFLICT');
     const existing=(await q("select resource_id,result_ref from command_idempotency where tenant_id=$1 and operation='TRAINING_PUBLISH' and idempotency_key=$2",[p.tenantId,idempotencyKey])).rows[0];
     if(existing){
       if(existing.result_ref!==trainingId)throw new TrainingRuntimeError('IDEMPOTENCY_CONFLICT');
       const version=(await q('select id,version,snapshot,published_at as "publishedAt" from training_versions where tenant_id=$1 and id=$2',[p.tenantId,existing.resource_id])).rows[0];
       if(!version)throw new TrainingRuntimeError('TRAINING_NOT_FOUND');
       return {replayed:true,trainingId,version};
     }
     const state=await aggregateState(p,trainingId);
     const versionId=randomUUID(); const publishedAt=new Date();
     let domain;
     try{domain=publishTraining({state,versionId,publishedAt});}
     catch(error:any){
       if(error?.code==='INVALID_STATE_TRANSITION')throw new TrainingRuntimeError('INVALID_STATE_TRANSITION');
       throw new TrainingRuntimeError('VALIDATION_FAILED');
     }
     const client=await database.pool.connect(); const cq:Query=(sql,params=[])=>client.query(sql,[...params]);
     try{
       await client.query('begin');
       const locked=(await cq('select status,revision from trainings where tenant_id=$1 and id=$2 for update',[p.tenantId,trainingId])).rows[0];
       if(!locked)throw new TrainingRuntimeError('TRAINING_NOT_FOUND');
       if(locked.status!=='IN_REVIEW'||locked.revision!==state.revision)throw new TrainingRuntimeError('VERSION_CONFLICT');
       const claim=await cq(`insert into command_idempotency(tenant_id,operation,idempotency_key,resource_id,result_ref)
         values($1,'TRAINING_PUBLISH',$2,$3,$4) on conflict(tenant_id,operation,idempotency_key) do nothing returning resource_id`,
         [p.tenantId,idempotencyKey,versionId,trainingId]);
       if(!claim.rowCount)throw new TrainingRuntimeError('IDEMPOTENCY_CONFLICT');
       await cq('insert into training_versions(id,tenant_id,training_id,version,snapshot,published_at) values($1,$2,$3,$4,$5::jsonb,$6)',[
         versionId,p.tenantId,trainingId,domain.version.version,JSON.stringify(domain.version.snapshot),publishedAt.toISOString()
       ]);
       await cq("update trainings set status='PUBLISHED',revision=revision+1,updated_at=now() where tenant_id=$1 and id=$2",[p.tenantId,trainingId]);
       await cq(`insert into outbox_events(tenant_id,aggregate_type,aggregate_id,event_type,payload)
         values($1,'TRAINING',$2,'TRAINING_PUBLISHED',$3::jsonb)`,[p.tenantId,trainingId,JSON.stringify({trainingId,versionId,version:domain.version.version})]);
       await client.query('commit');
     }catch(error){await client.query('rollback');throw error;}finally{client.release();}
     return {replayed:false,trainingId,version:{id:versionId,version:domain.version.version,snapshot:domain.version.snapshot,publishedAt:publishedAt.toISOString()}};
   },
 };
}
