export const trainingStatuses = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
export type TrainingStatus = (typeof trainingStatuses)[number];

export interface LearningObjective {
  id: string;
  tenantId: string;
  trainingId: string;
  statement: string;
  active: boolean;
}

export interface TrainingModule {
  id: string;
  tenantId: string;
  trainingId: string;
  title: string;
  position: number;
  active: boolean;
}

export interface TrainingSnapshot {
  title: string;
  description?: string;
  objectives: readonly LearningObjective[];
  modules: readonly TrainingModule[];
}

export interface TrainingVersion {
  id: string;
  tenantId: string;
  trainingId: string;
  version: number;
  snapshot: TrainingSnapshot;
  publishedAt: Date;
}

export interface TrainingAggregateState {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: TrainingStatus;
  revision: number;
  objectives: readonly LearningObjective[];
  modules: readonly TrainingModule[];
  publishedVersions: readonly TrainingVersion[];
}

export class TrainingDomainError extends Error {
  constructor(public readonly code: 'INVALID_STATE_TRANSITION' | 'VALIDATION_FAILED' | 'TENANT_BOUNDARY_VIOLATION') {
    super(code);
  }
}

const allowedTransitions: Record<TrainingStatus, readonly TrainingStatus[]> = {
  DRAFT: ['IN_REVIEW'],
  IN_REVIEW: ['DRAFT', 'PUBLISHED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function transitionTraining(state: TrainingAggregateState, target: TrainingStatus): TrainingAggregateState {
  if (!allowedTransitions[state.status].includes(target)) {
    throw new TrainingDomainError('INVALID_STATE_TRANSITION');
  }
  return { ...state, status: target, revision: state.revision + 1 };
}

export function validateTrainingOwnership(state: TrainingAggregateState): void {
  for (const objective of state.objectives) {
    if (objective.tenantId !== state.tenantId || objective.trainingId !== state.id) {
      throw new TrainingDomainError('TENANT_BOUNDARY_VIOLATION');
    }
  }
  for (const module of state.modules) {
    if (module.tenantId !== state.tenantId || module.trainingId !== state.id) {
      throw new TrainingDomainError('TENANT_BOUNDARY_VIOLATION');
    }
  }
}

export function validatePublishReadiness(state: TrainingAggregateState): void {
  validateTrainingOwnership(state);
  if (state.status !== 'IN_REVIEW') throw new TrainingDomainError('INVALID_STATE_TRANSITION');
  if (!state.title.trim()) throw new TrainingDomainError('VALIDATION_FAILED');
  if (state.modules.filter((module) => module.active).length === 0) throw new TrainingDomainError('VALIDATION_FAILED');
  if (state.objectives.filter((objective) => objective.active).length === 0) throw new TrainingDomainError('VALIDATION_FAILED');
}

export function publishTraining(input: {
  state: TrainingAggregateState;
  versionId: string;
  publishedAt: Date;
}): { state: TrainingAggregateState; version: TrainingVersion } {
  validatePublishReadiness(input.state);
  const nextVersionNumber = (input.state.publishedVersions.at(-1)?.version ?? 0) + 1;
  const version: TrainingVersion = Object.freeze({
    id: input.versionId,
    tenantId: input.state.tenantId,
    trainingId: input.state.id,
    version: nextVersionNumber,
    publishedAt: input.publishedAt,
    snapshot: Object.freeze({
      title: input.state.title,
      ...(input.state.description !== undefined ? { description: input.state.description } : {}),
      objectives: Object.freeze(input.state.objectives.map((item) => Object.freeze({ ...item }))),
      modules: Object.freeze(input.state.modules.map((item) => Object.freeze({ ...item }))),
    }),
  });
  return {
    version,
    state: {
      ...input.state,
      status: 'PUBLISHED',
      revision: input.state.revision + 1,
      publishedVersions: [...input.state.publishedVersions, version],
    },
  };
}

export interface PublishCommandRecord {
  idempotencyKey: string;
  tenantId: string;
  trainingId: string;
  versionId: string;
}

export function resolveIdempotentPublish(records: readonly PublishCommandRecord[], candidate: PublishCommandRecord): PublishCommandRecord | null {
  const existing = records.find((record) => record.idempotencyKey === candidate.idempotencyKey && record.tenantId === candidate.tenantId);
  if (!existing) return null;
  if (existing.trainingId !== candidate.trainingId) throw new Error('IDEMPOTENCY_CONFLICT');
  return existing;
}
