import { boolean, index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './schema.js';

export const aiModels = pgTable('ai_models', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: text('provider').notNull(),
  providerModelName: text('provider_model_name').notNull(),
  status: text('status').notNull(),
  qualified: boolean('qualified').notNull().default(false),
  healthy: boolean('healthy').notNull().default(true),
  capabilities: jsonb('capabilities').notNull(),
  eligibleTiers: jsonb('eligible_tiers').notNull(),
  languages: jsonb('languages').notNull(),
  dataPolicies: jsonb('data_policies').notNull(),
  structuredOutputSupport: boolean('structured_output_support').notNull().default(false),
  qualityScore: real('quality_score').notNull().default(0),
  latencyP95Ms: integer('latency_p95_ms').notNull().default(0),
  inputCost: real('input_cost').notNull().default(0),
  outputCost: real('output_cost').notNull().default(0),
  qualificationVersion: text('qualification_version'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  providerModelUnique: uniqueIndex('ai_models_provider_model_uq').on(table.provider, table.providerModelName),
  statusIdx: index('ai_models_status_idx').on(table.status),
}));

export const aiPromptVersions = pgTable('ai_prompt_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  promptId: text('prompt_id').notNull(),
  version: integer('version').notNull(),
  capability: text('capability').notNull(),
  schemaVersion: text('schema_version').notNull(),
  template: text('template').notNull(),
  active: boolean('active').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  promptVersionUnique: uniqueIndex('ai_prompt_versions_prompt_version_uq').on(table.promptId, table.version),
  capabilityIdx: index('ai_prompt_versions_capability_idx').on(table.capability, table.active),
}));

export const aiExecutions = pgTable('ai_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  capability: text('capability').notNull(),
  promptId: text('prompt_id').notNull(),
  promptVersion: integer('prompt_version').notNull(),
  schemaVersion: text('schema_version').notNull(),
  modelId: uuid('model_id').notNull().references(() => aiModels.id),
  provider: text('provider').notNull(),
  status: text('status').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  latencyMs: integer('latency_ms').notNull().default(0),
  estimatedCost: real('estimated_cost').notNull().default(0),
  failureKind: text('failure_kind'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCreatedIdx: index('ai_executions_tenant_created_idx').on(table.tenantId, table.createdAt),
  capabilityIdx: index('ai_executions_capability_idx').on(table.capability, table.createdAt),
}));
