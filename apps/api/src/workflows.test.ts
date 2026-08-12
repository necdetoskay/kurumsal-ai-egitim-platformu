import { describe, expect, it } from 'vitest';
import { completeAssessmentLearningFlow, ApiWorkflowError } from './workflows.js';
import type { Assessment, Attempt } from '@kaep/assessment';
import type { CompletionState, TrainingAssignment } from '@kaep/learning';

const now = new Date('2026-08-12T04:00:00.000Z');

const assessment: Assessment = Object.freeze({
  id: 'assessment-1',
  tenantId: 'tenant-1',
  status: 'PUBLISHED',
  passPercent: 70,
  snapshots: Object.freeze([
    Object.freeze({
      questionId: 'question-1',
      questionVersionId: 'qv-1',
      prompt: '2 + 2?',
      options: Object.freeze(['3', '4', '5']),
      correctOptionIndex: 1,
      points: 10,
    }),
  ]),
});

const attempt: Attempt = {
  id: 'attempt-1',
  tenantId: 'tenant-1',
  learnerUserId: 'learner-1',
  assessmentId: 'assessment-1',
  status: 'IN_PROGRESS',
  answers: [{ questionVersionId: 'qv-1', selectedOptionIndex: 1 }],
};

const assignment: TrainingAssignment = {
  id: 'assignment-1',
  tenantId: 'tenant-1',
  learnerId: 'learner-1',
  trainingId: 'training-1',
  trainingVersionId: 'training-v1',
  status: 'ACTIVE',
  assignedAt: new Date('2026-08-10T00:00:00.000Z'),
};

const completionState: CompletionState = {
  assignmentId: 'assignment-1',
  completed: false,
  evidenceIds: [],
};

function run(overrides: Partial<Parameters<typeof completeAssessmentLearningFlow>[0]> = {}) {
  return completeAssessmentLearningFlow({
    assessment,
    attempt,
    assignment,
    completionState,
    existingEvidence: [{
      id: 'module-evidence-1',
      tenantId: 'tenant-1',
      assignmentId: 'assignment-1',
      learnerId: 'learner-1',
      trainingId: 'training-1',
      trainingVersionId: 'training-v1',
      type: 'MODULE_COMPLETED',
      sourceId: 'module-1',
      occurredAt: now,
    }],
    existingCertificates: [],
    policy: { requiredModuleIds: ['module-1'], assessmentRequired: true },
    now,
    assessmentEvidenceId: 'assessment-evidence-1',
    completionEvidenceId: 'completion-evidence-1',
    certificateId: 'certificate-1',
    ...overrides,
  });
}

describe('backend assessment -> learning flow', () => {
  it('scores, completes and issues a certificate end-to-end', () => {
    const result = run();

    expect(result.attempt.status).toBe('COMPLETED');
    expect(result.attempt.scorePercent).toBe(100);
    expect(result.attempt.passed).toBe(true);
    expect(result.assignment.status).toBe('COMPLETED');
    expect(result.completionState.completed).toBe(true);
    expect(result.evidence.filter((item) => item.type === 'ASSESSMENT_RESULT')).toHaveLength(1);
    expect(result.evidence.filter((item) => item.type === 'TRAINING_COMPLETED')).toHaveLength(1);
    expect(result.certificate?.status).toBe('ISSUED');
  });

  it('is replay-safe for submit/score/evidence/certificate side effects', () => {
    const first = run();
    const second = run({
      attempt: first.attempt,
      assignment: first.assignment,
      completionState: first.completionState,
      existingEvidence: first.evidence,
      existingCertificates: first.certificate ? [first.certificate] : [],
      assessmentEvidenceId: 'assessment-evidence-2',
      completionEvidenceId: 'completion-evidence-2',
      certificateId: 'certificate-2',
    });

    expect(second.attempt.scorePercent).toBe(first.attempt.scorePercent);
    expect(second.evidence.filter((item) => item.type === 'ASSESSMENT_RESULT')).toHaveLength(1);
    expect(second.evidence.filter((item) => item.type === 'TRAINING_COMPLETED')).toHaveLength(1);
    expect(second.certificate?.id).toBe(first.certificate?.id);
    expect(second.assignment.completedAt).toEqual(first.assignment.completedAt);
  });

  it('fails closed across tenant boundaries', () => {
    expect(() => run({
      attempt: { ...attempt, tenantId: 'tenant-2' },
    })).toThrowError(new ApiWorkflowError('TENANT_BOUNDARY_VIOLATION'));
  });

  it('never exposes the answer key in learner projection', () => {
    const result = run();
    const question = result.learnerAssessment.questions[0] as Record<string, unknown>;

    expect(question).not.toHaveProperty('correctOptionIndex');
    expect(question).toHaveProperty('prompt', '2 + 2?');
  });
});
