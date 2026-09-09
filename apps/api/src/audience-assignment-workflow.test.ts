import { describe, expect, it } from 'vitest';
import { createAssignmentOrigin, type TrainingAssignment } from '@kaep/learning';
import type { TrainingAudienceHandoffData } from '@kaep/organization-management-api';
import { bindConfirmedAudienceToAssignments, type AudienceAssignmentWorkflowInput } from './audience-assignment-workflow.js';

const fingerprint = 'a'.repeat(64);
const baseHandoff: TrainingAudienceHandoffData = {
  tenantId: 'tenant-1',
  organizationId: 'org-1',
  trainingId: 'training-1',
  trainingVersionId: 'version-1',
  resolutionId: 'resolution-1',
  resolutionFingerprint: fingerprint,
  assignmentCandidateLearnerIds: ['learner-2', 'learner-1', 'learner-1'],
  unlinkedEmployeeIds: ['employee-without-user'],
};

function input(overrides: Partial<AudienceAssignmentWorkflowInput> = {}): AudienceAssignmentWorkflowInput {
  return {
    tenantId: 'tenant-1',
    trainingId: 'training-1',
    trainingVersionId: 'version-1',
    assignedAt: new Date('2026-09-09T12:00:00Z'),
    idempotencyKey: 'idem-1',
    handoff: baseHandoff,
    learnerScopes: [
      { learnerId: 'learner-1', tenantId: 'tenant-1', active: true },
      { learnerId: 'learner-2', tenantId: 'tenant-1', active: true },
    ],
    existingAssignments: [],
    existingOrigins: [],
    existingIdempotencyRecords: [],
    assignmentIdForLearner: (learnerId) => `assignment-${learnerId}`,
    originIdForAssignment: (assignmentId, resolutionId) => `origin-${assignmentId}-${resolutionId}`,
    ...overrides,
  };
}

