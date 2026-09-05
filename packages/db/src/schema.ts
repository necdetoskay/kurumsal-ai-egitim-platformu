import { boolean, index, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const systemMetadata = pgTable('system_metadata', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugUnique: uniqueIndex('tenants_slug_uq').on(table.slug),
}));

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  externalSubject: text('external_subject'),
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  externalSubjectUnique: uniqueIndex('users_external_subject_uq').on(table.externalSubject),
}));

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantUserUnique: uniqueIndex('memberships_tenant_user_uq').on(table.tenantId, table.userId),
  tenantStatusIdx: index('memberships_tenant_status_idx').on(table.tenantId, table.status),
}));

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  code: text('code').notNull(),
  name: text('name').notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: uniqueIndex('roles_tenant_code_uq').on(table.tenantId, table.code),
}));

export const permissions = pgTable('permissions', {
  code: text('code').primaryKey(),
  description: text('description'),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id),
  permissionCode: text('permission_code').notNull().references(() => permissions.code),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionCode] }),
}));

export const userRoles = pgTable('user_roles', {
  membershipId: uuid('membership_id').notNull().references(() => memberships.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.membershipId, table.roleId] }),
}));

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  correlationId: text('correlation_id'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantOccurredIdx: index('audit_events_tenant_occurred_idx').on(table.tenantId, table.occurredAt),
  actorIdx: index('audit_events_actor_idx').on(table.actorUserId, table.occurredAt),
}));

export * from './organization-schema.js';
export * from './employee-schema.js';
export * from './organization-governance-schema.js';
export * from './training-schema.js';
export * from './assessment-schema.js';
export * from './learning-schema.js';
export * from './ingestion-schema.js';
export * from './ai-runtime-schema.js';
export * from './agent-runtime-schema.js';
export * from './authoring-schema.js';
export * from './question-quality-schema.js';
export * from './benchmark-schema.js';
