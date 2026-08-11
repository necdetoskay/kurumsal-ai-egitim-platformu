import type { TenantRole } from './index.js';

export interface AuthenticatedPrincipal {
  userId: string;
}

export interface TenantMembershipRecord {
  tenantId: string;
  userId: string;
  status: 'active' | 'suspended' | 'revoked';
  roles: readonly TenantRole[];
}

export interface TenantContextRequest {
  principal: AuthenticatedPrincipal;
  requestedTenantId?: string;
  memberships: readonly TenantMembershipRecord[];
}

export interface TrustedTenantContext {
  actorId: string;
  tenantId: string;
  roles: readonly TenantRole[];
}

export class TenantContextError extends Error {
  constructor(
    public readonly code: 'NO_ACTIVE_MEMBERSHIP' | 'TENANT_NOT_ALLOWED' | 'TENANT_AMBIGUOUS',
    message: string,
  ) {
    super(message);
    this.name = 'TenantContextError';
  }
}

/**
 * Resolves tenant context only from server-trusted membership records.
 * A requested tenant id is a selector, never proof of membership.
 */
export function resolveTrustedTenantContext(request: TenantContextRequest): TrustedTenantContext {
  const active = request.memberships.filter(
    (membership) => membership.userId === request.principal.userId && membership.status === 'active',
  );

  if (active.length === 0) {
    throw new TenantContextError('NO_ACTIVE_MEMBERSHIP', 'principal has no active tenant membership');
  }

  if (request.requestedTenantId) {
    const selected = active.find((membership) => membership.tenantId === request.requestedTenantId);
    if (!selected) {
      throw new TenantContextError('TENANT_NOT_ALLOWED', 'requested tenant is not an active membership');
    }
    return { actorId: request.principal.userId, tenantId: selected.tenantId, roles: selected.roles };
  }

  if (active.length !== 1) {
    throw new TenantContextError('TENANT_AMBIGUOUS', 'tenant selection is required for multi-tenant principals');
  }

  const selected = active[0]!;
  return { actorId: request.principal.userId, tenantId: selected.tenantId, roles: selected.roles };
}
