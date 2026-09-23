import React,{useEffect,useMemo,useState} from 'react';
import { bearerHttp } from './runtime-session';

type Training={id:string;title:string;status:string};
type Version={id:string;version:number;publishedAt:string};
type Objective={id:string;statement:string;status:string};
type TrainingDetail={id:string;title:string;status:string;objectives:Objective[]};
type ApprovedQuestion={questionVersionId:string;questionId:string;version:number;prompt:string;options:string[]};
type AssessmentSummary={id:string;status:string;passPercent:number;questionCount:number;createdAt:string};

function message(e:unknown){return e instanceof Error?e.message:'UNKNOWN_ERROR';}

export function AssessmentAuthoringRuntimeView(){
 const http=useMemo(()=>bearerHttp(),[]);
 const [trainings,setTrainings]=useState<Training[]>([]);const [trainingId,setTrainingId]=useState('');
 const [versions,setVersions]=useState<Version[]>([]);const [versionId,setVersionId]=useState('');
 const [objectives,setObjectives]=useState<Objective[]>([]);const [objectiveId,setObjectiveId]=useState('');
 const [questions,setQuestions]=useState<ApprovedQuestion[]>([]);const [selected,setSelected]=useState<string[]>([]);
 const [passPercent,setPassPercent]=useState(70);const [assessments,setAssessments]=useState<AssessmentSummary[]>([]);
 const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);const [lastPublished,setLastPublished]=useState<any>(null);

 useEffect(()=>{void(async()=>{try{
   const [t,q]=await Promise.all([http.get<{items:Training[]}>('/api/v1/trainings'),http.get<{items:ApprovedQuestion[]}>('/api/v1/question-versions/approved')]);
   const published=t.items.filter(x=>x.status==='PUBLISHED');setTrainings(published);setQuestions(q.items);setTrainingId(published[0]?.id??'');
 }catch(e){setError(message(e));}finally{setLoading(false)}})()},[]);

 useEffect(()=>{if(!trainingId){setVersions([]);setVersionId('');setObjectives([]);return;}void(async()=>{try{
   const [v,d]=await Promise.all([
    http.get<{items:Version[]}>(`/api/v1/trainings/${encodeURIComponent(trainingId)}/versions`),
    http.get<TrainingDetail>(`/api/v1/trainings/${encodeURIComponent(trainingId)}`),
   ]);
   setVersions(v.items);setVersionId(v.items[0]?.id??'');setObjectives(d.objectives.filter(x=>x.status==='ACTIVE'));setObjectiveId(d.objectives.find(x=>x.status==='ACTIVE')?.id??'');
 }catch(e){setError(message(e));}})()},[trainingId]);

 useEffect(()=>{setLastPublished(null);setAssessments([]);if(!trainingId||!versionId)return;void(refreshAssessments())},[trainingId,versionId]);

 async function refreshAssessments(){
  if(!trainingId||!versionId)return;
  try{const r=await http.get<{items:AssessmentSummary[]}>(`/api/v1/trainings/${encodeURIComponent(trainingId)}/versions/${encodeURIComponent(versionId)}/assessments`);setAssessments(r.items);}
  catch(e){setError(message(e));}
 }
 function toggle(id:string){setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
 async function publish(){
  if(!trainingId||!versionId||!objectiveId||selected.length===0)return;
  setError(null);
  try{
   const body={passPercent,questions:selected.map(questionVersionId=>({questionVersionId,objectiveId,points:1}))};
   const result=await http.request<any>(`/api/v1/trainings/${encodeURIComponent(trainingId)}/versions/${encodeURIComponent(versionId)}/assessments`,{
    method:'POST',headers:{'idempotency-key':`ui-assessment-${versionId}`},body:JSON.stringify(body),
   });
   setLastPublished(result);await refreshAssessments();
  }catch(e){setError(message(e));}
 }

 if(loading)return <section className="content-card">Assessment authoring yükleniyor…</section>;
 return <div className="authoring-workspace" data-testid="assessment-authoring-runtime">
  <header className="page-header"><div><span className="eyebrow">Immutable Assessment Snapshot</span><h1>Değerlendirme Yayınlama</h1><p>Yalnız onaylı QuestionVersion varlıkları published TrainingVersion ve Learning Objective ile bağlanır. Answer key istemciye açılmaz.</p></div></header>
  {error&&<section className="content-card error-copy" role="alert" data-testid="assessment-authoring-error">{error}</section>}
  <section className="content-card">
   <label className="field-label">Yayınlanmış eğitim<select data-testid="assessment-training" value={trainingId} onChange={e=>setTrainingId(e.target.value)}><option value="">Seçin</option>{trainings.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
   <label className="field-label">TrainingVersion<select data-testid="assessment-version" value={versionId} onChange={e=>setVersionId(e.target.value)}><option value="">Seçin</option>{versions.map(v=><option key={v.id} value={v.id}>v{v.version}</option>)}</select></label>
   <label className="field-label">Learning Objective<select data-testid="assessment-objective" value={objectiveId} onChange={e=>setObjectiveId(e.target.value)}><option value="">Seçin</option>{objectives.map(o=><option key={o.id} value={o.id}>{o.statement}</option>)}</select></label>
   <label className="field-label">Geçme puanı<input data-testid="assessment-pass-percent" type="number" min={0} max={100} value={passPercent} onChange={e=>setPassPercent(Number(e.target.value))}/></label>
  </section>
  <section className="content-card"><h2>Onaylı sorular</h2>{questions.length===0?<p data-testid="no-approved-questions">Onaylı QuestionVersion yok.</p>:questions.map(q=><label key={q.questionVersionId}><input data-testid={`assessment-question-${q.questionVersionId}`} type="checkbox" checked={selected.includes(q.questionVersionId)} onChange={()=>toggle(q.questionVersionId)}/><strong>{q.prompt}</strong><span> · {q.options.length} seçenek · v{q.version}</span></label>)}</section>
  <section className="content-card authoring-actions"><button type="button" className="primary-button" data-testid="publish-assessment-snapshot" disabled={!trainingId||!versionId||!objectiveId||selected.length===0} onClick={()=>void publish()}>Assessment snapshot yayınla</button></section>
  {lastPublished&&<section className="content-card safety-card" data-testid="assessment-published"><h2>Assessment yayınlandı</h2><p>{lastPublished.id} · soru: {lastPublished.questions?.length??0} · replay: {String(lastPublished.replayed)}</p></section>}
  <section className="content-card"><h2>Bu versiyondaki assessment'lar</h2>{assessments.length===0?<p>Henüz assessment yok.</p>:<ul>{assessments.map(a=><li key={a.id}>{a.id.slice(0,8)} · {a.status} · {a.questionCount} soru · geçme %{a.passPercent}</li>)}</ul>}</section>
 </div>;
}
