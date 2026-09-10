import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { roles, tenants, users } from './schema.js';
import { employees } from './employee-schema.js';
import { companies, departments, organizations } from './organization-schema.js';

export const organizationGroupType = pgEnum('organization_group_type', ['MANUAL', 'DYNAMIC', 'SYSTEM']);
export const organizationGroupStatus = pgEnum('organization_group_status', ['ACTIVE', 'PASSIVE']);
export const groupMembershipSource = pgEnum('group_membership_source', ['MANUAL', 'RULE', 'SYSTEM']);
export const externalIdentityProvider = pgEnum('external_identity_provider', [
  'MANUAL',
  'CSV',
  'LDAP',
  'ACTIVE_DIRECTORY',
  'HR_API',
  'ERP',
]);
export const roleScopeType = pgEnum('role_scope_type', ['TENANT', 'ORGANIZATION', 'COMPANY', 'DEPARTMENT']);

export const groups = pgTable(
  'groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id').notNull(),
    name: varchar('name', { length: 180 }).notNull(),
    code: varchar('code', { length: 60 }).notNull(),
    type: organizationGroupType('type').notNull(),
    status: organizationGroupStatus('status').default('ACTIVE').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    organizationScopeFk: foreignKey({
      name: 'groups_tenant_organization_fk',
      columns: [table.tenantId, table.organizationId],
      foreignColumns: [organizations.tenantId, organizations.id],
    }).onDelete('restrict'),
    tenantIdIdUq: unique('groups_tenant_id_id_uq').on(table.tenantId, table.id),
    tenantOrgCodeUq: uniqueIndex('groups_tenant_org_code_uq').on(table.tenantId, table.organizationId, table.code),
    tenantOrgStatusTypeIdx: index('groups_tenant_org_status_type_idx').on(
      table.tenantId,
      table.organizationId,
      table.status,
      table.type,
    ),
  }),
);

export const groupMemberships = pgTable(
  'group_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    groupId: uuid('group_id').notNull(),
    employeeId: uuid('employee_id').notNull(),
    source: groupMembershipSource('source').notNull(),
    validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow().notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    groupScopeFk: foreignKey({
      name: 'group_memberships_tenant_group_fk',
      columns: [table.tenantId, table.groupId],
      foreignColumns: [groups.tenantId, groups.id],
    }).onDelete('restrict'),
    employeeScopeFk: foreignKey({
      name: 'group_memberships_tenant_employee_fk',
      columns: [table.tenantId, table.employeeId],
      foreignColumns: [employees.tenantId, employees.id],
    }).onDelete('restrict'),
    validRangeCk: check(
      'group_memberships_valid_range_ck',
      sql`${table.validUntil} is null or ${table.validUntil} >= ${table.validFrom}`,
    ),
    activeMemberUq: uniqueIndex('group_memberships_active_member_uq')
      .on(table.tenantId, table.groupId, table.employeeId)
      .where(sql`${table.validUntil} is null`),
    groupHistoryIdx: index('group_memberships_group_history_idx').on(
      table.tenantId,
      table.groupId,
      table.validFrom,
    ),
    employeeHistoryIdx: index('group_memberships_employee_history_idx').on(
      table.tenantId,
      table.employeeId,
      table.validFrom,
    ),
  }),
);

export const dynamicGroupRules = pgTable(
  'dynamic_group_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    groupId: uuid('group_id').notNull(),
    version: integer('version').notNull(),
    ruleJson: jsonb('rule_json').notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    supersededAt: timestamp('superseded_at', { withTimezone: true }),
  },
  (table) => ({
    groupScopeFk: foreignKey({
      name: 'dynamic_group_rules_tenant_group_fk',
      columns: [table.tenantId, table.groupId],
      foreignColumns: [groups.tenantId, groups.id],
    }).onDelete('restrict'),
    groupVersionUq: uniqueIndex('dynamic_group_rules_group_version_uq').on(table.tenantId, table.groupId, table.version),
    activeRuleUq: uniqueIndex('dynamic_group_rules_active_rule_uq')
      .on(table.tenantId, table.groupId)
      .where(sql`${table.supersededAt} is null`),
    groupCreatedIdx: index('dynamic_group_rules_group_created_idx').on(table.tenantId, table.groupId, table.createdAt),
  }),
);

