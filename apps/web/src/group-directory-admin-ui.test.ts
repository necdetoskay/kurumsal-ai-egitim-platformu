import { describe, expect, it } from 'vitest';
import { canManuallyMutateGroup, dynamicBuilderEnabled } from './group-directory-admin-ui';
import { GroupDirectoryAdminApi, assertNoTenantOverride } from './group-directory-admin-api';

describe('group directory admin contracts', () => {
  it('only allows manual membership mutation for MANUAL groups', () => {
    expect(canManuallyMutateGroup('MANUAL')).toBe(true);
    expect(canManuallyMutateGroup('DYNAMIC')).toBe(false);
    expect(canManuallyMutateGroup('SYSTEM')).toBe(false);
  });

  it('keeps dynamic builder feature gated in V1', () => {
    expect(dynamicBuilderEnabled()).toBe(false);
  });

  it('uses temporal membership remove and lifecycle commands', async () => {
    const calls: Array<[string, unknown?]> = [];
    const http = {
      async get<T>(_path: string): Promise<T> { return {} as T; },
      async post<T>(path: string, body?: unknown): Promise<T> { calls.push([path, body]); return {} as T; },
      async patch<T>(_path: string, _body: unknown): Promise<T> { return {} as T; },
    };
    const api = new GroupDirectoryAdminApi(http);
    await api.removeManualMember('g/1', 'e1', '2026-09-05T10:00:00Z');
    await api.passivatePosition('p1');
    await api.reactivateLocation('l1');
    expect(calls[0]).toEqual(['/api/v1/groups/g%2F1/members/e1/remove', { effectiveAt: '2026-09-05T10:00:00Z' }]);
    expect(calls[1]?.[0]).toBe('/api/v1/positions/p1/passivate');
    expect(calls[2]?.[0]).toBe('/api/v1/locations/l1/reactivate');
    expect(calls.some(([path]) => path.includes('delete'))).toBe(false);
  });

  it('rejects tenant override on create payloads', () => {
    expect(() => assertNoTenantOverride({ tenantId: 'spoof' })).toThrow('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
    expect(() => assertNoTenantOverride({ name: 'Merkez' })).not.toThrow();
  });
});
