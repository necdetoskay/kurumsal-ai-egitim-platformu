import { describe, expect, it } from 'vitest';
import { canPublishAssessment, learnerQuestionProjection, type AssessmentDraft, type QuestionRow } from './assessment-ui';

const approved: QuestionRow = { id: 'qv-1', stem: 'Approved?', state: 'approved', evidenceRefs: ['evidence:1'], answerKey: 'A' };
const proposal: QuestionRow = { id: 'qv-2', stem: 'Proposal?', state: 'ai-proposal', evidenceRefs: ['evidence:2'], answerKey: 'B' };

function assessment(questionVersionIds: string[]): AssessmentDraft {
  return { id: 'a-1', title: 'Assessment', publishState: 'ready', questionVersionIds };
}

describe('question and assessment UI invariants', () => {
  it('never exposes answer keys in learner projection', () => {
    const projection = learnerQuestionProjection(approved);
    expect(projection).toEqual({ id: 'qv-1', stem: 'Approved?', state: 'approved' });
    expect('answerKey' in projection).toBe(false);
  });

  it('blocks publish when an AI proposal has not been approved', () => {
    expect(canPublishAssessment(assessment(['qv-1', 'qv-2']), [approved, proposal])).toBe(false);
  });

  it('allows publish only when every snapshotted question version is approved', () => {
    expect(canPublishAssessment(assessment(['qv-1']), [approved, proposal])).toBe(true);
  });

  it('blocks empty and already-published assessments', () => {
    expect(canPublishAssessment(assessment([]), [approved])).toBe(false);
    expect(canPublishAssessment({ ...assessment(['qv-1']), publishState: 'published' }, [approved])).toBe(false);
  });
});
