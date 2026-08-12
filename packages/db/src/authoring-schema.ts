import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './schema.js';

export const authoringRuns = pgTable('authoring_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  trainingId: uuid('training_id').notNull(),
  status: text('status').notNull(),
  schemaVersion: text('schema_version').notNull(),
  promptId: text('prompt_id').notNull(),
  promptVersion: text('prompt_version').notNull(),
  modelId: text('model_id').notNull(),
  inputSnapshotHash: text('input_snapshot_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantTrainingIdx: index('authoring_runs_tenant_training_idx').on(table.tenantId, table.trainingId),
  reproducibleRunUq: uniqueIndex('authoring_runs_reproducible_uq').on(table.tenantId, table.trainingId, table.inputSnapshotHash, table.promptId, table.promptVersion, table.modelId, table.schemaVersion),
}));

export const authoringCandidates = pgTable('authoring_candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  runId: uuid('run_id').notNull().references(() => authoringRuns.id),
  trainingId: uuid('training_id').notNull(),
  kind: text('kind').notNull(),
  text: text('text').notNull(),
  evidenceRefs: jsonb('evidence_refs').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantRunIdx: index('authoring_candidates_tenant_run_idx').on(table.tenantId, table.runId),
}));
