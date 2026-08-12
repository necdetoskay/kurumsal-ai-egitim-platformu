import { describe, expect, it } from 'vitest';
import { applySaveResult, authoringPolicy, canSubmitForReview, nextEditableVersion, submitForReview, type TrainingDraft } from './authoring';

const readyDraft: TrainingDraft = {
  id: 'training-1',
  title: 'Bilgi Güvenliği',
  version: 3,
  stage: 'editing',
  learningObjectives: ['Phishing belirtilerini ayırt eder'],
  modules: ['Phishing temelleri'],
  evidence: [{ sourceId: 'source-1', evidenceId: 'evidence-1', label: 'Kurumsal güvenlik politikası' }],
  aiGenerated: true,
  saveState: 'saved',
};

describe('instructor authoring workflow', () => {
  it('allows a complete saved draft to enter review', () => {
    expect(canSubmitForReview(readyDraft)).toBe(true);
    expect(submitForReview(readyDraft).stage).toBe('in-review');
  });

  it('blocks review when evidence lineage is missing', () => {
    expect(canSubmitForReview({ ...readyDraft, evidence: [] })).toBe(false);
  });

  it('never lets AI self-publish', () => {
    expect(authoringPolicy(readyDraft).aiCanSelfPublish).toBe(false);
  });

  it('requires a new version when editing published content', () => {
    const published = { ...readyDraft, stage: 'published' as const, publishedVersion: 3 };
    expect(authoringPolicy(published).requiresNewVersionForPublishedEdit).toBe(true);
    expect(nextEditableVersion(published)).toBe(4);
  });

  it('does not show success after a failed save', () => {
    const failed = applySaveResult(readyDraft, false);
    expect(failed.saveState).toBe('failed');
    expect(canSubmitForReview(failed)).toBe(false);
  });
});
