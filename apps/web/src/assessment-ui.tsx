import React,{useEffect,useMemo,useState} from 'react';
import { bearerHttp } from './runtime-session';
import './assessment-ui.css';

export type QuestionReviewState = 'draft' | 'ai-proposal' | 'approved' | 'rejected';
export type AssessmentPublishState = 'draft' | 'ready' | 'published';
export type QuestionRow = { id:string; stem:string; state:QuestionReviewState; evidenceRefs:string[]; answerKey:string; };
export type AssessmentDraft = { id:string; title:string; publishState:AssessmentPublishState; questionVersionIds:string[]; snapshotHash?:string; };

export function learnerQuestionProjection(question: QuestionRow) {
  return { id: question.id, stem: question.stem, state: question.state };
}
export function canPublishAssessment(assessment: AssessmentDraft, questions: QuestionRow[]): boolean {
  if (assessment.publishState === 'published') return false;
  if (assessment.questionVersionIds.length === 0) return false;
  return assessment.questionVersionIds.every((id) => questions.some((q) => q.id === id && q.state === 'approved'));
}

type ApiQuestion={id:string;status:'DRAFT'|'IN_REVIEW'|'APPROVED'|'RETIRED';questionVersionId?:string;prompt?:string;versions?:Array<{id:string;prompt:string;options:string[];correctOptionIndex:number}>};
type ApiAssessment={id:string;title?:string|null;status:'DRAFT'|'PUBLISHED'|'CLOSED'|'ARCHIVED';passPercent:number;trainingId?:string;trainingVersionId?:string};
type TrainingList={id:string;title:string;status:string};
type TrainingDetail={id:string;title:string;status:string;objectives:Array<{id:string;statement:string;status:string}>;versions:Array<{id:string;version:number}>};

function err(e:unknown){return e instanceof Error?e.message:'UNKNOWN_ERROR';}

