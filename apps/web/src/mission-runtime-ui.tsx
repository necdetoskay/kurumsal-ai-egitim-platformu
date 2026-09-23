import React,{useEffect,useMemo,useState} from 'react';
import { bearerHttp } from './runtime-session';

type LoadState='loading'|'ready'|'empty'|'error';
function ErrorBox({error}:{error:string|null}){return error?<p className="error-copy" role="alert">{error}</p>:null;}
function err(e:unknown){return e instanceof Error?e.message:'UNKNOWN_ERROR';}

type Organization={id:string;name:string;code:string};
type Company={id:string;name:string;code:string;departments?:Department[]};
type Department={id:string;name:string;code:string};
type Employee={id:string;first_name?:string;firstName?:string;last_name?:string;lastName?:string;linkedUserId?:string|null};
type Group={id:string;name:string;code:string};
type Training={id:string;title:string;status:string;revision:number};
type Version={id:string;version:number;publishedAt:string};
type TargetType='ORGANIZATION'|'COMPANY'|'DEPARTMENT'|'GROUP'|'EMPLOYEE';
type AudiencePreview={fingerprint:string;targetCount:number;expandedCandidateCount:number;overlapCount:number;uniqueEmployeeCount:number;assignableLearnerCount:number;unlinkedEmployeeIds:string[]};
type AudienceHandoff={resolutionId:string;resolutionFingerprint:string;trainingId:string;trainingVersionId:string;assignmentCandidateLearnerIds:string[];unlinkedEmployeeIds:string[]};

