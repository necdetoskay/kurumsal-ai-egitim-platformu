import { describe, expect, it, vi } from 'vitest';
import { OperationsAdminApi, assertNoTenantOverride, type OperationsAdminHttpClient } from './operations-admin-api.js';

function client() {
  const get = vi.fn();
  const post = vi.fn();
  const http: OperationsAdminHttpClient = {
    async get<T>(path: string): Promise<T> { get(path); return {} as T; },
    async post<T>(path: string, body?: unknown): Promise<T> { post(path, body); return {} as T; },
  };
  return { http, get, post };
}

describe('OperationsAdminApi', () => {
  it('uses review/confirm import flow without destructive history update path', async () => {
    const { http, post } = client();
    const api = new OperationsAdminApi(http);
    await api.createImport({ fileName: 'employees.csv' });
    await api.confirmImport('imp/1', { reviewed: true });
    expect(post).toHaveBeenCalledWith('/api/v1/organization-imports', { fileName: 'employees.csv' });
    expect(post).toHaveBeenCalledWith('/api/v1/organization-imports/imp%2F1/confirm', { reviewed: true });
  });

  it('previews audience before fingerprint-bound idempotent confirmation', async () => {
    const { http, post } = client();
    const api = new OperationsAdminApi(http);
    const targets = [{ type: 'GROUP' as const, id: 'g1' }, { type: 'EMPLOYEE' as const, id: 'e1' }];
    const base = { organizationId: 'o1', trainingId: 't1', trainingVersionId: 'v1', targets };
    await api.previewAudience(base);
    await api.confirmAudience({ ...base, resolutionFingerprint: 'a'.repeat(64), idempotencyKey: 'idem-1' });
    expect(post).toHaveBeenCalledWith('/api/v1/training-audiences/preview', base);
    expect(post).toHaveBeenCalledWith('/api/v1/training-audiences/confirm', { ...base, resolutionFingerprint: 'a'.repeat(64), idempotencyKey: 'idem-1' });
  });

  it('rejects client tenant override', () => {
    expect(() => assertNoTenantOverride({ tenantId: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoTenantOverride({ tenant_id: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
  });
});
