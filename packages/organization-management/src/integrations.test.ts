import { describe, expect, it, vi } from 'vitest';
import { externalIdentityKey, mapExternalRecord, previewImport, queryOrganizationAudit, runSync, type ExistingEmployeeSnapshot, type OrganizationAuditQueryPort, type SyncExecutionPort } from './integrations.js';

describe('organization management import and sync', () => {
  it('builds deterministic external identity keys', () => {
    expect(externalIdentityKey('t1', 'ACTIVE_DIRECTORY', ' User-42 ')).toBe('t1:ACTIVE_DIRECTORY:user-42');
  });

  it('blocks silent active employment overwrite and requires explicit resolution', () => {
    const existing = new Map<string, ExistingEmployeeSnapshot>([
      ['t1:CSV:e-1', { employeeId: 'emp1', provider: 'CSV', externalId: 'e-1', activeEmployment: { employmentId: 'job1', companyId: 'c1', departmentId: 'd1' } }],
    ]);
    const preview = previewImport([{ rowNumber: 1, fullName: 'Ayşe', provider: 'CSV', externalId: 'e-1', organizationId: 'o1', companyId: 'c1', departmentId: 'd2' }], existing, 't1');
    expect(preview.canCommit).toBe(false);
    expect(preview.conflicts[0]?.code).toBe('ACTIVE_EMPLOYMENT_DIFFERS');
    expect(preview.items[0]?.decision).toBe('CONFLICT');
  });

  it('detects duplicate external identities inside an import', () => {
    const rows = [
      { rowNumber: 1, fullName: 'A', provider: 'LDAP' as const, externalId: 'x', organizationId: 'o1' },
      { rowNumber: 2, fullName: 'B', provider: 'LDAP' as const, externalId: 'X', organizationId: 'o1' },
    ];
    const preview = previewImport(rows, new Map(), 't1');
    expect(preview.canCommit).toBe(false);
    expect(preview.conflicts[0]?.code).toBe('DUPLICATE_EXTERNAL_IDENTITY');
  });

  it('anti-corruption mapping never writes employment history directly', () => {
    const proposal = mapExternalRecord('t1', { provider: 'ERP', externalId: '42', fullName: 'Mehmet', companyCode: 'C1', departmentCode: 'D1' });
    expect(proposal.historyMutation).toBe('NONE');
    expect(proposal.placementReference).toEqual({ companyCode: 'C1', departmentCode: 'D1' });
  });

  it('replays completed sync by idempotency key without executing again', async () => {
    const prior = { idempotencyKey: 'k1', status: 'SUCCEEDED' as const, processed: 1, applied: 1, conflicts: 0, errors: [], correlationId: 'corr1' };
    const execute = vi.fn();
    const appendAudit = vi.fn();
    const port: SyncExecutionPort = { findCompletedByIdempotencyKey: vi.fn(async () => prior), execute, appendAudit };
    const result = await runSync({ tenantId: 't1', idempotencyKey: 'k1', correlationId: 'corr1', records: [{ provider: 'ACTIVE_DIRECTORY', externalId: 'u1', fullName: 'User' }] }, port);
    expect(result).toBe(prior);
    expect(execute).not.toHaveBeenCalled();
    expect(appendAudit).not.toHaveBeenCalled();
  });

  it('audits a new sync execution', async () => {
    const execute = vi.fn(async ({ idempotencyKey, correlationId }: { idempotencyKey: string; correlationId: string }) => ({ idempotencyKey, status: 'SUCCEEDED' as const, processed: 1, applied: 1, conflicts: 0, errors: [], correlationId }));
    const appendAudit = vi.fn(async () => undefined);
    const port: SyncExecutionPort = { findCompletedByIdempotencyKey: vi.fn(async () => null), execute, appendAudit };
    await runSync({ tenantId: 't1', idempotencyKey: 'k2', correlationId: 'corr2', records: [{ provider: 'HR_API', externalId: 'hr1', fullName: 'Person' }] }, port);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(appendAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'EXTERNAL_SYNC_EXECUTED', correlationId: 'corr2' }));
  });
});

describe('organization audit query', () => {
  it('enforces tenant scope and caps page size', async () => {
    const query = vi.fn(async (_tenantId: string, input: { limit?: number }) => ({ data: [], nextCursor: null, limit: input.limit }));
    const port: OrganizationAuditQueryPort = { assertTenantScope: vi.fn(async () => undefined), query };
    await queryOrganizationAudit({ tenantId: 't1', actorUserId: 'u1', query: { correlationId: 'corr', limit: 500 } }, port);
    expect(port.assertTenantScope).toHaveBeenCalledWith('t1', 'u1');
    expect(query).toHaveBeenCalledWith('t1', expect.objectContaining({ correlationId: 'corr', limit: 100 }));
  });
});
