export const assignmentStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'] as const;
export type AssignmentStatus = (typeof assignmentStatuses)[number];

export interface TrainingAssignment {
  id: string;
  tenantId: string;
  learnerId: string;
  trainingId: string;
  trainingVersionId: string;
  status: AssignmentStatus;
  assignedAt: Date;
  completedAt?: Date;
}

export type LearningEvidenceType = 'MODULE_COMPLETED' | 'ASSESSMENT_RESULT' | 'TRAINING_COMPLETED';

export interface LearningEvidence {
  id: string;
  tenantId: string;
  assignmentId: string;
  learnerId: string;
  trainingId: string;
  trainingVersionId: string;
  type: LearningEvidenceType;
  sourceId: string;
  occurredAt: Date;
  payload?: Readonly<Record<string, unknown>>;
}

export interface AssessmentResultEvidence {
  assessmentId: string;
  attemptId: string;
  passed: boolean;
  normalizedScore: number;
}

export interface CompletionPolicy {
  requiredModuleIds: readonly string[];
  assessmentRequired: boolean;
}

export interface CompletionState {
  assignmentId: string;
  completed: boolean;
  completedAt?: Date;
  evidenceIds: readonly string[];
}

export type CertificateStatus = 'ISSUED' | 'REVOKED';

export interface Certificate {
  id: string;
  tenantId: string;
  learnerId: string;
  trainingId: string;
  trainingVersionId: string;
  eligibilityEvidenceKey: string;
  status: CertificateStatus;
  issuedAt: Date;
  revokedAt?: Date;
  revokeReason?: string;
}

export class LearningDomainError extends Error {
  constructor(public readonly code: 'VALIDATION_FAILED' | 'CONFLICT' | 'TENANT_BOUNDARY_VIOLATION' | 'INVALID_STATE_TRANSITION') {
    super(code);
  }
}

export function resolveAssignment(
  existing: readonly TrainingAssignment[],
  candidate: TrainingAssignment,
): TrainingAssignment {
  const duplicate = existing.find((item) =>
    item.tenantId === candidate.tenantId &&
    item.learnerId === candidate.learnerId &&
    item.trainingId === candidate.trainingId &&
    item.trainingVersionId === candidate.trainingVersionId &&
    item.status === 'ACTIVE',
  );
  return duplicate ?? candidate;
}

export function transitionAssignment(
  assignment: TrainingAssignment,
  target: Exclude<AssignmentStatus, 'ACTIVE'>,
  at: Date,
): TrainingAssignment {
  if (assignment.status !== 'ACTIVE') throw new LearningDomainError('INVALID_STATE_TRANSITION');
  if (target === 'COMPLETED') return { ...assignment, status: target, completedAt: at };
  return { ...assignment, status: target };
}

export function validateEvidenceForAssignment(evidence: LearningEvidence, assignment: TrainingAssignment): void {
  if (
    evidence.tenantId !== assignment.tenantId ||
    evidence.assignmentId !== assignment.id ||
    evidence.learnerId !== assignment.learnerId ||
    evidence.trainingId !== assignment.trainingId ||
    evidence.trainingVersionId !== assignment.trainingVersionId
  ) {
    throw new LearningDomainError('TENANT_BOUNDARY_VIOLATION');
  }
}

export function evaluateCompletion(input: {
  assignment: TrainingAssignment;
  evidence: readonly LearningEvidence[];
  policy: CompletionPolicy;
  current: CompletionState;
  completedAt: Date;
}): CompletionState {
  if (input.current.completed) return input.current;
  if (input.assignment.status !== 'ACTIVE') throw new LearningDomainError('INVALID_STATE_TRANSITION');
  input.evidence.forEach((item) => validateEvidenceForAssignment(item, input.assignment));

  const moduleIds = new Set(
    input.evidence
      .filter((item) => item.type === 'MODULE_COMPLETED')
      .map((item) => item.sourceId),
  );
  const modulesComplete = input.policy.requiredModuleIds.every((id) => moduleIds.has(id));
  const assessmentSatisfied = !input.policy.assessmentRequired || input.evidence.some((item) => {
    if (item.type !== 'ASSESSMENT_RESULT') return false;
    const payload = item.payload as AssessmentResultEvidence | undefined;
    return payload?.passed === true;
  });

  if (!modulesComplete || !assessmentSatisfied) return input.current;

  return Object.freeze({
    assignmentId: input.assignment.id,
    completed: true,
    completedAt: input.completedAt,
    evidenceIds: Object.freeze(input.evidence.map((item) => item.id)),
  });
}

export function certificateEligibilityKey(input: {
  tenantId: string;
  learnerId: string;
  trainingVersionId: string;
  completionEvidenceId: string;
  assessmentEvidenceId?: string;
}): string {
  return [
    input.tenantId,
    input.learnerId,
    input.trainingVersionId,
    input.completionEvidenceId,
    input.assessmentEvidenceId ?? 'no-assessment',
  ].join(':');
}

export function issueCertificate(input: {
  existing: readonly Certificate[];
  certificate: Certificate;
}): Certificate {
  const duplicate = input.existing.find((item) =>
    item.tenantId === input.certificate.tenantId &&
    item.eligibilityEvidenceKey === input.certificate.eligibilityEvidenceKey,
  );
  return duplicate ?? Object.freeze({ ...input.certificate });
}

export function revokeCertificate(certificate: Certificate, at: Date, reason: string): Certificate {
  if (certificate.status !== 'ISSUED') throw new LearningDomainError('INVALID_STATE_TRANSITION');
  if (!reason.trim()) throw new LearningDomainError('VALIDATION_FAILED');
  return Object.freeze({ ...certificate, status: 'REVOKED', revokedAt: at, revokeReason: reason });
}
