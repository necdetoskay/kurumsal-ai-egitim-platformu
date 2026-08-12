import React from 'react';

export type QuestionReviewState = 'draft' | 'ai-proposal' | 'approved' | 'rejected';
export type AssessmentPublishState = 'draft' | 'ready' | 'published';

export type QuestionRow = {
  id: string;
  stem: string;
  state: QuestionReviewState;
  evidenceRefs: string[];
  answerKey: string;
};

export type AssessmentDraft = {
  id: string;
  title: string;
  publishState: AssessmentPublishState;
  questionVersionIds: string[];
  snapshotHash?: string;
};

export function learnerQuestionProjection(question: QuestionRow) {
  return {
    id: question.id,
    stem: question.stem,
    state: question.state,
  };
}

export function canPublishAssessment(assessment: AssessmentDraft, questions: QuestionRow[]): boolean {
  if (assessment.publishState === 'published') return false;
  if (assessment.questionVersionIds.length === 0) return false;
  return assessment.questionVersionIds.every((id) => questions.some((q) => q.id === id && q.state === 'approved'));
}

export function QuestionAssessmentWorkspace() {
  const questions: QuestionRow[] = [
    { id: 'qv-101', stem: 'Bilgi güvenliği olayında ilk aksiyon hangisidir?', state: 'approved', evidenceRefs: ['evidence:seg-44'], answerKey: 'B' },
    { id: 'qv-102', stem: 'MFA hangi riski azaltır?', state: 'ai-proposal', evidenceRefs: ['evidence:seg-52'], answerKey: 'C' },
  ];
  const assessment: AssessmentDraft = { id: 'asmt-9', title: 'Bilgi Güvenliği Final', publishState: 'ready', questionVersionIds: ['qv-101'] };

  return <>
    <header className="page-header">
      <div>
        <span className="eyebrow">Sprint 16 · Question Bank & Assessment</span>
        <h1>Soru Bankası ve Değerlendirmeler</h1>
        <p>Soru yaşam döngüsü, AI önerileri, evidence lineage ve immutable assessment snapshot sınırı.</p>
      </div>
      <span className="status-badge">Answer key learner'a kapalı</span>
    </header>

    <section className="assessment-grid">
      <article className="content-card">
        <h2>Question Bank</h2>
        <div className="question-list">
          {questions.map((question) => <div className="question-row" key={question.id}>
            <div><strong>{question.stem}</strong><p>{question.id} · {question.state}</p></div>
            <div className="lineage-box"><span>Grounding</span>{question.evidenceRefs.map((ref) => <code key={ref}>{ref}</code>)}</div>
          </div>)}
        </div>
      </article>

      <article className="content-card ai-proposal-card">
        <h2>AI Question Generation</h2>
        <p>AI çıktıları yalnız <strong>proposal</strong> olarak oluşturulur. Reviewer onayı olmadan soru bankasına approved olarak geçemez ve assessment publish sürecine dahil edilemez.</p>
        <div className="chip-row"><span className="state-chip">schema gate</span><span className="state-chip">evidence gate</span><span className="state-chip">duplicate gate</span><span className="state-chip">human review</span></div>
      </article>
    </section>

    <section className="content-card snapshot-card">
      <div className="snapshot-header"><div><h2>{assessment.title}</h2><p>{assessment.id} · {assessment.publishState}</p></div><span className="status-badge">Immutable snapshot boundary</span></div>
      <p>Publish anında assessment, seçili <strong>QuestionVersion</strong> kimliklerini snapshot olarak kilitler. Sonraki soru düzenlemeleri yayınlanmış assessment içeriğini değiştirmez.</p>
      <div className="snapshot-list">{assessment.questionVersionIds.map((id) => <code key={id}>{id}</code>)}</div>
      <button type="button" className="primary-button" disabled={!canPublishAssessment(assessment, questions)}>Snapshot oluştur ve yayınla</button>
    </section>

    <section className="content-card safety-card">
      <h2>Learner projection güvenlik sınırı</h2>
      <p>Answer key, scoring secret ve reviewer-only grounding detayları learner-facing payload'a dahil edilmez.</p>
    </section>
  </>;
}
