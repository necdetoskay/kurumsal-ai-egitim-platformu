import { describe, expect, it } from 'vitest';
import { resolveTrustedTenantContext, TenantContextError } from './tenant-context.js';

const memberships = [
  { tenantId: 'tenant-a', userId: 'user-1', status: 'active' as const, roles: ['learner'] as const },
  { tenantId: 'tenant-b', userId: 'user-1', status: 'active' as const, roles: ['reviewer'] as const },
  { tenantId: 'tenant-c', userId: 'user-2', status: 'active' as const, roles: ['tenant_admin'] as const },
];

describe('trusted tenant context', () => {
  it('resolves an explicitly selected active membership', () => {
    expect(resolveTrustedTenantContext({
      principal: { userId: 'user-1' },
      requestedTenantId: 'tenant-b',
      memberships,
    })).toEqual({ actorId: 'user-1', tenantId: 'tenant-b', roles: ['reviewer'] });
  });

  it('does not trust a client requested tenant without membership', () => {
    expect(() => resolveTrustedTenantContext({
      principal: { userId: 'user-1' },
      requestedTenantId: 'tenant-c',
      memberships,
    })).toThrowError(TenantContextError);
  });

  it('requires explicit tenant selection for multi-tenant principals', () => {
    expect(() => resolveTrustedTenantContext({
      principal: { userId: 'user-1' },
      memberships,
    })).toThrowError(TenantContextError);
  });

  it('rejects principals without an active membership', () => {
    expect(() => resolveTrustedTenantContext({
      principal: { userId: 'unknown-user' },
      memberships,
    })).toThrowError(TenantContextError);
  });
});