export function AudienceRuntimeView(){
 const http=useMemo(()=>bearerHttp(),[]);
 const [state,setState]=useState<LoadState>('loading');const [error,setError]=useState<string|null>(null);
 const [orgs,setOrgs]=useState<Organization[]>([]);const [orgId,setOrgId]=useState('');
 const [companies,setCompanies]=useState<Company[]>([]);const [employees,setEmployees]=useState<Employee[]>([]);const [groups,setGroups]=useState<Group[]>([]);
 const [trainings,setTrainings]=useState<Training[]>([]);const [trainingId,setTrainingId]=useState('');const [versions,setVersions]=useState<Version[]>([]);const [versionId,setVersionId]=useState('');
 const [targetType,setTargetType]=useState<TargetType>('ORGANIZATION');const [targetId,setTargetId]=useState('');
 const [preview,setPreview]=useState<AudiencePreview|null>(null);const [handoff,setHandoff]=useState<AudienceHandoff|null>(null);const [assigned,setAssigned]=useState<any>(null);

 useEffect(()=>{void(async()=>{try{
   const [o,t]=await Promise.all([http.get<{items:Organization[]}>('/api/v1/organizations'),http.get<{items:Training[]}>('/api/v1/trainings')]);
   setOrgs(o.items);setTrainings(t.items.filter(x=>x.status==='PUBLISHED'));
   if(o.items[0])setOrgId(o.items[0].id);if(t.items.find(x=>x.status==='PUBLISHED'))setTrainingId(t.items.find(x=>x.status==='PUBLISHED')!.id);
   setState(o.items.length?'ready':'empty');
 }catch(e){setError(err(e));setState('error')}})()},[]);

 useEffect(()=>{if(!orgId)return;setTargetId(orgId);void(async()=>{try{
   const [tree,emp,grp]=await Promise.all([
    http.get<any>(`/api/v1/organizations/${encodeURIComponent(orgId)}/tree`),
    http.get<{items:Employee[]}>(`/api/v1/organizations/${encodeURIComponent(orgId)}/employees`),
    http.get<{items:Group[]}>(`/api/v1/organizations/${encodeURIComponent(orgId)}/groups`),
   ]);
   setCompanies(tree.companies??[]);setEmployees(emp.items);setGroups(grp.items);
 }catch(e){setError(err(e));}})()},[orgId]);

 useEffect(()=>{if(!trainingId){setVersions([]);setVersionId('');return;}void(async()=>{try{
   const v=await http.get<{items:Version[]}>(`/api/v1/trainings/${encodeURIComponent(trainingId)}/versions`);
   setVersions(v.items);setVersionId(v.items[0]?.id??'');
 }catch(e){setError(err(e));}})()},[trainingId]);

 useEffect(()=>{setPreview(null);setHandoff(null);setAssigned(null);
   if(targetType==='ORGANIZATION')setTargetId(orgId);
   else setTargetId('');
 },[targetType,orgId,trainingId,versionId]);

 const options=targetType==='ORGANIZATION'?orgs.map(x=>({id:x.id,label:x.name}))
  :targetType==='COMPANY'?companies.map(x=>({id:x.id,label:x.name}))
  :targetType==='DEPARTMENT'?companies.flatMap(c=>(c.departments??[]).map(d=>({id:d.id,label:`${c.name} / ${d.name}`})))
  :targetType==='GROUP'?groups.map(x=>({id:x.id,label:x.name}))
  :employees.map(x=>({id:x.id,label:`${x.first_name??x.firstName??''} ${x.last_name??x.lastName??''}`.trim()+(x.linkedUserId?' · linked':' · unlinked')}));

 async function doPreview(){
  setError(null);setPreview(null);setHandoff(null);setAssigned(null);
  try{
   const p=await http.post<AudiencePreview>('/api/v1/training-audiences/preview',{organizationId:orgId,trainingId,trainingVersionId:versionId,targets:[{type:targetType,id:targetId}]});
   setPreview(p);
  }catch(e){setError(err(e));}
 }
 async function confirm(){
  if(!preview)return;setError(null);
  try{
   const h=await http.post<AudienceHandoff>('/api/v1/training-audiences/confirm',{organizationId:orgId,trainingId,trainingVersionId:versionId,targets:[{type:targetType,id:targetId}],resolutionFingerprint:preview.fingerprint,idempotencyKey:`ui-confirm-${trainingId}-${versionId}-${targetType}-${targetId}`});
   setHandoff(h);
  }catch(e){setError(err(e));}
 }
 async function assign(){
  if(!handoff)return;setError(null);
  try{
   const a=await http.post<any>(`/api/v1/training-audiences/${encodeURIComponent(handoff.resolutionId)}/assignments`,{trainingId:handoff.trainingId,trainingVersionId:handoff.trainingVersionId,resolutionFingerprint:handoff.resolutionFingerprint,idempotencyKey:`ui-assign-${handoff.resolutionId}`});
   setAssigned(a);
  }catch(e){setError(err(e));}
 }
 if(state==='loading')return <section className="content-card">Kitle verileri yükleniyor…</section>;
 if(state==='empty')return <section className="content-card">Önce bir organizasyon oluşturun.</section>;
 return <div className="authoring-workspace" data-testid="audience-runtime">
  <header className="page-header"><div><span className="eyebrow">Authoritative Audience</span><h1>Eğitim Kitlesi</h1><p>Canlı organizasyon yapısını preview eder, immutable resolution snapshot oluşturur ve assignment üretir.</p></div></header>
  <ErrorBox error={error}/>
  <section className="content-card">
   <label className="field-label">Organizasyon<select data-testid="audience-org" value={orgId} onChange={e=>setOrgId(e.target.value)}>{orgs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   <label className="field-label">Yayınlanmış eğitim<select data-testid="audience-training" value={trainingId} onChange={e=>setTrainingId(e.target.value)}><option value="">Seçin</option>{trainings.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
   <label className="field-label">Versiyon<select data-testid="audience-version" value={versionId} onChange={e=>setVersionId(e.target.value)}><option value="">Seçin</option>{versions.map(x=><option key={x.id} value={x.id}>v{x.version}</option>)}</select></label>
   <label className="field-label">Hedef tipi<select data-testid="audience-target-type" value={targetType} onChange={e=>setTargetType(e.target.value as TargetType)}>{(['ORGANIZATION','COMPANY','DEPARTMENT','GROUP','EMPLOYEE'] as const).map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label className="field-label">Hedef<select data-testid="audience-target" value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">Seçin</option>{options.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
   <button type="button" data-testid="audience-preview" disabled={!orgId||!trainingId||!versionId||!targetId} onClick={()=>void doPreview()}>Kitleyi Önizle</button>
  </section>
  {preview&&<section className="content-card" data-testid="audience-preview-result"><h2>Preview</h2><p>Tekil personel: <strong>{preview.uniqueEmployeeCount}</strong> · atanabilir öğrenen: <strong>{preview.assignableLearnerCount}</strong> · çakışma: {preview.overlapCount}</p><p>Bağlı olmayan personel: {preview.unlinkedEmployeeIds.length}</p><button type="button" data-testid="audience-confirm" onClick={()=>void confirm()}>Immutable kitleyi onayla</button></section>}
  {handoff&&<section className="content-card" data-testid="audience-confirm-result"><h2>Resolution #{handoff.resolutionId.slice(0,8)}</h2><p>Assignment adayı: {handoff.assignmentCandidateLearnerIds.length} · bağlı olmayan: {handoff.unlinkedEmployeeIds.length}</p><button type="button" data-testid="audience-assign" disabled={handoff.assignmentCandidateLearnerIds.length===0} onClick={()=>void assign()}>Atamaları oluştur</button></section>}
  {assigned&&<section className="content-card safety-card" data-testid="audience-assigned"><h2>Atamalar kalıcılaştırıldı</h2><p data-testid="audience-assignment-replay">Replay: {String(Boolean(assigned.replayed))}</p><pre>{JSON.stringify(assigned.result??assigned,null,2)}</pre></section>}
 </div>;
}

type Assignment={id:string;trainingId:string;trainingVersionId:string;status:string;title:string;description?:string|null};
type LearnerTraining={assignmentId:string;trainingId:string;trainingVersionId:string;status:string;title:string;description?:string|null;version:number;snapshot:any};
type Resume={trainingVersionId:string;assignmentId:string;progress:Array<{kind:string;sourceId:string;progressPermille:number;completed:boolean;positionSeconds?:number|null}>};

export function LearnerTrainingRuntimeView(){
 const http=useMemo(()=>bearerHttp(),[]);const [items,setItems]=useState<Assignment[]>([]);const [training,setTraining]=useState<LearnerTraining|null>(null);const [resume,setResume]=useState<Resume|null>(null);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);
 async function load(){setLoading(true);setError(null);try{const r=await http.get<{items:Assignment[]}>('/api/v1/learner/assignments');setItems(r.items);if(r.items[0])await open(r.items[0]);}catch(e){setError(err(e));}finally{setLoading(false);}}
 async function open(a:Assignment){const t=await http.get<LearnerTraining>(`/api/v1/learner/trainings/${encodeURIComponent(a.trainingId)}`);setTraining(t);try{setResume(await http.get<Resume>(`/api/v1/learner/trainings/${encodeURIComponent(a.trainingVersionId)}/resume`));}catch{setResume(null);}}
 useEffect(()=>{void load();},[]);
 async function completeModule(moduleId:string){if(!training)return;setError(null);try{await http.put(`/api/v1/learner/modules/${encodeURIComponent(moduleId)}/progress`,{assignmentId:training.assignmentId,trainingVersionId:training.trainingVersionId,progressPermille:1000,completed:true});setResume(await http.get<Resume>(`/api/v1/learner/trainings/${encodeURIComponent(training.trainingVersionId)}/resume`));}catch(e){setError(err(e));}}
 if(loading)return <section className="content-card">Atamalar yükleniyor…</section>;
 return <div data-testid="learner-training-runtime"><header className="page-header"><div><span className="eyebrow">Learner Runtime</span><h1>Eğitimlerim</h1><p>Atamalar ve ilerleme doğrudan server-authoritative state üzerinden okunur.</p></div></header><ErrorBox error={error}/>
  <section className="content-card"><h2>Atamalar</h2>{items.length===0?<p data-testid="no-assignments">Aktif atama yok.</p>:<ul>{items.map(a=><li key={a.id}><button type="button" data-testid={`assignment-${a.id}`} onClick={()=>void open(a)}>{a.title} · {a.status}</button></li>)}</ul>}</section>
  {training&&<section className="content-card" data-testid="learner-training"><h2>{training.title}</h2><p>Published v{training.version}</p>{(training.snapshot?.modules??[]).map((m:any)=><article key={m.id}><h3>{m.title}</h3><button type="button" data-testid={`complete-module-${m.id}`} disabled={resume?.progress.some(p=>p.kind==='MODULE'&&p.sourceId===m.id&&p.completed)} onClick={()=>void completeModule(m.id)}>Modülü tamamla</button></article>)}<h3>İçerikler</h3><ul>{(training.snapshot?.contents??[]).map((x:any)=><li key={x.id}>{x.title} · {x.type}</li>)}</ul></section>}
  {resume&&<section className="content-card" data-testid="resume-state"><h2>Resume</h2><p>Tamamlanan öğe: {resume.progress.filter(p=>p.completed).length}</p></section>}
 </div>;
}

type AssessmentQuestion={id:string;questionVersionId:string;objectiveId?:string|null;position:number;prompt:string;options:string[];points:number};
type AssessmentItem={id:string;passPercent:number;assignmentId:string;trainingId:string;trainingVersionId:string;questions:AssessmentQuestion[]};
type Attempt={id:string;assessmentId:string;status:string;scorePercent:number|null;passPercent:number;passed:boolean|null;questions:AssessmentQuestion[];answers:Array<{questionVersionId:string;selectedOptionIndex:number}>};
export function LearnerAssessmentRuntimeView(){
 const http=useMemo(()=>bearerHttp(),[]);const [items,setItems]=useState<AssessmentItem[]>([]);const [attempt,setAttempt]=useState<Attempt|null>(null);const [result,setResult]=useState<any>(null);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{void(async()=>{try{const r=await http.get<{items:AssessmentItem[]}>('/api/v1/learner/assessments');setItems(r.items);}catch(e){setError(err(e));}finally{setLoading(false)}})()},[]);
 async function start(id:string){setError(null);try{setAttempt(await http.post<Attempt>(`/api/v1/assessments/${encodeURIComponent(id)}/attempts`));setResult(null);}catch(e){setError(err(e));}}
 async function answer(q:AssessmentQuestion,index:number){if(!attempt)return;setError(null);try{await http.put(`/api/v1/attempts/${encodeURIComponent(attempt.id)}/answers/${encodeURIComponent(q.questionVersionId)}`,{selectedOptionIndex:index});setAttempt({...attempt,answers:[...attempt.answers.filter(a=>a.questionVersionId!==q.questionVersionId),{questionVersionId:q.questionVersionId,selectedOptionIndex:index}]});}catch(e){setError(err(e));}}
 async function submit(){if(!attempt)return;setError(null);try{const r=await http.post<any>(`/api/v1/attempts/${encodeURIComponent(attempt.id)}/submit`);setResult(r);setAttempt({...attempt,status:r.status,scorePercent:r.scorePercent,passed:r.passed});}catch(e){setError(err(e));}}
 async function retake(){if(!attempt)return;setError(null);try{await http.post(`/api/v1/attempts/${encodeURIComponent(attempt.id)}/retake`);setResult({retakeRequested:true});}catch(e){setError(err(e));}}
 if(loading)return <section className="content-card">Değerlendirmeler yükleniyor…</section>;
 return <div data-testid="learner-assessment-runtime"><header className="page-header"><div><span className="eyebrow">Assessment Runtime</span><h1>Değerlendirmeler</h1><p>Answer key istemciye gönderilmez; attempt ve scoring sunucu tarafında yönetilir.</p></div></header><ErrorBox error={error}/>
  <section className="content-card">{items.length===0?<p>Uygun değerlendirme yok.</p>:items.map(a=><button key={a.id} type="button" data-testid={`start-assessment-${a.id}`} onClick={()=>void start(a.id)}>Değerlendirmeyi başlat · geçme %{a.passPercent}</button>)}</section>
  {attempt&&<section className="content-card" data-testid="assessment-attempt"><h2>Attempt</h2>{attempt.questions.map(q=><fieldset key={q.questionVersionId}><legend>{q.prompt}</legend>{q.options.map((o,i)=><label key={i}><input type="radio" name={q.questionVersionId} checked={attempt.answers.some(a=>a.questionVersionId===q.questionVersionId&&a.selectedOptionIndex===i)} onChange={()=>void answer(q,i)}/>{o}</label>)}</fieldset>)}<button type="button" data-testid="submit-assessment" disabled={attempt.status==='COMPLETED'||attempt.questions.some(q=>!attempt.answers.some(a=>a.questionVersionId===q.questionVersionId))} onClick={()=>void submit()}>Gönder ve puanla</button></section>}
  {result&&<section className="content-card safety-card" data-testid="assessment-result"><h2>Sonuç</h2>{result.retakeRequested?<p>Tekrar talebi oluşturuldu.</p>:<><p>Puan: %{result.scorePercent} · {result.passed?'Başarılı':'Başarısız'}</p>{result.passed===false&&<button type="button" data-testid="request-retake" onClick={()=>void retake()}>Tekrar talep et</button>}</>}</section>}
 </div>;
}

type InsightResponse={status:'INSUFFICIENT_EVIDENCE'|'BOUNDED_INSIGHT'|'SUFFICIENT_NO_WEAK_AREA';trainingVersionId:string;evidenceCount:number;minimumPerObjective:number;insights:Array<{objectiveId:string;statement:string;sampleCount:number;scorePercent:number;confidence:string;weak:boolean}>;recommendations:Array<{objectiveId:string;contentId:string;moduleId:string;title:string;type:string}>};
export function LearnerInsightRuntimeView(){
 const http=useMemo(()=>bearerHttp(),[]);const [assignments,setAssignments]=useState<Assignment[]>([]);const [versionId,setVersionId]=useState('');const [data,setData]=useState<InsightResponse|null>(null);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{void(async()=>{try{const r=await http.get<{items:Assignment[]}>('/api/v1/learner/assignments');setAssignments(r.items);setVersionId(r.items[0]?.trainingVersionId??'');}catch(e){setError(err(e));}})()},[]);
 async function load(){if(!versionId)return;setError(null);try{setData(await http.get<InsightResponse>(`/api/v1/learner/insights?trainingVersionId=${encodeURIComponent(versionId)}`));}catch(e){setError(err(e));}}
 return <div data-testid="learner-insight-runtime"><header className="page-header"><div><span className="eyebrow">Evidence-bounded Insight</span><h1>Öğrenme İçgörüleri</h1></div></header><ErrorBox error={error}/><section className="content-card"><select data-testid="insight-version" value={versionId} onChange={e=>setVersionId(e.target.value)}>{assignments.map(a=><option key={a.id} value={a.trainingVersionId}>{a.title}</option>)}</select><button type="button" data-testid="load-insights" disabled={!versionId} onClick={()=>void load()}>İçgörüleri getir</button></section>{data&&<section className="content-card" data-testid="insight-result"><h2>{data.status}</h2><p>Evidence: {data.evidenceCount} · objective başına minimum: {data.minimumPerObjective}</p>{data.status==='INSUFFICIENT_EVIDENCE'?<p>Yeterli kanıt oluşmadığı için sistem yorum üretmedi.</p>:<>{data.insights.map(i=><p key={i.objectiveId}>{i.statement}: %{i.scorePercent} · {i.confidence}</p>)}<h3>Öneriler</h3><ul>{data.recommendations.map(r=><li key={r.contentId}>{r.title} · {r.type}</li>)}</ul></>}</section>}</div>;
}

type Certificate={id:string;trainingId:string;trainingVersionId:string;status:string;issuedAt:string;revokedAt?:string|null;revokeReason?:string|null};
export function LearnerCertificateRuntimeView(){
 const http=useMemo(()=>bearerHttp(),[]);const [items,setItems]=useState<Certificate[]>([]);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{void(async()=>{try{setItems((await http.get<{items:Certificate[]}>('/api/v1/learner/certificates')).items);}catch(e){setError(err(e));}finally{setLoading(false)}})()},[]);
 if(loading)return <section className="content-card">Sertifikalar yükleniyor…</section>;
 return <div data-testid="learner-certificates-runtime"><header className="page-header"><div><h1>Sertifikalarım</h1></div></header><ErrorBox error={error}/><section className="content-card">{items.length===0?<p data-testid="no-certificates">Henüz sertifika yok.</p>:items.map(c=><article key={c.id} data-testid={`certificate-${c.id}`}><strong>{c.status}</strong><p>Training version: {c.trainingVersionId}</p><small>{c.issuedAt}</small></article>)}</section></div>;
}

