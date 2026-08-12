export const authoringStatuses = ['DRAFT','REVIEW_REQUIRED','READY_FOR_REVIEW','REJECTED'] as const;
export type AuthoringStatus = (typeof authoringStatuses)[number];

export interface EvidenceRef { tenantId: string; sourceAssetId: string; evidenceSegmentId: string; qualityState: 'PASS'|'PASS_WITH_WARNINGS'; }
export interface AuthoringCandidate { id: string; tenantId: string; trainingId: string; kind: 'OBJECTIVE'|'MODULE'|'CONTENT'; text: string; evidenceRefs: readonly EvidenceRef[]; }
export interface AuthoringRun { id: string; tenantId: string; trainingId: string; schemaVersion: string; promptId: string; promptVersion: string; modelId: string; inputSnapshotHash: string; status: AuthoringStatus; candidates: readonly AuthoringCandidate[]; }

export class AuthoringError extends Error {
  constructor(public readonly code: 'TENANT_BOUNDARY_VIOLATION'|'INSUFFICIENT_EVIDENCE'|'INVALID_EVIDENCE_QUALITY'|'NOT_READY_FOR_REVIEW') { super(code); }
}

export function validateCandidate(candidate: AuthoringCandidate): void {
  if (!candidate.text.trim()) throw new AuthoringError('INSUFFICIENT_EVIDENCE');
  if (candidate.evidenceRefs.length === 0) throw new AuthoringError('INSUFFICIENT_EVIDENCE');
  for (const evidence of candidate.evidenceRefs) {
    if (evidence.tenantId !== candidate.tenantId) throw new AuthoringError('TENANT_BOUNDARY_VIOLATION');
    if (evidence.qualityState !== 'PASS' && evidence.qualityState !== 'PASS_WITH_WARNINGS') throw new AuthoringError('INVALID_EVIDENCE_QUALITY');
  }
}

export function evaluateAuthoringReadiness(run: AuthoringRun): AuthoringStatus {
  if (!run.schemaVersion || !run.promptId || !run.promptVersion || !run.modelId || !run.inputSnapshotHash) return 'REVIEW_REQUIRED';
  if (run.candidates.length === 0) return 'REVIEW_REQUIRED';
  try {
    for (const candidate of run.candidates) {
      if (candidate.tenantId !== run.tenantId || candidate.trainingId !== run.trainingId) throw new AuthoringError('TENANT_BOUNDARY_VIOLATION');
      validateCandidate(candidate);
    }
  } catch (error) {
    if (error instanceof AuthoringError && error.code === 'TENANT_BOUNDARY_VIOLATION') throw error;
    return 'REVIEW_REQUIRED';
  }
  return 'READY_FOR_REVIEW';
}

export function assertHumanPublishBoundary(run: AuthoringRun): void {
  if (evaluateAuthoringReadiness(run) !== 'READY_FOR_REVIEW') throw new AuthoringError('NOT_READY_FOR_REVIEW');
  // This function intentionally stops at review handoff. Training publish remains a domain/application-service action.
}