export function QuestionAssessmentWorkspace({role='instructor'}:{role?:'instructor'|'reviewer'}){
 const http=useMemo(()=>bearerHttp(),[]);
 const [questions,setQuestions]=useState<ApiQuestion[]>([]);
 const [assessments,setAssessments]=useState<ApiAssessment[]>([]);
 const [trainings,setTrainings]=useState<TrainingList[]>([]);
 const [training,setTraining]=useState<TrainingDetail|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [prompt,setPrompt]=useState('');
 const [optionA,setOptionA]=useState('');
 const [optionB,setOptionB]=useState('');
 const [correct,setCorrect]=useState(1);
 const [assessmentTitle,setAssessmentTitle]=useState('');
 const [passPercent,setPassPercent]=useState(60);
 const [assessmentId,setAssessmentId]=useState('');
 const [questionVersionId,setQuestionVersionId]=useState('');

 async function load(){
  setError(null);
  try{
   const q=await http.get<{items:ApiQuestion[]}>('/api/v1/questions');setQuestions(q.items);
   if(role==='instructor'){
    const a=await http.get<{items:ApiAssessment[]}>('/api/v1/assessments');setAssessments(a.items);
    const t=await http.get<{items:TrainingList[]}>('/api/v1/trainings');setTrainings(t.items.filter(x=>x.status==='PUBLISHED'));
   }
  }catch(e){setError(err(e));}
 }
 useEffect(()=>{void load();},[role]);

 async function createQuestion(){
  setError(null);try{
   const created=await http.post<ApiQuestion>('/api/v1/questions',{prompt,options:[optionA,optionB],correctOptionIndex:correct});
   setPrompt('');setOptionA('');setOptionB('');setQuestions(current=>[created,...current]);await load();
  }catch(e){setError(err(e));}
 }
 async function submitQuestion(id:string){setError(null);try{await http.post(`/api/v1/questions/${encodeURIComponent(id)}/submit-review`);await load();}catch(e){setError(err(e));}}
 async function approveQuestion(id:string){setError(null);try{await http.post(`/api/v1/questions/${encodeURIComponent(id)}/approve`);await load();}catch(e){setError(err(e));}}
 async function chooseTraining(id:string){
  setError(null);try{setTraining(id?await http.get<TrainingDetail>(`/api/v1/trainings/${encodeURIComponent(id)}`):null);}catch(e){setError(err(e));}
 }
 async function createAssessment(){
  setError(null);try{
   const a=await http.post<ApiAssessment>('/api/v1/assessments',{title:assessmentTitle,passPercent});
   setAssessmentId(a.id);setAssessments(current=>[a,...current]);
  }catch(e){setError(err(e));}
 }
 async function publish(){
  if(!assessmentId||!training||!questionVersionId)return;
  const objectiveId=training.objectives.find(x=>x.status==='ACTIVE')?.id;
  const trainingVersionId=training.versions[0]?.id;
  if(!objectiveId||!trainingVersionId){setError('TRAINING_VERSION_OR_OBJECTIVE_REQUIRED');return;}
  setError(null);try{
   await http.post(`/api/v1/assessments/${encodeURIComponent(assessmentId)}/publish`,{
    trainingId:training.id,trainingVersionId,required:true,questions:[{questionVersionId,objectiveId,points:1}],
   });await load();
  }catch(e){setError(err(e));}
 }

 return <div className="assessment-workspace">
  <header className="page-header"><div><span className="eyebrow">{role==='reviewer'?'Reviewer':'Instructor'} · PostgreSQL authoritative</span><h1>Soru Bankası ve Değerlendirmeler</h1><p>Soru review/approval ve immutable assessment snapshot akışı.</p></div><span className="status-badge">Answer key learner projectionında yok</span></header>
  {error&&<section className="content-card error-copy" role="alert" data-testid="assessment-error">{error}</section>}
  {role==='instructor'&&<section className="content-card"><h2>Yeni soru</h2>
   <label className="field-label">Soru<input data-testid="question-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)}/></label>
   <label className="field-label">Seçenek A<input data-testid="question-option-a" value={optionA} onChange={e=>setOptionA(e.target.value)}/></label>
   <label className="field-label">Seçenek B<input data-testid="question-option-b" value={optionB} onChange={e=>setOptionB(e.target.value)}/></label>
   <label className="field-label">Doğru seçenek<select value={correct} onChange={e=>setCorrect(Number(e.target.value))}><option value={0}>A</option><option value={1}>B</option></select></label>
   <button type="button" data-testid="create-question" disabled={!prompt.trim()||!optionA.trim()||!optionB.trim()} onClick={()=>void createQuestion()}>Soru oluştur</button>
  </section>}
  <section className="content-card"><h2>{role==='reviewer'?'İnceleme kuyruğu':'Sorular'}</h2>
   {questions.length===0?<p>Henüz soru yok.</p>:<ul className="question-list">{questions.map(q=><li key={q.id}><div><strong>{q.prompt??q.versions?.at(-1)?.prompt??q.id}</strong><p>{q.status}</p></div><div className="button-row">
    {role==='instructor'&&q.status==='DRAFT'&&<button type="button" data-testid={`submit-question-${q.id}`} onClick={()=>void submitQuestion(q.id)}>İncelemeye gönder</button>}
    {role==='reviewer'&&q.status==='IN_REVIEW'&&<button type="button" data-testid={`approve-question-${q.id}`} onClick={()=>void approveQuestion(q.id)}>Onayla</button>}
   </div></li>)}</ul>}
  </section>
  {role==='instructor'&&<>
   <section className="content-card"><h2>Assessment oluştur</h2>
    <label className="field-label">Başlık<input data-testid="assessment-title" value={assessmentTitle} onChange={e=>setAssessmentTitle(e.target.value)}/></label>
    <label className="field-label">Geçme yüzdesi<input type="number" min={0} max={100} value={passPercent} onChange={e=>setPassPercent(Number(e.target.value))}/></label>
    <button type="button" data-testid="create-assessment" disabled={!assessmentTitle.trim()} onClick={()=>void createAssessment()}>Taslak oluştur</button>
    <select aria-label="Assessment seç" value={assessmentId} onChange={e=>setAssessmentId(e.target.value)}><option value="">Assessment seç</option>{assessments.map(a=><option key={a.id} value={a.id}>{a.title??a.id} · {a.status}</option>)}</select>
   </section>
   <section className="content-card"><h2>Assessment yayınla</h2>
    <label className="field-label">Yayınlanmış eğitim<select data-testid="assessment-training" value={training?.id??''} onChange={e=>void chooseTraining(e.target.value)}><option value="">Eğitim seç</option>{trainings.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
    <label className="field-label">Onaylı soru<select data-testid="assessment-question" value={questionVersionId} onChange={e=>setQuestionVersionId(e.target.value)}><option value="">Soru seç</option>{questions.filter(q=>q.status==='APPROVED').map(q=><option key={q.questionVersionId??q.id} value={q.questionVersionId??q.versions?.at(-1)?.id??''}>{q.prompt??q.versions?.at(-1)?.prompt??q.id}</option>)}</select></label>
    <button type="button" className="primary-button" data-testid="publish-assessment" disabled={!assessmentId||!training||!questionVersionId} onClick={()=>void publish()}>Snapshot oluştur ve yayınla</button>
   </section>
  </>}
  <section className="content-card safety-card"><h2>Learner projection güvenlik sınırı</h2><p>Doğru cevap anahtarı yalnız server scoring sınırında kalır; learner payload'ına dahil edilmez.</p></section>
 </div>;
}
