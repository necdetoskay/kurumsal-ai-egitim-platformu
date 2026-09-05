import { describe, expect, it, vi } from 'vitest';
import { OrganizationAdminApi, assertNoTenantOverride } from './organization-admin-api.js';

describe('OrganizationAdminApi', () => {
  it('uses canonical tree and department move command paths', async () => {
    const http = { get: vi.fn(async () => ({})), post: vi.fn(async () => ({})), patch: vi.fn(async () => ({})) };
    const api = new OrganizationAdminApi(http);
    await api.getOrganizationTree('o 1');
    await api.moveDepartment('d/1', { newParentDepartmentId: 'd2', expectedVersion: 3 });
    expect(http.get).toHaveBeenCalledWith('/api/v1/organizations/o%201/tree');
    expect(http.post).toHaveBeenCalledWith('/api/v1/departments/d%2F1/move', { newParentDepartmentId: 'd2', expectedVersion: 3 });
  });

  it('uses lifecycle commands instead of delete operations', async () => {
    const http = { get: vi.fn(async () => ({})), post: vi.fn(async () => ({})), patch: vi.fn(async () => ({})) };
    const api = new OrganizationAdminApi(http);
    await api.passivateCompany('c1', 2);
    await api.passivateDepartment('d1');
    expect(http.post).toHaveBeenCalledWith('/api/v1/companies/c1/passivate', { expectedVersion: 2 });
    expect(http.post).toHaveBeenCalledWith('/api/v1/departments/d1/passivate', undefined);
  });

  it('rejects client tenant override fields', () => {
    expect(() => assertNoTenantOverride({ name: 'A', tenantId: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoTenantOverride({ name: 'A', tenant_id: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoTenantOverride({ name: 'A' })).not.toThrow();
  });
});
