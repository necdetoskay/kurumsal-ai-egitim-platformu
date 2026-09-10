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

export const assignmentOriginTypes = ['DIRECT', 'AUDIENCE_RESOLUTION'] as const;
export type AssignmentOriginType = (typeof assignmentOriginTypes)[number];

/**
 * Learning-owned immutable provenance explaining why an assignment is part of
 * the learner's history. One assignment may have multiple origin links: for
 * example an already-active direct assignment can later also be reached by a
 * confirmed group audience without creating a duplicate TrainingAssignment.
 */
export interface TrainingAssignmentOrigin {
  id: string;
  tenantId: string;
  assignmentId: string;
  originType: AssignmentOriginType;
  originKey: string;
  sourceRefId?: string;
  sourceFingerprint?: string;
  createdAt: Date;
}

export interface CreateAssignmentOriginInput {
  id: string;
  tenantId: string;
  assignmentId: string;
  originType: AssignmentOriginType;
  sourceRefId?: string;
  sourceFingerprint?: string;
  createdAt: Date;
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

export function assignmentOriginKey(input: {
  originType: AssignmentOriginType;
  sourceRefId?: string;
}): string {
  if (input.originType === 'DIRECT') {
    if (input.sourceRefId !== undefined) throw new LearningDomainError('VALIDATION_FAILED');
    return 'DIRECT';
  }
  if (!input.sourceRefId?.trim()) throw new LearningDomainError('VALIDATION_FAILED');
  return `AUDIENCE_RESOLUTION:${input.sourceRefId}`;
}

export function createAssignmentOrigin(input: CreateAssignmentOriginInput): TrainingAssignmentOrigin {
  if (!input.id.trim() || !input.tenantId.trim() || !input.assignmentId.trim()) {
    throw new LearningDomainError('VALIDATION_FAILED');
  }
  if (input.originType === 'DIRECT') {
    if (input.sourceRefId !== undefined || input.sourceFingerprint !== undefined) {
      throw new LearningDomainError('VALIDATION_FAILED');
    }
  } else if (!input.sourceRefId?.trim() || !input.sourceFingerprint?.trim()) {
    throw new LearningDomainError('VALIDATION_FAILED');
  }

  return Object.freeze({
    ...input,
    originKey: assignmentOriginKey(input),
  });
}

export function resolveAssignmentOrigin(
  existing: readonly TrainingAssignmentOrigin[],
  candidate: TrainingAssignmentOrigin,
): TrainingAssignmentOrigin {
  const prior = existing.find((item) =>
    item.tenantId === candidate.tenantId &&
    item.assignmentId === candidate.assignmentId &&
    item.originKey === candidate.originKey,
  );
  if (!prior) return candidate;
  if (
    prior.originType !== candidate.originType ||
    prior.sourceRefId !== candidate.sourceRefId ||
    prior.sourceFingerprint !== candidate.sourceFingerprint
  ) {
    throw new LearningDomainError('CONFLICT');
  }
  return prior;
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
