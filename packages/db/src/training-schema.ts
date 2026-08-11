import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './schema.js';

export const trainings = pgTable('trainings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('DRAFT'),
  revision: integer('revision').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantStatusIdx: index('trainings_tenant_status_idx').on(table.tenantId, table.status),
}));

export const learningObjectives = pgTable('learning_objectives', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  trainingId: uuid('training_id').notNull().references(() => trainings.id),
  statement: text('statement').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantTrainingIdx: index('learning_objectives_tenant_training_idx').on(table.tenantId, table.trainingId),
}));

export const trainingModules = pgTable('training_modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  trainingId: uuid('training_id').notNull().references(() => trainings.id),
  title: text('title').notNull(),
  position: integer('position').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantTrainingPositionUnique: uniqueIndex('training_modules_tenant_training_position_uq').on(table.tenantId, table.trainingId, table.position),
}));

export const trainingVersions = pgTable('training_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  trainingId: uuid('training_id').notNull().references(() => trainings.id),
  version: integer('version').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
}, (table) => ({
  tenantTrainingVersionUnique: uniqueIndex('training_versions_tenant_training_version_uq').on(table.tenantId, table.trainingId, table.version),
}));

export const commandIdempotency = pgTable('command_idempotency', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  operation: text('operation').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  resourceId: text('resource_id').notNull(),
  resultRef: text('result_ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantOperationKeyUnique: uniqueIndex('command_idempotency_tenant_operation_key_uq').on(table.tenantId, table.operation, table.idempotencyKey),
}));

export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  correlationId: text('correlation_id'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
}, (table) => ({
  unpublishedIdx: index('outbox_events_unpublished_idx').on(table.tenantId, table.publishedAt, table.occurredAt),
}));
