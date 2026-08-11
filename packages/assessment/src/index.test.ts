import { describe, expect, it } from 'vitest';
import { beginAttempt, learnerAssessmentProjection, publishAssessment, saveAnswer, scoreAttempt, submitAttempt, transitionQuestion, type Assessment, type Attempt, type Question } from './index.js';

const question: Question = { id: 'q1', tenantId: 't1', status: 'DRAFT', versions: [] };
const snapshot = { questionId: 'q1', questionVersionId: 'qv1', prompt: '2+2?', options: ['3','4'], correctOptionIndex: 1, points: 10 } as const;
const draftAssessment: Assessment = { id: 'a1', tenantId: 't1', status: 'DRAFT', snapshots: [], passPercent: 60 };

function newAttempt(): Attempt {
  return { id: 'at1', tenantId: 't1', learnerUserId: 'u1', assessmentId: 'a1', status: 'CREATED', answers: [] };
}

describe('question lifecycle', () => {
  it('rejects invalid direct approval', () => {
    expect(() => transitionQuestion(question, 'APPROVED')).toThrow('INVALID_QUESTION_TRANSITION');
  });
});

describe('assessment integrity hard gates', () => {
  it('publishes an immutable question snapshot', () => {
    const published = publishAssessment(draftAssessment, [snapshot]);
    expect(published.status).toBe('PUBLISHED');
    expect(Object.isFrozen(published.snapshots[0])).toBe(true);
  });

  it('never exposes answer keys through learner projection', () => {
    const published = publishAssessment(draftAssessment, [snapshot]);
    const projection = learnerAssessmentProjection(published);
    expect('correctOptionIndex' in projection.questions[0]!).toBe(false);
  });
});

describe('attempt integrity hard gates', () => {
  it('prevents another learner changing answers and prevents post-submit mutation', () => {
    const started = beginAttempt(newAttempt());
    expect(() => saveAnswer(started, 'u2', { questionVersionId: 'qv1', selectedOptionIndex: 1 })).toThrow('ATTEMPT_OWNER_MISMATCH');
    const answered = saveAnswer(started, 'u1', { questionVersionId: 'qv1', selectedOptionIndex: 1 });
    const submitted = submitAttempt(answered);
    expect(() => saveAnswer(submitted, 'u1', { questionVersionId: 'qv1', selectedOptionIndex: 0 })).toThrow('ATTEMPT_NOT_MUTABLE');
  });

  it('makes submit idempotent', () => {
    const submitted = submitAttempt(beginAttempt(newAttempt()));
    expect(submitAttempt(submitted)).toBe(submitted);
  });

  it('scores deterministically from immutable snapshots', () => {
    const assessment = publishAssessment(draftAssessment, [snapshot]);
    const answered = saveAnswer(beginAttempt(newAttempt()), 'u1', { questionVersionId: 'qv1', selectedOptionIndex: 1 });
    const submitted = submitAttempt(answered);
    expect(scoreAttempt(submitted, assessment)).toEqual(scoreAttempt(submitted, assessment));
    expect(scoreAttempt(submitted, assessment).scorePercent).toBe(100);
  });
});