export const employeeExternalIdentities = pgTable(
  'employee_external_identities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    employeeId: uuid('employee_id').notNull(),
    provider: externalIdentityProvider('provider').notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    sourceMetadata: jsonb('source_metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    employeeScopeFk: foreignKey({
      name: 'employee_external_identities_tenant_employee_fk',
      columns: [table.tenantId, table.employeeId],
      foreignColumns: [employees.tenantId, employees.id],
    }).onDelete('restrict'),
    providerExternalUq: uniqueIndex('employee_external_identities_provider_external_uq').on(
      table.tenantId,
      table.provider,
      table.externalId,
    ),
    employeeProviderIdx: index('employee_external_identities_employee_provider_idx').on(
      table.tenantId,
      table.employeeId,
      table.provider,
    ),
  }),
);

export const userRoleAssignments = pgTable(
  'user_role_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
    scopeType: roleScopeType('scope_type').notNull(),
    organizationId: uuid('organization_id'),
    companyId: uuid('company_id'),
    departmentId: uuid('department_id'),
    validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow().notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    organizationScopeFk: foreignKey({
      name: 'user_role_assignments_tenant_organization_fk',
      columns: [table.tenantId, table.organizationId],
      foreignColumns: [organizations.tenantId, organizations.id],
    }).onDelete('restrict'),
    companyScopeFk: foreignKey({
      name: 'user_role_assignments_tenant_company_fk',
      columns: [table.tenantId, table.companyId],
      foreignColumns: [companies.tenantId, companies.id],
    }).onDelete('restrict'),
    departmentScopeFk: foreignKey({
      name: 'user_role_assignments_tenant_department_fk',
      columns: [table.tenantId, table.departmentId],
      foreignColumns: [departments.tenantId, departments.id],
    }).onDelete('restrict'),
    validRangeCk: check(
      'user_role_assignments_valid_range_ck',
      sql`${table.validUntil} is null or ${table.validUntil} >= ${table.validFrom}`,
    ),
    scopeShapeCk: check(
      'user_role_assignments_scope_shape_ck',
      sql`(
        (${table.scopeType} = 'TENANT' and ${table.organizationId} is null and ${table.companyId} is null and ${table.departmentId} is null) or
        (${table.scopeType} = 'ORGANIZATION' and ${table.organizationId} is not null and ${table.companyId} is null and ${table.departmentId} is null) or
        (${table.scopeType} = 'COMPANY' and ${table.organizationId} is null and ${table.companyId} is not null and ${table.departmentId} is null) or
        (${table.scopeType} = 'DEPARTMENT' and ${table.organizationId} is null and ${table.companyId} is null and ${table.departmentId} is not null)
      )`,
    ),
    activeAssignmentUq: uniqueIndex('user_role_assignments_active_uq')
      .on(
        table.tenantId,
        table.userId,
        table.roleId,
        table.scopeType,
        table.organizationId,
        table.companyId,
        table.departmentId,
      )
      .where(sql`${table.validUntil} is null`),
    userScopeIdx: index('user_role_assignments_user_scope_idx').on(table.tenantId, table.userId, table.scopeType),
  }),
);

export const organizationAuditEvents = pgTable(
  'organization_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'restrict' }),
    action: varchar('action', { length: 120 }).notNull(),
    entityType: varchar('entity_type', { length: 120 }).notNull(),
    entityId: uuid('entity_id'),
    scopeType: varchar('scope_type', { length: 40 }),
    scopeId: uuid('scope_id'),
    beforeJson: jsonb('before_json'),
    afterJson: jsonb('after_json'),
    correlationId: varchar('correlation_id', { length: 120 }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantOccurredIdx: index('organization_audit_events_tenant_occurred_idx').on(table.tenantId, table.occurredAt),
    entityIdx: index('organization_audit_events_entity_idx').on(table.tenantId, table.entityType, table.entityId, table.occurredAt),
    actorIdx: index('organization_audit_events_actor_idx').on(table.tenantId, table.actorUserId, table.occurredAt),
    correlationIdx: index('organization_audit_events_correlation_idx').on(table.tenantId, table.correlationId),
  }),
);
