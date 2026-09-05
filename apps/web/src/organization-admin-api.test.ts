import { describe, expect, it } from 'vitest';
import {
  OrganizationAdminApi,
  assertNoTenantOverride,
  type OrganizationAdminHttpClient,
} from './organization-admin-api.js';

function createHttpFixture() {
  const calls: Array<{ method: 'GET' | 'POST' | 'PATCH'; path: string; body?: unknown }> = [];
  const http: OrganizationAdminHttpClient = {
    async get<T>(path: string): Promise<T> {
      calls.push({ method: 'GET', path });
      return {} as T;
    },
    async post<T>(path: string, body?: unknown): Promise<T> {
      calls.push({ method: 'POST', path, ...(body !== undefined ? { body } : {}) });
      return {} as T;
    },
    async patch<T>(path: string, body: unknown): Promise<T> {
      calls.push({ method: 'PATCH', path, body });
      return {} as T;
    },
  };
  return { http, calls };
}

describe('OrganizationAdminApi', () => {
  it('uses canonical tree and department move command paths', async () => {
    const { http, calls } = createHttpFixture();
    const api = new OrganizationAdminApi(http);
    await api.getOrganizationTree('o 1');
    await api.moveDepartment('d/1', { newParentDepartmentId: 'd2', expectedVersion: 3 });
    expect(calls).toContainEqual({ method: 'GET', path: '/api/v1/organizations/o%201/tree' });
    expect(calls).toContainEqual({
      method: 'POST',
      path: '/api/v1/departments/d%2F1/move',
      body: { newParentDepartmentId: 'd2', expectedVersion: 3 },
    });
  });

  it('uses lifecycle commands instead of delete operations', async () => {
    const { http, calls } = createHttpFixture();
    const api = new OrganizationAdminApi(http);
    await api.passivateCompany('c1', 2);
    await api.passivateDepartment('d1');
    expect(calls).toContainEqual({
      method: 'POST',
      path: '/api/v1/companies/c1/passivate',
      body: { expectedVersion: 2 },
    });
    expect(calls).toContainEqual({ method: 'POST', path: '/api/v1/departments/d1/passivate' });
    expect(calls.some((call) => call.method === ('DELETE' as never))).toBe(false);
  });

  it('rejects client tenant override fields', () => {
    expect(() => assertNoTenantOverride({ name: 'A', tenantId: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoTenantOverride({ name: 'A', tenant_id: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoTenantOverride({ name: 'A' })).not.toThrow();
  });
});
