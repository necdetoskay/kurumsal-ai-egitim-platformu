import { describe, expect, it } from 'vitest';
import {
  ApiGateError,
  assertExpectedVersion,
  assertPermission,
  assertResourceScope,
  authContextFromTrustedSession,
  executeIdempotent,
  gateErrorEnvelope,
  resolveExpectedVersion,
  type IdempotencyRecord,
  type IdempotencyStore,
} from './shared-gates.js';

class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord<unknown>>();
  async get<T>(tenantId: string, operation: string, key: string): Promise<IdempotencyRecord<T> | null> {
    return (this.records.get(`${tenantId}:${operation}:${key}`) as IdempotencyRecord<T> | undefined) ?? null;
  }
  async put<T>(tenantId: string, operation: string, key: string, record: IdempotencyRecord<T>): Promise<void> {
    this.records.set(`${tenantId}:${operation}:${key}`, record as IdempotencyRecord<unknown>);
  }
}

const context = authContextFromTrustedSession({
  tenantId: 't1', userId: 'u1', permissions: ['organization.read', 'organization.manage'], correlationId: 'corr-1',
});

describe('shared Organization Management API gates', () => {
  it('builds auth context only from trusted session data', () => {
    expect(context.tenantId).toBe('t1');
    expect(() => authContextFromTrustedSession({ tenantId: '', userId: 'u1', permissions: [], correlationId: 'c' }))
      .toThrow('UNAUTHENTICATED');
  });

  it('fails closed for missing permission and cross-scope access', () => {
    expect(() => assertPermission(context, 'role.assign')).toThrow('FORBIDDEN');
    expect(() => assertResourceScope(context, { tenantId: 't2' })).toThrow('CROSS_TENANT_REFERENCE');
    expect(() => assertResourceScope(context, { tenantId: 't1', organizationId: 'o2' }, { organizationId: 'o1' }))
      .toThrow('CROSS_ORGANIZATION_REFERENCE');
    expect(() => assertResourceScope(context, { tenantId: 't1', companyId: 'c2' }, { companyId: 'c1' }))
      .toThrow('CROSS_COMPANY_DEPARTMENT_REFERENCE');
  });

  it('replays the same idempotent request and rejects conflicting reuse', async () => {
    const store = new MemoryIdempotencyStore();
    let executions = 0;
    const first = await executeIdempotent({
      context, operation: 'group.bulk-add', key: 'idem-1', requestHash: 'hash-a', store,
      execute: async () => ({ ok: true, run: ++executions }),
    });
    const replay = await executeIdempotent({
      context, operation: 'group.bulk-add', key: 'idem-1', requestHash: 'hash-a', store,
      execute: async () => ({ ok: true, run: ++executions }),
    });
    expect(first).toEqual({ replayed: false, result: { ok: true, run: 1 } });
    expect(replay).toEqual({ replayed: true, result: { ok: true, run: 1 } });
    expect(executions).toBe(1);
    await expect(executeIdempotent({
      context, operation: 'group.bulk-add', key: 'idem-1', requestHash: 'hash-b', store,
      execute: async () => ({ ok: false }),
    })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' } as Partial<ApiGateError>);
  });

  it('enforces optimistic concurrency from expectedVersion or If-Match', () => {
    expect(resolveExpectedVersion({ ifMatch: '"7"' })).toBe(7);
    expect(resolveExpectedVersion({ ifMatch: 'W/"8"' })).toBe(8);
    expect(resolveExpectedVersion({ expectedVersion: 9, ifMatch: '"8"' })).toBe(9);
    expect(() => assertExpectedVersion(7, 6)).toThrow('VERSION_CONFLICT');
    expect(() => assertExpectedVersion(7, 7)).not.toThrow();
  });

  it('maps gate failures to canonical safe error envelopes with correlation linkage', () => {
    expect(gateErrorEnvelope(new ApiGateError(403, 'FORBIDDEN'), 'corr-9')).toEqual({
      status: 403,
      body: { error: { code: 'FORBIDDEN', message: 'İşlem gerçekleştirilemedi.', correlationId: 'corr-9' } },
    });
  });
});
