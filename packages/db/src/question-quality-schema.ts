import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './schema.js';

export const questionGenerationRuns = pgTable('question_generation_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  trainingId: uuid('training_id').notNull(),
  inputSnapshotId: text('input_snapshot_id').notNull(),
  promptVersion: text('prompt_version').notNull(),
  modelId: text('model_id').notNull(),
  schemaVersion: text('schema_version').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCreatedIdx: index('question_generation_runs_tenant_created_idx').on(table.tenantId, table.createdAt),
}));

export const questionCandidates = pgTable('question_candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  runId: uuid('run_id').notNull().references(() => questionGenerationRuns.id),
  trainingId: uuid('training_id').notNull(),
  prompt: text('prompt').notNull(),
  optionsJson: text('options_json').notNull(),
  correctOptionIndex: integer('correct_option_index').notNull(),
  evidenceRefsJson: text('evidence_refs_json').notNull(),
  repairAttempt: integer('repair_attempt').notNull().default(0),
  status: text('status').notNull(),
  evaluatorRunId: text('evaluator_run_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantRunIdx: index('question_candidates_tenant_run_idx').on(table.tenantId, table.runId),
}));

export const questionQualityFindings = pgTable('question_quality_findings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  candidateId: uuid('candidate_id').notNull().references(() => questionCandidates.id),
  code: text('code').notNull(),
  detail: text('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  candidateIdx: index('question_quality_findings_candidate_idx').on(table.tenantId, table.candidateId),
}));