describe('AEGIS MUR M1 audience -> Learning Assignment handoff', () => {
  it('creates one deterministic assignment per unique learner and preserves unlinked employees', () => {
    const state = bindConfirmedAudienceToAssignments(input());

    expect(state.result.createdCount).toBe(2);
    expect(state.result.reusedCount).toBe(0);
    expect(state.result.createdAssignmentIds).toEqual(['assignment-learner-1', 'assignment-learner-2']);
    expect(state.result.unlinkedEmployeeIds).toEqual(['employee-without-user']);
    expect(state.assignments.map((item) => item.learnerId)).toEqual(['learner-1', 'learner-2']);
    expect(state.origins).toHaveLength(2);
    expect(state.origins.every((item) => item.sourceRefId === 'resolution-1' && item.sourceFingerprint === fingerprint)).toBe(true);
  });

  it('replays the same handoff without duplicate assignments or origins', () => {
    const first = bindConfirmedAudienceToAssignments(input());
    const second = bindConfirmedAudienceToAssignments(input({
      existingAssignments: first.assignments,
      existingOrigins: first.origins,
      existingIdempotencyRecords: first.idempotencyRecords,
    }));

    expect(second.replayed).toBe(true);
    expect(second.result).toBe(first.result);
    expect(second.assignments).toHaveLength(2);
    expect(second.origins).toHaveLength(2);
  });

  it('reuses an existing direct assignment while adding the audience lineage reason', () => {
    const existing: TrainingAssignment = {
      id: 'existing-assignment',
      tenantId: 'tenant-1',
      learnerId: 'learner-1',
      trainingId: 'training-1',
      trainingVersionId: 'version-1',
      status: 'ACTIVE',
      assignedAt: new Date('2026-09-01T00:00:00Z'),
    };
    const directOrigin = createAssignmentOrigin({
      id: 'direct-origin', tenantId: 'tenant-1', assignmentId: existing.id, originType: 'DIRECT', createdAt: existing.assignedAt,
    });

    const state = bindConfirmedAudienceToAssignments(input({
      handoff: { ...baseHandoff, assignmentCandidateLearnerIds: ['learner-1'] },
      existingAssignments: [existing],
      existingOrigins: [directOrigin],
      assignmentIdForLearner: () => 'new-id-that-must-not-win',
    }));

    expect(state.result.createdCount).toBe(0);
    expect(state.result.reusedAssignmentIds).toEqual(['existing-assignment']);
    expect(state.assignments).toEqual([existing]);
    expect(state.origins.map((item) => item.originType).sort()).toEqual(['AUDIENCE_RESOLUTION', 'DIRECT']);
  });

  it('requires an idempotency key and rejects handoff scope substitution', () => {
    expect(() => bindConfirmedAudienceToAssignments(input({ idempotencyKey: '   ' }))).toThrow('IDEMPOTENCY_KEY_REQUIRED');
    expect(() => bindConfirmedAudienceToAssignments(input({
      handoff: { ...baseHandoff, trainingVersionId: 'other-version' },
    }))).toThrow('HANDOFF_SCOPE_MISMATCH');
  });

  it('rejects cross-tenant or inactive learner substitution', () => {
    expect(() => bindConfirmedAudienceToAssignments(input({
      handoff: { ...baseHandoff, assignmentCandidateLearnerIds: ['learner-1'] },
      learnerScopes: [{ learnerId: 'learner-1', tenantId: 'tenant-2', active: true }],
    }))).toThrow('LEARNER_SCOPE_MISMATCH');

    expect(() => bindConfirmedAudienceToAssignments(input({
      handoff: { ...baseHandoff, assignmentCandidateLearnerIds: ['learner-1'] },
      learnerScopes: [{ learnerId: 'learner-1', tenantId: 'tenant-1', active: false }],
    }))).toThrow('LEARNER_NOT_ACTIVE');
  });

  it('rejects generated assignment ids that collide with immutable historical rows', () => {
    const completed: TrainingAssignment = {
      id: 'assignment-learner-1',
      tenantId: 'tenant-1',
      learnerId: 'learner-1',
      trainingId: 'training-1',
      trainingVersionId: 'version-1',
      status: 'COMPLETED',
      assignedAt: new Date('2026-08-01T00:00:00Z'),
      completedAt: new Date('2026-08-02T00:00:00Z'),
    };
    expect(() => bindConfirmedAudienceToAssignments(input({
      handoff: { ...baseHandoff, assignmentCandidateLearnerIds: ['learner-1'] },
      existingAssignments: [completed],
    }))).toThrow('ASSIGNMENT_ID_COLLISION');
  });

  it('rejects conflicting idempotency-key reuse and changed resolution lineage', () => {
    const first = bindConfirmedAudienceToAssignments(input());

    expect(() => bindConfirmedAudienceToAssignments(input({
      handoff: { ...baseHandoff, resolutionId: 'resolution-2', resolutionFingerprint: 'b'.repeat(64) },
      existingAssignments: first.assignments,
      existingOrigins: first.origins,
      existingIdempotencyRecords: first.idempotencyRecords,
    }))).toThrow('IDEMPOTENCY_CONFLICT');

    const existingOrigin = first.origins[0]!;
    expect(() => bindConfirmedAudienceToAssignments(input({
      handoff: { ...baseHandoff, assignmentCandidateLearnerIds: ['learner-1'], resolutionFingerprint: 'b'.repeat(64) },
      idempotencyKey: 'idem-2',
      existingAssignments: first.assignments,
      existingOrigins: [{ ...existingOrigin, sourceFingerprint: fingerprint }],
      existingIdempotencyRecords: [],
    }))).toThrow('CONFLICT');
  });

  it('keeps later audience resolutions as additional provenance without creating a second assignment', () => {
    const first = bindConfirmedAudienceToAssignments(input({
      handoff: { ...baseHandoff, assignmentCandidateLearnerIds: ['learner-1'] },
    }));
    const second = bindConfirmedAudienceToAssignments(input({
      idempotencyKey: 'idem-2',
      handoff: {
        ...baseHandoff,
        resolutionId: 'resolution-2',
        resolutionFingerprint: 'b'.repeat(64),
        assignmentCandidateLearnerIds: ['learner-1'],
      },
      existingAssignments: first.assignments,
      existingOrigins: first.origins,
      existingIdempotencyRecords: first.idempotencyRecords,
    }));

    expect(second.result.createdCount).toBe(0);
    expect(second.result.reusedCount).toBe(1);
    expect(second.assignments).toHaveLength(1);
    expect(second.origins).toHaveLength(2);
    expect(second.origins.map((item) => item.sourceRefId).sort()).toEqual(['resolution-1', 'resolution-2']);
  });
});
