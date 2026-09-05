import { describe, expect, it } from 'vitest';
import {
  GroupMembershipInvariantError,
  GroupMembershipService,
  type DynamicGroupRuleEvaluator,
  type DynamicGroupRuleRecord,
  type GroupEmployeeRecord,
  type GroupMembershipAuditInput,
  type GroupMembershipRecord,
  type GroupMembershipRepository,
  type GroupMembershipTransactionManager,
  type GroupRecord,
  type MembershipSource,
} from './group-membership.js';

class MemoryGroupRepo implements GroupMembershipRepository {
  groups = new Map<string, GroupRecord>();
  employees = new Map<string, GroupEmployeeRecord>();
  memberships = new Map<string, GroupMembershipRecord>();
  rules = new Map<string, DynamicGroupRuleRecord>();
  audits: GroupMembershipAuditInput[] = [];
  nextId = 1;

  async getGroup(id: string) { return this.groups.get(id) ?? null; }
  async getEmployee(id: string) { return this.employees.get(id) ?? null; }
  async getActiveMembership(groupId: string, employeeId: string) {
    return [...this.memberships.values()].find((m) => m.groupId === groupId && m.employeeId === employeeId && m.validUntil === null) ?? null;
  }
  async listActiveMemberships(groupId: string) {
    return [...this.memberships.values()].filter((m) => m.groupId === groupId && m.validUntil === null);
  }
  async getActiveDynamicRule(groupId: string) { return this.rules.get(groupId) ?? null; }
  async createMembership(input: { tenantId: string; groupId: string; employeeId: string; source: MembershipSource; validFrom: Date }) {
    if (await this.getActiveMembership(input.groupId, input.employeeId)) throw new Error('duplicate active membership');
    const record: GroupMembershipRecord = { id: `m${this.nextId++}`, ...input, validUntil: null };
    this.memberships.set(record.id, record);
    return record;
  }
  async closeMembership(id: string, validUntil: Date) {
    const current = this.memberships.get(id)!;
    this.memberships.set(id, { ...current, validUntil });
  }
  async appendMembershipAudit(event: GroupMembershipAuditInput) { this.audits.push(event); }
}

class MemoryGroupTx implements GroupMembershipTransactionManager {
  constructor(readonly repo: MemoryGroupRepo) {}
  async transaction<T>(work: (repo: GroupMembershipRepository) => Promise<T>) { return work(this.repo); }
}

class StaticEvaluator implements DynamicGroupRuleEvaluator {
  constructor(public result: string[]) {}
  async evaluate() { return this.result; }
}

