import { describe, expect, it } from 'vitest';
import {
  assertNoClientTenantOverride,
  collectionEnvelope,
  coreOrganizationRoutes,
  errorEnvelope,
  resourceEnvelope,
} from './index.js';

describe('core Organization Management API contract', () => {
  it('publishes only canonical /api/v1 core routes and no DELETE lifecycle paths', () => {
    expect(coreOrganizationRoutes.length).toBeGreaterThan(20);
    expect(coreOrganizationRoutes.every((route) => route.path.startsWith('/api/v1/'))).toBe(true);
    expect(coreOrganizationRoutes.some((route) => route.path.includes('/departments/:departmentId/move'))).toBe(true);
    expect(coreOrganizationRoutes.some((route) => (route.method as string) === 'DELETE')).toBe(false);
  });

  it('rejects tenant override from client payload', () => {
    expect(() => assertNoClientTenantOverride({ name: 'ABC', tenantId: 'spoofed' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoClientTenantOverride({ name: 'ABC', tenant_id: 'spoofed' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoClientTenantOverride({ name: 'ABC', code: 'ABC' })).not.toThrow();
  });

  it('uses canonical resource, collection and safe error envelopes', () => {
    expect(resourceEnvelope({ id: 'o1' }, 'corr-1')).toEqual({ data: { id: 'o1' }, meta: { correlationId: 'corr-1' } });
    expect(collectionEnvelope([{ id: 'o1' }], 'corr-2')).toEqual({ data: [{ id: 'o1' }], meta: { nextCursor: null, count: 1, correlationId: 'corr-2' } });
    expect(errorEnvelope('FORBIDDEN', 'corr-3')).toEqual({ error: { code: 'FORBIDDEN', message: 'İşlem gerçekleştirilemedi.', correlationId: 'corr-3' } });
  });
});
