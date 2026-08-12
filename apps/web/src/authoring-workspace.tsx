import React, { useState } from 'react';
import { aiCandidatePolicy, canSubmitForReview, demoTraining, publishedEditMessage, visibleEvidence, type SaveState } from './authoring-ui';

export function AuthoringWorkspace() {
  const [step, setStep] = useState<'edit' | 'preview' | 'review'>('edit');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const training = demoTraining;
  const evidence = visibleEvidence(training);
  const aiPolicy = aiCandidatePolicy(training);
  const versionMessage = publishedEditMessage(training);

  function simulateSave(next: SaveState) {
    setSaveState(next);
  }

  return <div className="authoring-stack">
    <header className="page-header">
      <div><span className="eyebrow">Instructor Authoring · v{training.version}</span><h1>{training.title}</h1><p>Create → edit → preview → submit-review akışının production UI temeli.</p></div>
      <span className="status-badge">{training.status}</span>
    </header>

    <nav className="authoring-steps" aria-label="Authoring adımları">
      <button type="button" className={step === 'edit' ? 'active' : ''} onClick={() => setStep('edit')}>1. Düzenle</button>
      <button type="button" className={step === 'preview' ? 'active' : ''} onClick={() => setStep('preview')}>2. Önizle</button>
      <button type="button" className={step === 'review' ? 'active' : ''} onClick={() => setStep('review')}>3. İncelemeye gönder</button>
    </nav>

    {versionMessage && <section className="content-card safety-card"><h2>Sürüm sınırı</h2><p>{versionMessage}</p></section>}

    {step === 'edit' && <div className="authoring-grid">
      <section className="content-card"><h2>Öğrenme hedefleri</h2><ul>{training.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></section>
      <section className="content-card"><h2>Modül & kaynaklar</h2>{training.modules.map((module) => <div className="module-row" key={module.id}><strong>{module.title}</strong><small>{module.evidence.length} evidence</small></div>)}</section>
      <section className="content-card"><h2>AI Content Intelligence</h2><p>{aiPolicy.pendingReview} AI çıktısı insan incelemesi bekliyor.</p><p><strong>Otomatik yayın:</strong> kapalı</p></section>
      <section className="content-card"><h2>Kaydetme durumu</h2><p aria-live="polite">{saveState}</p><div className="button-row"><button type="button" onClick={() => simulateSave('saved')}>Başarılı kaydet</button><button type="button" onClick={() => simulateSave('failed')}>Hata simüle et</button></div>{saveState === 'failed' && <p className="error-copy">Kaydetme başarısız. Başarı bildirimi gösterilmedi.</p>}</section>
    </div>}

    {step === 'preview' && <section className="content-card"><h2>Eğitim önizleme</h2><p>Önizleme yalnız mevcut taslağın okunabilir projection’ını gösterir.</p><ol>{training.modules.map((module) => <li key={module.id}>{module.title}</li>)}</ol></section>}

    {step === 'review' && <div className="authoring-grid">
      <section className="content-card"><h2>Evidence lineage</h2>{evidence.map((item) => <div className="evidence-row" key={item.id}><strong>{item.sourceTitle}</strong><span>{item.locator}</span></div>)}</section>
      <section className="content-card"><h2>Review handoff</h2><p>AI çıktıları proposal olarak kalır; reviewer kararı olmadan publish edilemez.</p><button type="button" className="primary-button" disabled={!canSubmitForReview(training, saveState)}>İncelemeye gönder</button>{!canSubmitForReview(training, saveState) && <p className="error-copy">Kaydetme veya doğrulama problemi çözülmeden handoff yapılamaz.</p>}</section>
    </div>}
  </div>;
}
