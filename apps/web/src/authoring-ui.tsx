import React,{useEffect,useMemo,useState} from 'react';
import { bearerHttp } from './runtime-session';

type TrainingListItem={id:string;title:string;description?:string|null;status:'DRAFT'|'IN_REVIEW'|'PUBLISHED'|'ARCHIVED';revision:number};
type Objective={id:string;statement:string;status:string};
type Content={id:string;title:string;type:'TEXT'|'VIDEO';status:string;durationSeconds?:number|null;objectiveIds:string[]};
type Module={id:string;title:string;position:number;status:string;contents:Content[]};
type TrainingDraft={id:string;title:string;description?:string|null;status:'DRAFT'|'IN_REVIEW'|'PUBLISHED'|'ARCHIVED';revision:number;objectives:Objective[];modules:Module[]};

function newId(){return crypto.randomUUID();}
function errorState(error:unknown){return error instanceof Error?error.message:'UNKNOWN_ERROR';}

export function InstructorAuthoringWorkspace(){
 const http=useMemo(()=>bearerHttp(),[]);
 const [items,setItems]=useState<TrainingListItem[]>([]);
 const [selected,setSelected]=useState<TrainingDraft|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [title,setTitle]=useState('');
 const [description,setDescription]=useState('');
 const [objective,setObjective]=useState('');
 const [moduleTitle,setModuleTitle]=useState('');
 const [contentTitle,setContentTitle]=useState('');
 const [contentType,setContentType]=useState<'TEXT'|'VIDEO'>('TEXT');

 function hydrate(draft:TrainingDraft){
  setSelected(draft);setTitle(draft.title);setDescription(draft.description??'');
  setObjective(draft.objectives[0]?.statement??'');
  setModuleTitle(draft.modules[0]?.title??'');
  setContentTitle(draft.modules[0]?.contents[0]?.title??'');
  setContentType(draft.modules[0]?.contents[0]?.type??'TEXT');
 }
 async function load(){
  setLoading(true);setError(null);
  try{
   const list=await http.get<{items:TrainingListItem[]}>('/api/v1/trainings');
   setItems(list.items);
   if(list.items[0]) hydrate(await http.get<TrainingDraft>(`/api/v1/trainings/${encodeURIComponent(list.items[0].id)}`));
   else setSelected(null);
  }catch(e){setError(errorState(e));}finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);

 function resetNew(){
  setSelected(null);setTitle('');setDescription('');setObjective('');setModuleTitle('');setContentTitle('');setContentType('TEXT');setError(null);
 }
 function body(){
  const objectiveId=selected?.objectives[0]?.id??newId();
  const moduleId=selected?.modules[0]?.id??newId();
  const contentId=selected?.modules[0]?.contents[0]?.id??newId();
  return {
   title,description, ...(selected?{revision:selected.revision}:{}),
   objectives:[{id:objectiveId,statement:objective}],
   modules:[{id:moduleId,title:moduleTitle,contents:[{id:contentId,title:contentTitle,type:contentType,objectiveIds:[objectiveId]}]}],
  };
 }
 async function save(){
  setError(null);
  try{
   const draft=selected
    ?await http.patch<TrainingDraft>(`/api/v1/trainings/${encodeURIComponent(selected.id)}`,body())
    :await http.post<TrainingDraft>('/api/v1/trainings',body());
   hydrate(draft);await refreshList();
  }catch(e){setError(errorState(e));}
 }
 async function refreshList(){
  const list=await http.get<{items:TrainingListItem[]}>('/api/v1/trainings');setItems(list.items);
 }
 async function choose(id:string){
  setError(null);try{hydrate(await http.get<TrainingDraft>(`/api/v1/trainings/${encodeURIComponent(id)}`));}catch(e){setError(errorState(e));}
 }
 async function submitReview(){
  if(!selected)return;
  setError(null);try{hydrate(await http.post<TrainingDraft>(`/api/v1/trainings/${encodeURIComponent(selected.id)}/submit-review`));await refreshList();}catch(e){setError(errorState(e));}
 }
 async function publish(){
  if(!selected)return;
  setError(null);
  try{
   await http.request(`/api/v1/trainings/${encodeURIComponent(selected.id)}/publish`,{method:'POST',headers:{'idempotency-key':`web-publish-${selected.id}`}});
   hydrate(await http.get<TrainingDraft>(`/api/v1/trainings/${encodeURIComponent(selected.id)}`));await refreshList();
  }catch(e){setError(errorState(e));}
 }
 const editable=!selected||selected.status==='DRAFT';
 const complete=Boolean(title.trim()&&objective.trim()&&moduleTitle.trim()&&contentTitle.trim());

 if(loading)return <section className="content-card" aria-live="polite">Eğitimler yükleniyor…</section>;
 return <div className="authoring-workspace">
  <header className="page-header"><div><span className="eyebrow">Instructor Authoring · PostgreSQL authoritative</span><h1>{selected?.title||'Yeni Eğitim'}</h1><p>Taslak → inceleme → immutable yayın akışı. Sayfa yenilendiğinde çalışma sunucu durumundan yüklenir.</p></div><span className="status-badge" data-testid="training-status">{selected?.status??'NEW'}</span></header>
  {error&&<section className="content-card error-copy" role="alert" data-testid="authoring-error">{error}</section>}
  <section className="content-card">
   <div className="button-row"><button type="button" onClick={resetNew} data-testid="new-training">Yeni eğitim</button>
    <select aria-label="Eğitim seç" value={selected?.id??''} onChange={e=>{if(e.target.value)void choose(e.target.value)}}><option value="">Yeni eğitim</option>{items.map(item=><option key={item.id} value={item.id}>{item.title} · {item.status}</option>)}</select></div>
  </section>
  <section className="content-card">
   <h2>Eğitim yapısı</h2>
   <label className="field-label">Başlık<input data-testid="training-title" disabled={!editable} value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="field-label">Açıklama<input disabled={!editable} value={description} onChange={e=>setDescription(e.target.value)}/></label>
   <label className="field-label">Learning Objective<input data-testid="training-objective" disabled={!editable} value={objective} onChange={e=>setObjective(e.target.value)}/></label>
   <label className="field-label">Modül<input data-testid="training-module" disabled={!editable} value={moduleTitle} onChange={e=>setModuleTitle(e.target.value)}/></label>
   <label className="field-label">İçerik<input data-testid="training-content" disabled={!editable} value={contentTitle} onChange={e=>setContentTitle(e.target.value)}/></label>
   <label className="field-label">İçerik türü<select disabled={!editable} value={contentType} onChange={e=>setContentType(e.target.value as 'TEXT'|'VIDEO')}><option value="TEXT">Metin</option><option value="VIDEO">Video</option></select></label>
  </section>
  <section className="content-card authoring-actions">
   <div><strong>Revision: {selected?.revision??'yeni'}</strong><p>Objective → Module → Content bağı publish snapshot'ına kimlikleriyle taşınır.</p></div>
   <div className="button-row">
    <button type="button" data-testid="save-training" disabled={!editable||!complete} onClick={()=>void save()}>{selected?'Kaydet':'Taslak oluştur'}</button>
    <button type="button" data-testid="submit-training-review" disabled={!selected||selected.status!=='DRAFT'} onClick={()=>void submitReview()}>İncelemeye gönder</button>
    <button type="button" className="primary-button" data-testid="publish-training" disabled={!selected||selected.status!=='IN_REVIEW'} onClick={()=>void publish()}>Yayınla</button>
   </div>
  </section>
  {selected?.status==='PUBLISHED'&&<section className="content-card safety-card"><h2>Immutable publish</h2><p>Yayınlanmış versiyon yerinde düzenlenmez. Yeni değişiklik ayrı bir authoring/version akışı gerektirir.</p></section>}
 </div>;
}
