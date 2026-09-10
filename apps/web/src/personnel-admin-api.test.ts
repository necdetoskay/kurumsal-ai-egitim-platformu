import { describe, expect, it, vi } from 'vitest';
import { PersonnelAdminApi, assertNoTenantOverride } from './personnel-admin-api';

describe('PersonnelAdminApi', () => {
  it('uses the dedicated employment transfer command', async () => {
    const http = { get: vi.fn(async () => ({})), post: vi.fn(async () => ({})), patch: vi.fn(async () => ({})) };
    const api = new PersonnelAdminApi(http);
    await api.transferEmployment('e/1', { companyId: 'c1', departmentId: 'd1', effectiveDate: '2026-09-05', expectedVersion: 4 });
    expect(http.post).toHaveBeenCalledWith('/api/v1/employees/e%2F1/employment-transfer', { companyId: 'c1', departmentId: 'd1', effectiveDate: '2026-09-05', expectedVersion: 4 });
  });

  it('does not trust client tenant identifiers', () => {
    expect(() => assertNoTenantOverride({ tenantId: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoTenantOverride({ tenant_id: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
  });
});
