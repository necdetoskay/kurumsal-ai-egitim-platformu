import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createTrainingRuntime, TrainingRuntimeError } from './training-runtime.js';

function env(name:string){const v=process.env[name];if(!v)throw new Error(`${name} required`);return v;}
async function rejectCode(p:Promise<unknown>,code:TrainingRuntimeError['code']){
  await assert.rejects(p,(e:unknown)=>e instanceof TrainingRuntimeError&&e.code===code);
}
async function count(pool:any,sql:string,params:unknown[]=[]){const r=await pool.query(sql,params);return Number(r.rows[0]?.count??0);}

async function main(){
 const db=createDatabase(env('DATABASE_URL'));
 try{
  const tenant=randomUUID(),tenant2=randomUUID();
  await db.pool.query('insert into tenants(id,name,slug) values($1,$2,$3),($4,$5,$6)',[tenant,'M7 Author Tenant',`m7a-${randomUUID()}`,tenant2,'M7 Other Tenant',`m7b-${randomUUID()}`]);
  const runtime=createTrainingRuntime(db);
  const principal={tenantId:tenant,userId:randomUUID()};
  const objectiveId=randomUUID(),moduleId=randomUUID(),contentId=randomUUID();

  const created=await runtime.createTraining(principal,{
    title:'Phishing Awareness',
    description:'M7 mission training',
    objectives:[{id:objectiveId,statement:'Recognize phishing indicators'}],
    modules:[{id:moduleId,title:'Phishing Basics',contents:[{id:contentId,title:'Phishing indicators',type:'VIDEO',objectiveIds:[objectiveId],durationSeconds:120}]}],
  });
  assert.equal(created.status,'DRAFT');assert.equal(created.revision,1);
  assert.equal(created.objectives.length,1);assert.equal(created.modules[0]?.contents.length,1);

  await rejectCode(runtime.getTraining({tenantId:tenant2,userId:randomUUID()},created.id),'TRAINING_NOT_FOUND');
  await rejectCode(runtime.updateTraining(principal,created.id,{
    title:'Wrong revision',revision:999,
    objectives:[{id:objectiveId,statement:'Recognize phishing indicators'}],
    modules:[{id:moduleId,title:'Phishing Basics',contents:[{id:contentId,title:'Phishing indicators',type:'VIDEO',objectiveIds:[objectiveId]}]}],
  }),'VERSION_CONFLICT');

  const saved=await runtime.updateTraining(principal,created.id,{
    title:'Phishing Awareness Updated',description:'M7 authoritative draft',revision:1,
    objectives:[{id:objectiveId,statement:'Recognize phishing indicators'}],
    modules:[{id:moduleId,title:'Phishing Basics',contents:[{id:contentId,title:'Phishing indicators and safe response',type:'VIDEO',objectiveIds:[objectiveId],durationSeconds:180}]}],
  });
  assert.equal(saved.revision,2);assert.equal(saved.title,'Phishing Awareness Updated');

  const other=await runtime.createTraining(principal,{
    title:'Draft only',objectives:[{statement:'Objective'}],
    modules:[{title:'Module',contents:[{title:'Content',type:'TEXT',objectiveIds:[]}]}],
  }).catch((e)=>e);
  assert.ok(other instanceof TrainingRuntimeError);
  assert.equal(other.code,'VALIDATION_FAILED');

  const directDraft=await runtime.createTraining(principal,{
    title:'Direct publish blocked',
    objectives:[{id:randomUUID(),statement:'Objective'}],
    modules:[{id:randomUUID(),title:'Module',contents:[]}],
  }).catch((e)=>e);
  assert.ok(directDraft instanceof TrainingRuntimeError);
  assert.equal(directDraft.code,'VALIDATION_FAILED');

  await rejectCode(runtime.publish(principal,created.id,'publish-before-review'),'INVALID_STATE_TRANSITION');

  const review=await runtime.submitReview(principal,created.id);
  assert.equal(review.status,'IN_REVIEW');assert.equal(review.revision,3);

  const published=await runtime.publish(principal,created.id,'m7-publish-1');
  assert.equal(published.replayed,false);
  assert.equal(published.version.version,1);
  assert.equal(published.version.snapshot.title,'Phishing Awareness Updated');
  assert.equal(published.version.snapshot.contents?.[0]?.id,contentId);
  assert.deepEqual(published.version.snapshot.contents?.[0]?.objectiveIds,[objectiveId]);

  const replay=await runtime.publish(principal,created.id,'m7-publish-1');
  assert.equal(replay.replayed,true);assert.equal(replay.version.id,published.version.id);
  assert.equal(await count(db.pool,'select count(*) from training_versions where tenant_id=$1 and training_id=$2',[tenant,created.id]),1);
  assert.equal(await count(db.pool,"select count(*) from outbox_events where tenant_id=$1 and aggregate_id=$2 and event_type='TRAINING_PUBLISHED'",[tenant,created.id]),1);

  await rejectCode(runtime.updateTraining(principal,created.id,{
    title:'Illegal mutation',revision:4,
    objectives:[{id:objectiveId,statement:'Changed'}],
    modules:[{id:moduleId,title:'Changed',contents:[{id:contentId,title:'Changed',type:'VIDEO',objectiveIds:[objectiveId]}]}],
  }),'INVALID_STATE_TRANSITION');

  const stored=(await db.pool.query('select snapshot from training_versions where tenant_id=$1 and id=$2',[tenant,published.version.id])).rows[0]?.snapshot;
  assert.equal(stored.title,'Phishing Awareness Updated');assert.equal(stored.contents[0].title,'Phishing indicators and safe response');

  const anotherObjective=randomUUID();
  const another=await runtime.createTraining(principal,{
    title:'Second Training',
    objectives:[{id:anotherObjective,statement:'Second objective'}],
    modules:[{title:'Second module',contents:[{title:'Second content',type:'TEXT',objectiveIds:[anotherObjective]}]}],
  });
  const anotherReview=await runtime.submitReview(principal,another.id);assert.equal(anotherReview.status,'IN_REVIEW');
  await rejectCode(runtime.publish(principal,another.id,'m7-publish-1'),'IDEMPOTENCY_CONFLICT');

  console.log('M7 training authoring PostgreSQL qualification PASS');
 } finally { await db.close(); }
}
await main();