type AnalyticsResult={scope:{type:string;id:string;basis:string};privacy:{minimumCohort:number;suppressed:boolean;cohortSize:number|null};assignmentSummary:{assigned:number;completed:number;completionRatePercent:number}|null;objectiveSignals:Array<{objectiveId:string;statement:string;qualifiedLearners:number;weakLearners:number;evidenceCount:number;weakPrevalencePercent:number}>;questionSignals:any[];tenantUnmappedAudienceAssignments:number};
export function AdminAnalyticsRuntimeView(){
 const http=useMemo(()=>bearerHttp(),[]);const [orgs,setOrgs]=useState<Organization[]>([]);const [orgId,setOrgId]=useState('');const [data,setData]=useState<AnalyticsResult|null>(null);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{void(async()=>{try{const r=await http.get<{items:Organization[]}>('/api/v1/organizations');setOrgs(r.items);setOrgId(r.items[0]?.id??'');}catch(e){setError(err(e));}})()},[]);
 async function load(){if(!orgId)return;setError(null);try{setData(await http.get<AnalyticsResult>(`/api/v1/admin/learning-analytics?scopeType=ORGANIZATION&scopeId=${encodeURIComponent(orgId)}`));}catch(e){setError(err(e));}}
 return <div data-testid="admin-analytics-runtime"><header className="page-header"><div><span className="eyebrow">Privacy-safe aggregate</span><h1>Öğrenme Analitiği</h1></div></header><ErrorBox error={error}/><section className="content-card"><select data-testid="analytics-org" value={orgId} onChange={e=>setOrgId(e.target.value)}>{orgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select><button type="button" data-testid="load-admin-analytics" disabled={!orgId} onClick={()=>void load()}>Analitiği getir</button></section>{data&&<section className="content-card" data-testid="analytics-result"><h2>{data.privacy.suppressed?'SUPPRESSED':'AGGREGATED'}</h2><p>Minimum cohort: {data.privacy.minimumCohort} · cohort: {data.privacy.cohortSize??'gizli'}</p>{data.assignmentSummary&&<p>Atanan: {data.assignmentSummary.assigned} · tamamlanan: {data.assignmentSummary.completed} · oran: %{data.assignmentSummary.completionRatePercent}</p>}<ul>{data.objectiveSignals.map(x=><li key={x.objectiveId}>{x.statement}: weak prevalence %{x.weakPrevalencePercent} · evidence {x.evidenceCount}</li>)}</ul><p>Tenant-wide doğrudan/unmapped atama: {data.tenantUnmappedAudienceAssignments}</p></section>}</div>;
}
