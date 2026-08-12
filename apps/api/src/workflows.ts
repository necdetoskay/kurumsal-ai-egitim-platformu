import {
  finalizeAttempt,
  learnerAssessmentProjection,
  scoreAttempt,
  submitAttempt,
  type Assessment,
  type Attempt,
} from '@kaep/assessment';
import {
  certificateEligibilityKey,
  evaluateCompletion,
  issueCertificate,
  transitionAssignment,
  type Certificate,
  type CompletionPolicy,
  type CompletionState,
  type LearningEvidence,
  type TrainingAssignment,
} from '@kaep/learning';

export class ApiWorkflowError extends Error {
  constructor(public readonly code:
    | 'TENANT_BOUNDARY_VIOLATION'
    | 'ASSESSMENT_NOT_PUBLISHED'
    | 'ATTEMPT_ASSESSMENT_MISMATCH'
    | 'LEARNER_ASSIGNMENT_MISMATCH'
    | 'ASSESSMENT_RESULT_INCOMPLETE') {
    super(code);
  }
}

export interface CompleteAssessmentLearningInput {
  assessment: Assessment;
  attempt: Attempt;
  assignment: TrainingAssignment;
  completionState: CompletionState;
  existingEvidence: readonly LearningEvidence[];
  existingCertificates: readonly Certificate[];
  policy: CompletionPolicy;
  now: Date;
  assessmentEvidenceId: string;
  completionEvidenceId: string;
  certificateId: string;
}

export interface CompleteAssessmentLearningResult {
  attempt: Attempt;
  assignment: TrainingAssignment;
  completionState: CompletionState;
  evidence: readonly LearningEvidence[];
  certificate: Certificate | null;
  learnerAssessment: ReturnType<typeof learnerAssessmentProjection>;
}

function assertWorkflowBoundaries(input: CompleteAssessmentLearningInput): void {
  const tenantId = input.assessment.tenantId;
  if (input.attempt.tenantId !== tenantId || input.assignment.tenantId !== tenantId) {
    throw new ApiWorkflowError('TENANT_BOUNDARY_VIOLATION');
  }
  if (input.assessment.status !== 'PUBLISHED') {
    throw new ApiWorkflowError('ASSESSMENT_NOT_PUBLISHED');
  }
  if (input.attempt.assessmentId !== input.assessment.id) {
    throw new ApiWorkflowError('ATTEMPT_ASSESSMENT_MISMATCH');
  }
  if (input.attempt.learnerUserId !== input.assignment.learnerId) {
    throw new ApiWorkflowError('LEARNER_ASSIGNMENT_MISMATCH');
  }
  for (const item of input.existingEvidence) {
    if (item.tenantId !== tenantId || item.assignmentId !== input.assignment.id) {
      throw new ApiWorkflowError('TENANT_BOUNDARY_VIOLATION');
    }
  }
  for (const certificate of input.existingCertificates) {
    if (certificate.tenantId !== tenantId) {
      throw new ApiWorkflowError('TENANT_BOUNDARY_VIOLATION');
    }
  }
}

function finalizeAttemptIdempotently(attempt: Attempt, assessment: Assessment): Attempt {
  let next = attempt;
  if (next.status === 'IN_PROGRESS') next = submitAttempt(next);
  if (next.status === 'SUBMITTED') next = scoreAttempt(next, assessment);
  if (next.status === 'SCORED') next = finalizeAttempt(next);
  if (next.status !== 'COMPLETED' || next.scorePercent === undefined || next.passed === undefined) {
    throw new ApiWorkflowError('ASSESSMENT_RESULT_INCOMPLETE');
  }
  return next;
}

function appendEvidenceOnce(
  evidence: readonly LearningEvidence[],
  candidate: LearningEvidence,
): readonly LearningEvidence[] {
  const existing = evidence.find((item) =>
    item.tenantId === candidate.tenantId &&
    item.assignmentId === candidate.assignmentId &&
    item.type === candidate.type &&
    item.sourceId === candidate.sourceId,
  );
  return existing ? evidence : [...evidence, Object.freeze(candidate)];
}

export function completeAssessmentLearningFlow(
  input: CompleteAssessmentLearningInput,
): CompleteAssessmentLearningResult {
  assertWorkflowBoundaries(input);

  const attempt = finalizeAttemptIdempotently(input.attempt, input.assessment);
  const assessmentEvidence: LearningEvidence = {
    id: input.assessmentEvidenceId,
    tenantId: input.assignment.tenantId,
    assignmentId: input.assignment.id,
    learnerId: input.assignment.learnerId,
    trainingId: input.assignment.trainingId,
    trainingVersionId: input.assignment.trainingVersionId,
    type: 'ASSESSMENT_RESULT',
    sourceId: attempt.id,
    occurredAt: input.now,
    payload: Object.freeze({
      assessmentId: input.assessment.id,
      attemptId: attempt.id,
      passed: attempt.passed,
      normalizedScore: attempt.scorePercent,
    }),
  };

  let evidence = appendEvidenceOnce(input.existingEvidence, assessmentEvidence);
  const completionState = evaluateCompletion({
    assignment: input.assignment,
    evidence,
    policy: input.policy,
    current: input.completionState,
    completedAt: input.now,
  });

  let assignment = input.assignment;
  let certificate: Certificate | null = null;

  if (completionState.completed) {
    if (assignment.status === 'ACTIVE') {
      assignment = transitionAssignment(assignment, 'COMPLETED', input.now);
    }

    const completionEvidence: LearningEvidence = {
      id: input.completionEvidenceId,
      tenantId: assignment.tenantId,
      assignmentId: assignment.id,
      learnerId: assignment.learnerId,
      trainingId: assignment.trainingId,
      trainingVersionId: assignment.trainingVersionId,
      type: 'TRAINING_COMPLETED',
      sourceId: assignment.id,
      occurredAt: input.now,
      payload: Object.freeze({ evidenceIds: completionState.evidenceIds }),
    };
    evidence = appendEvidenceOnce(evidence, completionEvidence);

    const completionRecord = evidence.find((item) =>
      item.type === 'TRAINING_COMPLETED' && item.sourceId === assignment.id,
    );
    const assessmentRecord = evidence.find((item) =>
      item.type === 'ASSESSMENT_RESULT' && item.sourceId === attempt.id,
    );

    if (completionRecord && assessmentRecord) {
      const eligibilityEvidenceKey = certificateEligibilityKey({
        tenantId: assignment.tenantId,
        learnerId: assignment.learnerId,
        trainingVersionId: assignment.trainingVersionId,
        completionEvidenceId: completionRecord.id,
        assessmentEvidenceId: assessmentRecord.id,
      });
      certificate = issueCertificate({
        existing: input.existingCertificates,
        certificate: {
          id: input.certificateId,
          tenantId: assignment.tenantId,
          learnerId: assignment.learnerId,
          trainingId: assignment.trainingId,
          trainingVersionId: assignment.trainingVersionId,
          eligibilityEvidenceKey,
          status: 'ISSUED',
          issuedAt: input.now,
        },
      });
    }
  }

  return {
    attempt,
    assignment,
    completionState,
    evidence: Object.freeze([...evidence]),
    certificate,
    learnerAssessment: learnerAssessmentProjection(input.assessment),
  };
}
