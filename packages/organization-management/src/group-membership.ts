export type GroupType = 'MANUAL' | 'DYNAMIC' | 'SYSTEM';
export type GroupStatus = 'ACTIVE' | 'PASSIVE';
export type MembershipSource = 'MANUAL' | 'RULE' | 'SYSTEM';

export interface GroupRecord {
  id: string;
  tenantId: string;
  organizationId: string;
  type: GroupType;
  status: GroupStatus;
}

export interface GroupEmployeeRecord {
  id: string;
  tenantId: string;
  organizationId: string;
  status: 'ACTIVE' | 'PASSIVE' | 'TERMINATED';
}

export interface GroupMembershipRecord {
  id: string;
  tenantId: string;
  groupId: string;
  employeeId: string;
  source: MembershipSource;
  validFrom: Date;
  validUntil: Date | null;
}

export interface DynamicGroupRuleRecord {
  id: string;
  tenantId: string;
  groupId: string;
  version: number;
  ruleJson: unknown;
}

export interface GroupMembershipAuditInput {
  tenantId: string;
  actorUserId?: string;
  action: 'GROUP_MEMBER_ADDED' | 'GROUP_MEMBER_REMOVED' | 'DYNAMIC_GROUP_RECONCILED';
  groupId: string;
  employeeId?: string;
  before?: unknown;
  after?: unknown;
  correlationId?: string;
}

export interface GroupMembershipRepository {
  getGroup(id: string): Promise<GroupRecord | null>;
  getEmployee(id: string): Promise<GroupEmployeeRecord | null>;
  getActiveMembership(groupId: string, employeeId: string): Promise<GroupMembershipRecord | null>;
  listActiveMemberships(groupId: string): Promise<GroupMembershipRecord[]>;
  getActiveDynamicRule(groupId: string): Promise<DynamicGroupRuleRecord | null>;
  createMembership(input: {
    tenantId: string;
    groupId: string;
    employeeId: string;
    source: MembershipSource;
    validFrom: Date;
  }): Promise<GroupMembershipRecord>;
  closeMembership(id: string, validUntil: Date): Promise<void>;
  appendMembershipAudit(event: GroupMembershipAuditInput): Promise<void>;
}

export interface GroupMembershipTransactionManager {
  transaction<T>(work: (repo: GroupMembershipRepository) => Promise<T>): Promise<T>;
}

export interface DynamicGroupRuleEvaluator {
  evaluate(input: {
    tenantId: string;
    organizationId: string;
    groupId: string;
    ruleVersion: number;
    ruleJson: unknown;
  }): Promise<string[]>;
}

export class GroupMembershipInvariantError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'GroupMembershipInvariantError';
  }
}

function requireRecord<T>(value: T | null, code: string, message: string): T {
  if (!value) throw new GroupMembershipInvariantError(code, message);
  return value;
}

function ensureTenant(expected: string, actual: string) {
  if (expected !== actual) {
    throw new GroupMembershipInvariantError('TENANT_SCOPE_MISMATCH', 'Entity belongs to a different tenant.');
  }
}

function ensureActiveGroup(group: GroupRecord) {
  if (group.status !== 'ACTIVE') {
    throw new GroupMembershipInvariantError('GROUP_NOT_ACTIVE', 'Group must be active for membership mutation.');
  }
}

function ensureEmployeeScope(group: GroupRecord, employee: GroupEmployeeRecord) {
  ensureTenant(group.tenantId, employee.tenantId);
  if (employee.organizationId !== group.organizationId) {
    throw new GroupMembershipInvariantError(
      'GROUP_EMPLOYEE_ORGANIZATION_MISMATCH',
      'Employee must belong to the same organization as the group.',
    );
  }
  if (employee.status !== 'ACTIVE') {
    throw new GroupMembershipInvariantError('GROUP_EMPLOYEE_NOT_ACTIVE', 'Employee must be active for group membership.');
  }
}

