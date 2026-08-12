import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenants, users } from './schema.js';

export const agentExecutions = pgTable('agent_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  agentId: text('agent_id').notNull(),
  capability: text('capability').notNull(),
  correlationId: text('correlation_id').notNull(),
  parentRunId: uuid('parent_run_id'),
  status: text('status').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  tenantCorrelationIdx: index('agent_executions_tenant_correlation_idx').on(table.tenantId, table.correlationId),
}));

export const agentToolCalls = pgTable('agent_tool_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  executionId: uuid('execution_id').notNull().references(() => agentExecutions.id),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  agentId: text('agent_id').notNull(),
  tool: text('tool').notNull(),
  outcome: text('outcome').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  executionIdx: index('agent_tool_calls_execution_idx').on(table.executionId, table.occurredAt),
}));

export const agentDerivedMemory = pgTable('agent_derived_memory', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  recordType: text('record_type').notNull(),
  evidenceRefs: jsonb('evidence_refs').notNull(),
  sourceVersions: jsonb('source_versions').notNull(),
  promptVersion: text('prompt_version').notNull(),
  modelId: text('model_id').notNull(),
  provider: text('provider').notNull(),
  generationRunId: text('generation_run_id').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantTypeIdx: index('agent_derived_memory_tenant_type_idx').on(table.tenantId, table.recordType, table.createdAt),
}));
