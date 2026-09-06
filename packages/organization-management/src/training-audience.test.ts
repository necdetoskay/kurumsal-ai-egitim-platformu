import { describe, expect, it } from 'vitest';
import { TrainingAudienceResolver, type AudienceCandidate, type TrainingAudienceRepository, type TrainingAudienceTarget } from './training-audience.js';

function candidate(employeeId: string, learnerUserId: string | null): AudienceCandidate {
  return { employeeId, learnerUserId, tenantId: 't1', organizationId: 'o1' };
}

function repository(): TrainingAudienceRepository {
  const scopes = new Map<string, { tenantId: string; organizationId: string; active: boolean }>([
    ['ORGANIZATION:o1', { tenantId: 't1', organizationId: 'o1', active: true }],
    ['COMPANY:c1', { tenantId: 't1', organizationId: 'o1', active: true }],
    ['DEPARTMENT:d1', { tenantId: 't1', organizationId: 'o1', active: true }],
    ['GROUP:g1', { tenantId: 't1', organizationId: 'o1', active: true }],
    ['EMPLOYEE:e3', { tenantId: 't1', organizationId: 'o1', active: true }],
    ['GROUP:foreign', { tenantId: 't2', organizationId: 'o2', active: true }],
  ]);
  return {
    async getTargetScope(target) { return scopes.get(`${target.type}:${target.id}`) ?? null; },
    async listActiveEmployeesForOrganization() { return [candidate('e1', 'u1'), candidate('e2', 'u2')]; },
    async listActiveEmployeesForCompany() { return [candidate('e1', 'u1')]; },
    async listActiveEmployeesForDepartment() { return [candidate('e2', 'u2')]; },
    async listActiveEmployeesForGroup(id) { return id === 'foreign' ? [{ ...candidate('e9', 'u9'), tenantId: 't2', organizationId: 'o2' }] : [candidate('e1', 'u1'), candidate('e3', null)]; },
    async getActiveEmployee(id) { return id === 'e3' ? candidate('e3', null) : null; },
  };
}

describe('TrainingAudienceResolver', () => {
  it('deduplicates overlapping mixed targets and reports unlinked employees', async () => {
    const resolver = new TrainingAudienceResolver(repository());
    const targets: TrainingAudienceTarget[] = [
      { type: 'ORGANIZATION', id: 'o1' },
      { type: 'COMPANY', id: 'c1' },
      { type: 'GROUP', id: 'g1' },
      { type: 'EMPLOYEE', id: 'e3' },
    ];
    const preview = await resolver.preview({ tenantId: 't1', organizationId: 'o1', targets });
    expect(preview.expandedCandidateCount).toBe(6);
    expect(preview.uniqueEmployeeCount).toBe(3);
    expect(preview.overlapCount).toBe(3);
    expect(preview.assignableLearnerCount).toBe(2);
    expect(preview.unlinkedEmployeeIds).toEqual(['e3']);
    expect(preview.members.map((member) => member.employeeId)).toEqual(['e1', 'e2', 'e3']);
  });

  it('produces the same fingerprint regardless of target input order', async () => {
    const resolver = new TrainingAudienceResolver(repository());
    const a = await resolver.preview({ tenantId: 't1', organizationId: 'o1', targets: [{ type: 'GROUP', id: 'g1' }, { type: 'COMPANY', id: 'c1' }] });
    const b = await resolver.preview({ tenantId: 't1', organizationId: 'o1', targets: [{ type: 'COMPANY', id: 'c1' }, { type: 'GROUP', id: 'g1' }] });
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.members).toEqual(b.members);
  });

  it('fails closed for cross-tenant targets', async () => {
    const resolver = new TrainingAudienceResolver(repository());
    await expect(resolver.preview({ tenantId: 't1', organizationId: 'o1', targets: [{ type: 'GROUP', id: 'foreign' }] }))
      .rejects.toMatchObject({ code: 'CROSS_TENANT_REFERENCE' });
  });
});