function ensureManualGroup(group: GroupRecord) {
  if (group.type === 'SYSTEM') {
    throw new GroupMembershipInvariantError('SYSTEM_GROUP_MANUAL_MUTATION_FORBIDDEN', 'System group membership is system-managed.');
  }
  if (group.type !== 'MANUAL') {
    throw new GroupMembershipInvariantError('DYNAMIC_GROUP_MANUAL_MUTATION_FORBIDDEN', 'Dynamic group membership is rule-managed.');
  }
}

function ensureValidCloseDate(membership: GroupMembershipRecord, validUntil: Date) {
  if (validUntil.getTime() < membership.validFrom.getTime()) {
    throw new GroupMembershipInvariantError('MEMBERSHIP_INVALID_EFFECTIVE_DATE', 'Membership cannot close before valid_from.');
  }
}

function normalizeEmployeeIds(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

function optionalAuditFields(input: { actorUserId?: string; correlationId?: string }) {
  return {
    ...(input.actorUserId !== undefined ? { actorUserId: input.actorUserId } : {}),
    ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
  };
}

export class GroupMembershipService {
  constructor(
    private readonly tx: GroupMembershipTransactionManager,
    private readonly evaluator: DynamicGroupRuleEvaluator,
  ) {}

  async addManualMember(input: {
    tenantId: string;
    groupId: string;
    employeeId: string;
    effectiveAt: Date;
    actorUserId?: string;
    correlationId?: string;
  }) {
    return this.tx.transaction(async (repo) => {
      const group = requireRecord(await repo.getGroup(input.groupId), 'GROUP_NOT_FOUND', 'Group not found.');
      ensureTenant(input.tenantId, group.tenantId);
      ensureActiveGroup(group);
      ensureManualGroup(group);

      const employee = requireRecord(await repo.getEmployee(input.employeeId), 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
      ensureEmployeeScope(group, employee);

      if (await repo.getActiveMembership(group.id, employee.id)) {
        throw new GroupMembershipInvariantError('GROUP_MEMBERSHIP_ALREADY_ACTIVE', 'Employee already has an active membership.');
      }

      const membership = await repo.createMembership({
        tenantId: input.tenantId,
        groupId: group.id,
        employeeId: employee.id,
        source: 'MANUAL',
        validFrom: input.effectiveAt,
      });
      await repo.appendMembershipAudit({
        tenantId: input.tenantId,
        action: 'GROUP_MEMBER_ADDED',
        groupId: group.id,
        employeeId: employee.id,
        after: { membershipId: membership.id, source: membership.source, validFrom: membership.validFrom.toISOString() },
        ...optionalAuditFields(input),
      });
      return { changed: true as const, membership };
    });
  }

  async removeManualMember(input: {
    tenantId: string;
    groupId: string;
    employeeId: string;
    effectiveAt: Date;
    actorUserId?: string;
    correlationId?: string;
  }) {
    return this.tx.transaction(async (repo) => {
      const group = requireRecord(await repo.getGroup(input.groupId), 'GROUP_NOT_FOUND', 'Group not found.');
      ensureTenant(input.tenantId, group.tenantId);
      ensureActiveGroup(group);
      ensureManualGroup(group);

      const membership = await repo.getActiveMembership(group.id, input.employeeId);
      if (!membership) return { changed: false as const };
      if (membership.source !== 'MANUAL') {
        throw new GroupMembershipInvariantError('GROUP_MEMBERSHIP_SOURCE_PROTECTED', 'Membership is not manually managed.');
      }
      ensureValidCloseDate(membership, input.effectiveAt);

      await repo.closeMembership(membership.id, input.effectiveAt);
      await repo.appendMembershipAudit({
        tenantId: input.tenantId,
        action: 'GROUP_MEMBER_REMOVED',
        groupId: group.id,
        employeeId: input.employeeId,
        before: { membershipId: membership.id, source: membership.source, validFrom: membership.validFrom.toISOString() },
        after: { validUntil: input.effectiveAt.toISOString() },
        ...optionalAuditFields(input),
      });
      return { changed: true as const };
    });
  }

  async reconcileDynamicGroup(input: {
    tenantId: string;
    groupId: string;
    effectiveAt: Date;
    actorUserId?: string;
    correlationId?: string;
  }) {
    return this.tx.transaction(async (repo) => {
      const group = requireRecord(await repo.getGroup(input.groupId), 'GROUP_NOT_FOUND', 'Group not found.');
      ensureTenant(input.tenantId, group.tenantId);
      ensureActiveGroup(group);
      if (group.type === 'SYSTEM') {
        throw new GroupMembershipInvariantError('SYSTEM_GROUP_RECONCILE_FORBIDDEN', 'System group membership is system-managed.');
      }
      if (group.type !== 'DYNAMIC') {
        throw new GroupMembershipInvariantError('GROUP_NOT_DYNAMIC', 'Only dynamic groups can be reconciled.');
      }

      const rule = requireRecord(
        await repo.getActiveDynamicRule(group.id),
        'DYNAMIC_GROUP_RULE_NOT_FOUND',
        'Dynamic group has no active rule.',
      );
      ensureTenant(input.tenantId, rule.tenantId);

      const evaluatedIds = normalizeEmployeeIds(await this.evaluator.evaluate({
        tenantId: input.tenantId,
        organizationId: group.organizationId,
        groupId: group.id,
        ruleVersion: rule.version,
        ruleJson: rule.ruleJson,
      }));

      for (const employeeId of evaluatedIds) {
        const employee = requireRecord(await repo.getEmployee(employeeId), 'EMPLOYEE_NOT_FOUND', `Employee ${employeeId} not found.`);
        ensureEmployeeScope(group, employee);
      }

      const activeMemberships = await repo.listActiveMemberships(group.id);
      for (const membership of activeMemberships) {
        ensureTenant(input.tenantId, membership.tenantId);
        if (membership.source !== 'RULE') {
          throw new GroupMembershipInvariantError(
            'DYNAMIC_GROUP_MEMBERSHIP_SOURCE_CONFLICT',
            'Dynamic group contains a non-rule-managed active membership.',
          );
        }
      }

      const currentIds = new Set(activeMemberships.map((membership) => membership.employeeId));
      const desiredIds = new Set(evaluatedIds);
      const toAdd = evaluatedIds.filter((employeeId) => !currentIds.has(employeeId));
      const toRemove = activeMemberships
        .filter((membership) => !desiredIds.has(membership.employeeId))
        .sort((a, b) => a.employeeId.localeCompare(b.employeeId));

      for (const membership of toRemove) {
        ensureValidCloseDate(membership, input.effectiveAt);
        await repo.closeMembership(membership.id, input.effectiveAt);
      }
      for (const employeeId of toAdd) {
        await repo.createMembership({
          tenantId: input.tenantId,
          groupId: group.id,
          employeeId,
          source: 'RULE',
          validFrom: input.effectiveAt,
        });
      }

      if (toAdd.length === 0 && toRemove.length === 0) {
        return { changed: false as const, addedEmployeeIds: [], removedEmployeeIds: [] };
      }

      const removedEmployeeIds = toRemove.map((membership) => membership.employeeId);
      await repo.appendMembershipAudit({
        tenantId: input.tenantId,
        action: 'DYNAMIC_GROUP_RECONCILED',
        groupId: group.id,
        before: { activeEmployeeIds: normalizeEmployeeIds([...currentIds]) },
        after: {
          activeEmployeeIds: evaluatedIds,
          addedEmployeeIds: toAdd,
          removedEmployeeIds,
          ruleVersion: rule.version,
        },
        ...optionalAuditFields(input),
      });

      return { changed: true as const, addedEmployeeIds: toAdd, removedEmployeeIds };
    });
  }
}
