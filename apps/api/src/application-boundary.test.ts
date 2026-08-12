import { describe, expect, it } from 'vitest';
import { executeIdempotently, requireAuthorizedAction, ApplicationBoundaryError } from './application-boundary.js';

const tenantAdmin = { actorId: 'admin-1', tenantId: 'tenant-a', roles: ['tenant_admin'] as const };
const reviewer = { actorId: 'reviewer-1', tenantId: 'tenant-a', roles: ['reviewer'] as const };
const learner = { actorId: 'learner-1', tenantId: 'tenant-a', roles: ['learner'] as const };

it('rejects unauthorized publish and cross-tenant actions', () => {
  expect(() => requireAuthorizedAction({ actor: learner, permission: 'training.publish', resource: { tenantId: 'tenant-a' } }))
    .toThrowError(ApplicationBoundaryError);
  expect(() => requireAuthorizedAction({ actor: tenantAdmin, permission: 'assessment.publish', resource: { tenantId: 'tenant-b' } }))
    .toThrowError('FORBIDDEN');
  expect(() => requireAuthorizedAction({ actor: reviewer, permission: 'training.publish', resource: { tenantId: 'tenant-a' } }))
    .toThrowError('FORBIDDEN');
});

it('allows authorized publish within tenant boundary', () => {
  expect(() => requireAuthorizedAction({ actor: tenantAdmin, permission: 'training.publish', resource: { tenantId: 'tenant-a' } }))
    .not.toThrow();
  expect(() => requireAuthorizedAction({ actor: tenantAdmin, permission: 'assessment.publish', resource: { tenantId: 'tenant-a' } }))
    .not.toThrow();
});

describe('critical write idempotency', () => {
  it('replays same key and fingerprint without repeating side effects', () => {
    let calls = 0;
    const first = executeIdempotently({ key: 'submit:attempt-1', fingerprint: 'payload-v1', existing: [], execute: () => ++calls });
    const replay = executeIdempotently({ key: 'submit:attempt-1', fingerprint: 'payload-v1', existing: first.records, execute: () => ++calls });
    expect(first.result).toBe(1);
    expect(replay.result).toBe(1);
    expect(replay.replayed).toBe(true);
    expect(calls).toBe(1);
  });

  it('fails closed when an idempotency key is reused for a different payload', () => {
    const first = executeIdempotently({ key: 'certificate:issue-1', fingerprint: 'eligibility-a', existing: [], execute: () => 'issued' });
    expect(() => executeIdempotently({ key: 'certificate:issue-1', fingerprint: 'eligibility-b', existing: first.records, execute: () => 'other' }))
      .toThrowError('IDEMPOTENCY_CONFLICT');
  });
});
