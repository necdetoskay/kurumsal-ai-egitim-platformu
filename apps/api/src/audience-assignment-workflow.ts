import {
  createAssignmentOrigin,
  resolveAssignment,
  resolveAssignmentOrigin,
  type TrainingAssignment,
  type TrainingAssignmentOrigin,
} from '@kaep/learning';
import type { TrainingAudienceHandoffData } from '@kaep/organization-management-api';
import { executeIdempotently, type IdempotencyRecord } from './application-boundary.js';

export class AudienceAssignmentWorkflowError extends Error {
  constructor(public readonly code:
    | 'HANDOFF_SCOPE_MISMATCH'
    | 'INVALID_RESOLUTION_FINGERPRINT'
    | 'IDEMPOTENCY_KEY_REQUIRED'
    | 'LEARNER_SCOPE_MISMATCH'
    | 'LEARNER_NOT_ACTIVE'
    | 'ASSIGNMENT_ID_COLLISION') {
    super(code);
  }
}

export interface LearnerScopeRecord {
  learnerId: string;
  tenantId: string;
  active: boolean;
}

export interface AudienceAssignmentResult {
  resolutionId: string;
  resolutionFingerprint: string;
  createdAssignmentIds: readonly string[];
  reusedAssignmentIds: readonly string[];
  unlinkedEmployeeIds: readonly string[];
  assignableLearnerCount: number;
  createdCount: number;
  reusedCount: number;
}

export interface AudienceAssignmentWorkflowState {
  result: AudienceAssignmentResult;
  assignments: readonly TrainingAssignment[];
  origins: readonly TrainingAssignmentOrigin[];
  idempotencyRecords: readonly IdempotencyRecord<AudienceAssignmentResult>[];
  replayed: boolean;
}

export interface AudienceAssignmentWorkflowInput {
  tenantId: string;
  trainingId: string;
  trainingVersionId: string;
  assignedAt: Date;
  idempotencyKey: string;
  handoff: TrainingAudienceHandoffData;
  learnerScopes: readonly LearnerScopeRecord[];
  existingAssignments: readonly TrainingAssignment[];
  existingOrigins: readonly TrainingAssignmentOrigin[];
  existingIdempotencyRecords: readonly IdempotencyRecord<AudienceAssignmentResult>[];
  assignmentIdForLearner: (learnerId: string) => string;
  originIdForAssignment: (assignmentId: string, resolutionId: string) => string;
}

function assertHandoffScope(input: AudienceAssignmentWorkflowInput): void {
  const { handoff } = input;
  if (!input.idempotencyKey.trim()) throw new AudienceAssignmentWorkflowError('IDEMPOTENCY_KEY_REQUIRED');
  if (
    handoff.tenantId !== input.tenantId ||
    handoff.trainingId !== input.trainingId ||
    handoff.trainingVersionId !== input.trainingVersionId
  ) {
    throw new AudienceAssignmentWorkflowError('HANDOFF_SCOPE_MISMATCH');
  }
  if (!/^[a-f0-9]{64}$/i.test(handoff.resolutionFingerprint)) {
    throw new AudienceAssignmentWorkflowError('INVALID_RESOLUTION_FINGERPRINT');
  }
}

function operationFingerprint(input: AudienceAssignmentWorkflowInput): string {
  const learnerIds = [...new Set(input.handoff.assignmentCandidateLearnerIds)].sort();
  return JSON.stringify({
    tenantId: input.tenantId,
    trainingId: input.trainingId,
    trainingVersionId: input.trainingVersionId,
    resolutionId: input.handoff.resolutionId,
    resolutionFingerprint: input.handoff.resolutionFingerprint,
    learnerIds,
  });
}

function sameAssignmentIdentity(a: TrainingAssignment, b: TrainingAssignment): boolean {
  return a.tenantId === b.tenantId &&
    a.learnerId === b.learnerId &&
    a.trainingId === b.trainingId &&
    a.trainingVersionId === b.trainingVersionId;
}

export function bindConfirmedAudienceToAssignments(
  input: AudienceAssignmentWorkflowInput,
): AudienceAssignmentWorkflowState {
  assertHandoffScope(input);

  let assignments = [...input.existingAssignments];
  let origins = [...input.existingOrigins];

  const execution = executeIdempotently<AudienceAssignmentResult>({
    key: input.idempotencyKey,
    fingerprint: operationFingerprint(input),
    existing: input.existingIdempotencyRecords,
    execute: () => {
      const scopeByLearner = new Map(input.learnerScopes.map((item) => [item.learnerId, item] as const));
      const learnerIds = [...new Set(input.handoff.assignmentCandidateLearnerIds)].sort();
      const createdAssignmentIds: string[] = [];
      const reusedAssignmentIds: string[] = [];

      for (const learnerId of learnerIds) {
        const learnerScope = scopeByLearner.get(learnerId);
        if (!learnerScope || learnerScope.tenantId !== input.tenantId) {
          throw new AudienceAssignmentWorkflowError('LEARNER_SCOPE_MISMATCH');
        }
        if (!learnerScope.active) throw new AudienceAssignmentWorkflowError('LEARNER_NOT_ACTIVE');

        const candidate: TrainingAssignment = {
          id: input.assignmentIdForLearner(learnerId),
          tenantId: input.tenantId,
          learnerId,
          trainingId: input.trainingId,
          trainingVersionId: input.trainingVersionId,
          status: 'ACTIVE',
          assignedAt: input.assignedAt,
        };

        const resolved = resolveAssignment(assignments, candidate);
        const existingIdOwner = assignments.find((item) => item.id === candidate.id);
        if (resolved === candidate && existingIdOwner) {
          throw new AudienceAssignmentWorkflowError('ASSIGNMENT_ID_COLLISION');
        }
        if (existingIdOwner && resolved !== existingIdOwner && !sameAssignmentIdentity(existingIdOwner, candidate)) {
          throw new AudienceAssignmentWorkflowError('ASSIGNMENT_ID_COLLISION');
        }

        const existed = assignments.some((item) => item.id === resolved.id);
        if (existed) {
          reusedAssignmentIds.push(resolved.id);
        } else {
          assignments.push(resolved);
          createdAssignmentIds.push(resolved.id);
        }

        const candidateOrigin = createAssignmentOrigin({
          id: input.originIdForAssignment(resolved.id, input.handoff.resolutionId),
          tenantId: input.tenantId,
          assignmentId: resolved.id,
          originType: 'AUDIENCE_RESOLUTION',
          sourceRefId: input.handoff.resolutionId,
          sourceFingerprint: input.handoff.resolutionFingerprint,
          createdAt: input.assignedAt,
        });
        const resolvedOrigin = resolveAssignmentOrigin(origins, candidateOrigin);
        if (!origins.some((item) => item.id === resolvedOrigin.id)) origins.push(resolvedOrigin);
      }

      return Object.freeze({
        resolutionId: input.handoff.resolutionId,
        resolutionFingerprint: input.handoff.resolutionFingerprint,
        createdAssignmentIds: Object.freeze([...createdAssignmentIds]),
        reusedAssignmentIds: Object.freeze([...reusedAssignmentIds]),
        unlinkedEmployeeIds: Object.freeze([...input.handoff.unlinkedEmployeeIds].sort()),
        assignableLearnerCount: learnerIds.length,
        createdCount: createdAssignmentIds.length,
        reusedCount: reusedAssignmentIds.length,
      });
    },
  });

  return {
    result: execution.result,
    assignments: Object.freeze(assignments),
    origins: Object.freeze(origins),
    idempotencyRecords: execution.records,
    replayed: execution.replayed,
  };
}
