export class TenantScopeViolationError extends Error {
  constructor(message = 'tenant scope violation') {
    super(message);
    this.name = 'TenantScopeViolationError';
  }
}

export interface TenantScopedRecord {
  tenantId: string;
}

export function assertTenantScope(actorTenantId: string, resourceTenantId: string): void {
  if (actorTenantId !== resourceTenantId) throw new TenantScopeViolationError();
}

export function filterTenantScoped<T extends TenantScopedRecord>(
  actorTenantId: string,
  records: readonly T[],
): T[] {
  return records.filter((record) => record.tenantId === actorTenantId);
}

/**
 * Repository implementations should call this before returning a tenant-owned record.
 * Unknown/cross-tenant ids are deliberately collapsed to null to avoid BOLA enumeration.
 */
export function tenantScopedLookup<T extends TenantScopedRecord>(
  actorTenantId: string,
  records: readonly T[],
  predicate: (record: T) => boolean,
): T | null {
  const record = records.find(predicate);
  if (!record || record.tenantId !== actorTenantId) return null;
  return record;
}
