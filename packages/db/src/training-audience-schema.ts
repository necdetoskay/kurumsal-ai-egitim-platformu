import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenants, users } from './schema.js';
import { trainingVersions } from './training-schema.js';
import { organizations, companies, departments } from './organization-schema.js';
import { groups } from './organization-governance-schema.js';
import { employees } from './employee-schema.js';

export const trainingAudienceType = pgEnum('training_audience_type', ['ORGANIZATION', 'COMPANY', 'DEPARTMENT', 'GROUP', 'EMPLOYEE']);
export const trainingAudienceResolutionStatus = pgEnum('training_audience_resolution_status', ['PREVIEW', 'CONFIRMED']);

export const trainingAssignmentAudiences = pgTable('training_assignment_audiences', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  trainingId: uuid('training_id').notNull(),
  trainingVersionId: uuid('training_version_id').notNull(),
  targetType: trainingAudienceType('target_type').notNull(),
  organizationId: uuid('organization_id'),
  companyId: uuid('company_id'),
  departmentId: uuid('department_id'),
  groupId: uuid('group_id'),
  employeeId: uuid('employee_id'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  trainingVersionScopeFk: foreignKey({
    name: 'training_audiences_tenant_training_version_fk',
    columns: [table.tenantId, table.trainingId, table.trainingVersionId],
    foreignColumns: [trainingVersions.tenantId, trainingVersions.trainingId, trainingVersions.id],
  }).onDelete('restrict'),
  organizationFk: foreignKey({ name: 'training_audiences_tenant_org_fk', columns: [table.tenantId, table.organizationId], foreignColumns: [organizations.tenantId, organizations.id] }).onDelete('restrict'),
  companyFk: foreignKey({ name: 'training_audiences_tenant_company_fk', columns: [table.tenantId, table.companyId], foreignColumns: [companies.tenantId, companies.id] }).onDelete('restrict'),
  departmentFk: foreignKey({ name: 'training_audiences_tenant_department_fk', columns: [table.tenantId, table.departmentId], foreignColumns: [departments.tenantId, departments.id] }).onDelete('restrict'),
  groupFk: foreignKey({ name: 'training_audiences_tenant_group_fk', columns: [table.tenantId, table.groupId], foreignColumns: [groups.tenantId, groups.id] }).onDelete('restrict'),
  employeeFk: foreignKey({ name: 'training_audiences_tenant_employee_fk', columns: [table.tenantId, table.employeeId], foreignColumns: [employees.tenantId, employees.id] }).onDelete('restrict'),
  targetShape: check('training_assignment_audiences_target_shape_ck', sql`(
    (${table.targetType} = 'ORGANIZATION' and ${table.organizationId} is not null and ${table.companyId} is null and ${table.departmentId} is null and ${table.groupId} is null and ${table.employeeId} is null) or
    (${table.targetType} = 'COMPANY' and ${table.organizationId} is null and ${table.companyId} is not null and ${table.departmentId} is null and ${table.groupId} is null and ${table.employeeId} is null) or
    (${table.targetType} = 'DEPARTMENT' and ${table.organizationId} is null and ${table.companyId} is null and ${table.departmentId} is not null and ${table.groupId} is null and ${table.employeeId} is null) or
    (${table.targetType} = 'GROUP' and ${table.organizationId} is null and ${table.companyId} is null and ${table.departmentId} is null and ${table.groupId} is not null and ${table.employeeId} is null) or
    (${table.targetType} = 'EMPLOYEE' and ${table.organizationId} is null and ${table.companyId} is null and ${table.departmentId} is null and ${table.groupId} is null and ${table.employeeId} is not null)
  )`),
  trainingIdx: index('training_assignment_audiences_training_idx').on(table.tenantId, table.trainingVersionId, table.createdAt),
}));

export const trainingAudienceResolutions = pgTable('training_audience_resolutions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  trainingId: uuid('training_id').notNull(),
  trainingVersionId: uuid('training_version_id').notNull(),
  status: trainingAudienceResolutionStatus('status').notNull(),
  fingerprint: text('fingerprint').notNull(),
  targetCount: integer('target_count').notNull(),
  overlapCount: integer('overlap_count').notNull(),
  uniqueEmployeeCount: integer('unique_employee_count').notNull(),
  assignableLearnerCount: integer('assignable_learner_count').notNull(),
  correlationId: text('correlation_id'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  trainingVersionScopeFk: foreignKey({
    name: 'training_audience_resolutions_tenant_training_version_fk',
    columns: [table.tenantId, table.trainingId, table.trainingVersionId],
    foreignColumns: [trainingVersions.tenantId, trainingVersions.trainingId, trainingVersions.id],
  }).onDelete('restrict'),
  tenantIdIdUq: unique('training_audience_resolutions_tenant_id_id_uq').on(table.tenantId, table.id),
  fingerprintUq: uniqueIndex('training_audience_resolutions_fingerprint_uq').on(table.tenantId, table.trainingVersionId, table.fingerprint),
  trainingCreatedIdx: index('training_audience_resolutions_training_created_idx').on(table.tenantId, table.trainingVersionId, table.createdAt),
}));

export const trainingAudienceResolutionMembers = pgTable('training_audience_resolution_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  resolutionId: uuid('resolution_id').notNull(),
  employeeId: uuid('employee_id').notNull(),
  learnerUserId: uuid('learner_user_id').references(() => users.id, { onDelete: 'restrict' }),
  sourceAudienceIds: jsonb('source_audience_ids').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  resolutionFk: foreignKey({
    name: 'training_audience_members_tenant_resolution_fk',
    columns: [table.tenantId, table.resolutionId],
    foreignColumns: [trainingAudienceResolutions.tenantId, trainingAudienceResolutions.id],
  }).onDelete('restrict'),
  employeeFk: foreignKey({ name: 'training_audience_members_tenant_employee_fk', columns: [table.tenantId, table.employeeId], foreignColumns: [employees.tenantId, employees.id] }).onDelete('restrict'),
  resolutionEmployeeUq: uniqueIndex('training_audience_members_resolution_employee_uq').on(table.tenantId, table.resolutionId, table.employeeId),
  resolutionIdx: index('training_audience_members_resolution_idx').on(table.tenantId, table.resolutionId),
}));
