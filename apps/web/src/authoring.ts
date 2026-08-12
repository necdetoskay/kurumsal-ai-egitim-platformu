export type AuthoringStage = 'draft' | 'editing' | 'preview' | 'in-review' | 'changes-requested' | 'published';

export type EvidenceRef = {
  sourceId: string;
  evidenceId: string;
  label: string;
};

export type TrainingDraft = {
  id: string;
  title: string;
  version: number;
  stage: AuthoringStage;
  publishedVersion?: number;
  learningObjectives: readonly string[];
  modules: readonly string[];
  evidence: readonly EvidenceRef[];
  aiGenerated: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'failed';
};

export function canEditDraft(draft: TrainingDraft): boolean {
  return draft.stage === 'draft' || draft.stage === 'editing' || draft.stage === 'changes-requested';
}

export function canSubmitForReview(draft: TrainingDraft): boolean {
  return canEditDraft(draft) && draft.title.trim().length > 0 && draft.learningObjectives.length > 0 && draft.modules.length > 0 && draft.evidence.length > 0 && draft.saveState !== 'failed';
}

export function nextEditableVersion(draft: TrainingDraft): number {
  return draft.stage === 'published' ? Math.max(draft.version, draft.publishedVersion ?? draft.version) + 1 : draft.version;
}

export function submitForReview(draft: TrainingDraft): TrainingDraft {
  if (!canSubmitForReview(draft)) throw new Error('AUTHORING_NOT_READY_FOR_REVIEW');
  return { ...draft, stage: 'in-review', saveState: 'saved' };
}

export function applySaveResult(draft: TrainingDraft, ok: boolean): TrainingDraft {
  return { ...draft, saveState: ok ? 'saved' : 'failed' };
}

export function authoringPolicy(draft: TrainingDraft): {
  aiCanSelfPublish: false;
  evidenceVisible: boolean;
  requiresNewVersionForPublishedEdit: boolean;
} {
  return {
    aiCanSelfPublish: false,
    evidenceVisible: draft.evidence.length > 0,
    requiresNewVersionForPublishedEdit: draft.stage === 'published',
  };
}
