import type { AuthContext, ResourceEnvelope, RouteContract } from './index.js';

export type TrainingAudienceTargetType = 'ORGANIZATION' | 'COMPANY' | 'DEPARTMENT' | 'GROUP' | 'EMPLOYEE';
export interface TrainingAudienceTarget { type: TrainingAudienceTargetType; id: string; }
export interface TrainingAudiencePreviewRequest { organizationId: string; trainingId: string; trainingVersionId: string; targets: TrainingAudienceTarget[]; }
export interface TrainingAudiencePreviewData {
  resolutionFingerprint: string;
  targetCount: number;
  expandedCandidateCount: number;
  overlapCount: number;
  uniqueEmployeeCount: number;
  assignableLearnerCount: number;
  unlinkedEmployeeIds: string[];
}
export interface TrainingAudienceConfirmRequest extends TrainingAudiencePreviewRequest { resolutionFingerprint: string; idempotencyKey: string; }
export interface TrainingAudienceHandoffData { resolutionId: string; resolutionFingerprint: string; assignmentCandidateLearnerIds: string[]; unlinkedEmployeeIds: string[]; }

export const trainingAudienceRoutes: readonly RouteContract[] = [
  { method: 'POST', path: '/api/v1/training-audiences/preview', mutation: false },
  { method: 'POST', path: '/api/v1/training-audiences/confirm', mutation: true },
] as const;

export interface TrainingAudienceAuthorizer {
  assertOrganizationAccess(context: AuthContext, organizationId: string, action: 'read' | 'write'): Promise<void>;
  assertTrainingAccess(context: AuthContext, trainingId: string, action: 'read' | 'assign'): Promise<void>;
}

export interface TrainingAudienceApplicationService {
  preview(context: AuthContext, input: TrainingAudiencePreviewRequest): Promise<ResourceEnvelope<TrainingAudiencePreviewData>>;
  confirm(context: AuthContext, input: TrainingAudienceConfirmRequest): Promise<ResourceEnvelope<TrainingAudienceHandoffData>>;
}

export function assertAudienceConfirmGate(input: TrainingAudienceConfirmRequest): void {
  if (!input.idempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  if (!/^[a-f0-9]{64}$/i.test(input.resolutionFingerprint)) throw new Error('INVALID_RESOLUTION_FINGERPRINT');
  if (input.targets.length === 0) throw new Error('AUDIENCE_TARGETS_REQUIRED');
}

export function assertAudiencePreviewIsSideEffectFree(route: RouteContract): void {
  if (route.path.endsWith('/preview') && route.mutation) throw new Error('AUDIENCE_PREVIEW_MUST_BE_READ_ONLY');
}
