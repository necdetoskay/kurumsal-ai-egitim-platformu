import React, { useState } from 'react';
import { applySaveResult, authoringPolicy, canSubmitForReview, nextEditableVersion, submitForReview, type TrainingDraft } from './authoring';

const initialDraft: TrainingDraft = {
  id: 'training-demo',
  title: 'Bilgi Güvenliği Farkındalığı',
  version: 1,
  stage: 'editing',
  learningObjectives: ['Phishing belirtilerini tanır', 'Şüpheli bağlantıları doğrular'],
  modules: ['Temel tehditler', 'Phishing ve sosyal mühendislik'],
  evidence: [
    { sourceId: 'source-policy', evidenceId: 'ev-001', label: 'Kurumsal Bilgi Güvenliği Politikası · Bölüm 4.2' },
    { sourceId: 'source-guide', evidenceId: 'ev-002', label: 'Farkındalık Rehberi · Phishing örnekleri' },
  ],
  aiGenerated: true,
  saveState: 'saved',
};

export function InstructorAuthoringWorkspace() {
  const [draft, setDraft] = useState<TrainingDraft>(initialDraft);
  const [mode, setMode] = useState<'edit' | 'preview' | 'history' | 'ai'>('edit');
  const policy = authoringPolicy(draft);
  const ready = canSubmitForReview(draft);

  function simulateSave(ok: boolean) {
    setDraft((current) => applySaveResult({ ...current, saveState: 'saving' }, ok));
  }

  function startPublishedEdit() {
    setDraft((current) => ({ ...current, version: nextEditableVersion(current), stage: 'editing', saveState: 'idle' }));
    setMode('edit');
  }

  function sendToReview() {
    setDraft((current) => submitForReview(current));
  }

  return <div className="authoring-workspace">
    <header className="page-header">
      <div><span className="eyebrow">Instructor Authoring · v{draft.version}</span><h1>{draft.title}</h1><p>Create → edit → preview → review handoff akışını evidence lineage ve version sınırlarıyla yönetin.</p></div>
      <span className="status-badge">{draft.stage}</span>
    </header>

    <nav className="authoring-tabs" aria-label="Authoring görünümü">
      {(['edit', 'preview', 'history', 'ai'] as const).map((item) => <button type="button" key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item === 'edit' ? 'Düzenle' : item === 'preview' ? 'Önizleme' : item === 'history' ? 'Versiyon Geçmişi' : 'AI Çalışma Alanı'}</button>)}
    </nav>

    {mode === 'edit' && <>
      <section className="content-card"><h2>Eğitim yapısı</h2><label className="field-label">Başlık<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, stage: 'editing', saveState: 'idle' }))} /></label><div className="authoring-columns"><div><h3>Learning Objectives</h3><ul>{draft.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div><div><h3>Modüller</h3><ul>{draft.modules.map((module) => <li key={module}>{module}</li>)}</ul></div></div></section>
      <section className="content-card"><h2>Source / Evidence Lineage</h2><p>Reviewer tarafında her türetilmiş içerik kaynağına geri izlenebilir.</p><ul className="evidence-list">{draft.evidence.map((evidence) => <li key={evidence.evidenceId}><strong>{evidence.label}</strong><span>{evidence.sourceId} → {evidence.evidenceId}</span></li>)}</ul></section>
      <section className="content-card authoring-actions"><div><strong>Save durumu: {draft.saveState}</strong>{draft.saveState === 'failed' && <p className="error-copy">Kaydetme başarısız. Başarı durumu gösterilmez ve review handoff engellenir.</p>}</div><div className="button-row"><button type="button" onClick={() => simulateSave(false)}>Kaydetme hatasını test et</button><button type="button" onClick={() => simulateSave(true)}>Kaydet</button><button type="button" className="primary-button" disabled={!ready} onClick={sendToReview}>İncelemeye gönder</button></div></section>
    </>}

    {mode === 'preview' && <section className="content-card"><h2>Eğitim Önizleme</h2><p><strong>{draft.title}</strong> · v{draft.version}</p><p>Bu görünüm learner-facing nihai yayın değildir; instructor preview yüzeyidir.</p><ol>{draft.modules.map((module) => <li key={module}>{module}</li>)}</ol></section>}

    {mode === 'history' && <section className="content-card"><h2>Versiyon davranışı</h2><p>Yayınlanmış içerik yerinde değiştirilmez. Edit işlemi yeni bir versiyon açar.</p>{draft.stage === 'published' ? <button type="button" className="primary-button" onClick={startPublishedEdit}>v{nextEditableVersion(draft)} taslağını oluştur</button> : <p>Aktif çalışma versiyonu: v{draft.version} · {draft.stage}</p>}</section>}

    {mode === 'ai' && <section className="content-card safety-card"><h2>AI Content Intelligence</h2><p>AI çıktıları yalnız taslak/proposal olarak kalır; doğrudan publish yetkisi yoktur.</p><div className="chip-row"><span className="state-chip">AI self-publish: {policy.aiCanSelfPublish ? 'allowed' : 'blocked'}</span><span className="state-chip">Evidence visible: {policy.evidenceVisible ? 'yes' : 'no'}</span></div></section>}
  </div>;
}
