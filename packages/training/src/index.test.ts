import { describe, expect, it } from 'vitest';
import { publishTraining, transitionTraining, validateTrainingOwnership, type TrainingAggregateState } from './index.js';

function draft(): TrainingAggregateState {
  return {
    id: 'training-1', tenantId: 'tenant-a', title: 'Security Basics', status: 'DRAFT', revision: 1,
    objectives: [{ id: 'lo-1', tenantId: 'tenant-a', trainingId: 'training-1', statement: 'Explain least privilege', active: true }],
    modules: [{ id: 'm-1', tenantId: 'tenant-a', trainingId: 'training-1', title: 'Intro', position: 1, active: true }],
    publishedVersions: [],
  };
}

describe('training hard gates', () => {
  it('rejects invalid DRAFT -> PUBLISHED transition', () => {
    expect(() => transitionTraining(draft(), 'PUBLISHED')).toThrowError('INVALID_STATE_TRANSITION');
  });

  it('rejects cross-tenant objective/module ownership', () => {
    const state = draft();
    const invalid = { ...state, objectives: [{ ...state.objectives[0]!, tenantId: 'tenant-b' }] };
    expect(() => validateTrainingOwnership(invalid)).toThrowError('TENANT_BOUNDARY_VIOLATION');
  });

  it('publishes only from IN_REVIEW and creates immutable snapshot', () => {
    const review = transitionTraining(draft(), 'IN_REVIEW');
    const result = publishTraining({ state: review, versionId: 'v1', publishedAt: new Date('2026-08-12T00:00:00Z') });
    expect(result.state.status).toBe('PUBLISHED');
    expect(result.version.version).toBe(1);
    expect(Object.isFrozen(result.version)).toBe(true);
    expect(Object.isFrozen(result.version.snapshot)).toBe(true);
    expect(Object.isFrozen(result.version.snapshot.modules)).toBe(true);
  });

  it('requires at least one active module and objective', () => {
    const review = transitionTraining(draft(), 'IN_REVIEW');
    expect(() => publishTraining({ state: { ...review, modules: [] }, versionId: 'v1', publishedAt: new Date() })).toThrowError('VALIDATION_FAILED');
    expect(() => publishTraining({ state: { ...review, objectives: [] }, versionId: 'v1', publishedAt: new Date() })).toThrowError('VALIDATION_FAILED');
  });
});