function fixture() {
  const repo = new MemoryGroupRepo();
  repo.groups.set('manual', { id: 'manual', tenantId: 't1', organizationId: 'o1', type: 'MANUAL', status: 'ACTIVE' });
  repo.groups.set('dynamic', { id: 'dynamic', tenantId: 't1', organizationId: 'o1', type: 'DYNAMIC', status: 'ACTIVE' });
  repo.groups.set('system', { id: 'system', tenantId: 't1', organizationId: 'o1', type: 'SYSTEM', status: 'ACTIVE' });
  for (const id of ['e1', 'e2', 'e3']) {
    repo.employees.set(id, { id, tenantId: 't1', organizationId: 'o1', status: 'ACTIVE' });
  }
  repo.rules.set('dynamic', { id: 'r1', tenantId: 't1', groupId: 'dynamic', version: 3, ruleJson: { department: 'IT' } });
  const evaluator = new StaticEvaluator([]);
  return { repo, evaluator, service: new GroupMembershipService(new MemoryGroupTx(repo), evaluator) };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

describe('GroupMembershipService', () => {
  it('adds a manual membership and prevents duplicate active membership', async () => {
    const { repo, service } = fixture();
    const at = new Date('2026-09-05T10:00:00Z');
    await service.addManualMember({ tenantId: 't1', groupId: 'manual', employeeId: 'e1', effectiveAt: at });
    expect((await repo.getActiveMembership('manual', 'e1'))?.source).toBe('MANUAL');
    await expectCode(
      service.addManualMember({ tenantId: 't1', groupId: 'manual', employeeId: 'e1', effectiveAt: at }),
      'GROUP_MEMBERSHIP_ALREADY_ACTIVE',
    );
    expect(repo.audits.at(-1)?.action).toBe('GROUP_MEMBER_ADDED');
  });

  it('removes manually by closing valid_until and preserves history', async () => {
    const { repo, service } = fixture();
    const start = new Date('2026-09-01T00:00:00Z');
    const end = new Date('2026-09-05T00:00:00Z');
    const added = await service.addManualMember({ tenantId: 't1', groupId: 'manual', employeeId: 'e1', effectiveAt: start });
    await service.removeManualMember({ tenantId: 't1', groupId: 'manual', employeeId: 'e1', effectiveAt: end });
    expect(repo.memberships.get(added.membership.id)?.validUntil).toEqual(end);
    expect(repo.memberships.has(added.membership.id)).toBe(true);
    expect(repo.audits.at(-1)?.action).toBe('GROUP_MEMBER_REMOVED');
  });

  it('treats removing a missing manual membership as a no-op', async () => {
    const { repo, service } = fixture();
    const result = await service.removeManualMember({
      tenantId: 't1',
      groupId: 'manual',
      employeeId: 'e1',
      effectiveAt: new Date('2026-09-05T00:00:00Z'),
    });
    expect(result.changed).toBe(false);
    expect(repo.audits).toHaveLength(0);
  });

  it('blocks manual mutation of dynamic and system groups', async () => {
    const { service } = fixture();
    const at = new Date('2026-09-05T00:00:00Z');
    await expectCode(
      service.addManualMember({ tenantId: 't1', groupId: 'dynamic', employeeId: 'e1', effectiveAt: at }),
      'DYNAMIC_GROUP_MANUAL_MUTATION_FORBIDDEN',
    );
    await expectCode(
      service.addManualMember({ tenantId: 't1', groupId: 'system', employeeId: 'e1', effectiveAt: at }),
      'SYSTEM_GROUP_MANUAL_MUTATION_FORBIDDEN',
    );
  });

  it('reconciles dynamic membership deterministically and idempotently', async () => {
    const { repo, evaluator, service } = fixture();
    const previous = await repo.createMembership({
      tenantId: 't1', groupId: 'dynamic', employeeId: 'e1', source: 'RULE', validFrom: new Date('2026-09-01T00:00:00Z'),
    });
    evaluator.result = ['e3', 'e2', 'e2'];
    const at = new Date('2026-09-05T00:00:00Z');
    const first = await service.reconcileDynamicGroup({ tenantId: 't1', groupId: 'dynamic', effectiveAt: at });
    expect(first).toEqual({ changed: true, addedEmployeeIds: ['e2', 'e3'], removedEmployeeIds: ['e1'] });
    expect(repo.memberships.get(previous.id)?.validUntil).toEqual(at);
    expect((await repo.listActiveMemberships('dynamic')).map((m) => m.employeeId).sort()).toEqual(['e2', 'e3']);
    expect(repo.audits.at(-1)).toMatchObject({ action: 'DYNAMIC_GROUP_RECONCILED', after: { ruleVersion: 3 } });

    const auditCount = repo.audits.length;
    const second = await service.reconcileDynamicGroup({ tenantId: 't1', groupId: 'dynamic', effectiveAt: at });
    expect(second).toEqual({ changed: false, addedEmployeeIds: [], removedEmployeeIds: [] });
    expect(repo.audits).toHaveLength(auditCount);
  });

  it('rejects reconcile results outside the group organization', async () => {
    const { repo, evaluator, service } = fixture();
    repo.employees.set('foreign', { id: 'foreign', tenantId: 't1', organizationId: 'o2', status: 'ACTIVE' });
    evaluator.result = ['foreign'];
    await expectCode(
      service.reconcileDynamicGroup({ tenantId: 't1', groupId: 'dynamic', effectiveAt: new Date('2026-09-05T00:00:00Z') }),
      'GROUP_EMPLOYEE_ORGANIZATION_MISMATCH',
    );
  });
});
