import { describe, expect, it } from 'vitest';
import { aiCandidatePolicy, canSubmitForReview, demoTraining, publishedEditMessage, visibleEvidence, type TrainingDraft } from './authoring-ui';

describe('instructor authoring UI contracts', () => {
  it('requires a clean saved draft before review handoff', () => {
    expect(canSubmitForReview(demoTraining, 'idle')).toBe(true);
    expect(canSubmitForReview(demoTraining, 'failed')).toBe(false);
    expect(canSubmitForReview(demoTraining, 'saving')).toBe(false);
  });

  it('keeps AI candidates reviewable and unable to self-publish', () => {
    expect(aiCandidatePolicy(demoTraining)).toEqual({ selfPublishAllowed: false, pendingReview: 1 });
  });

  it('surfaces source/evidence lineage', () => {
    expect(visibleEvidence(demoTraining).map((item) => item.locator)).toEqual(['§4.2', '§2.1']);
  });

  it('communicates versioning when editing a published training', () => {
    const published: TrainingDraft = { ...demoTraining, status: 'published', version: 3 };
    expect(publishedEditMessage(published)).toContain('v3');
    expect(canSubmitForReview(published, 'idle')).toBe(false);
  });
});
