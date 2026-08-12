import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './schema.js';

export const goldenDatasets = pgTable('golden_datasets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  capability: text('capability').notNull(),
  version: text('version').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  capabilityVersionIdx: index('golden_datasets_capability_version_idx').on(table.capability, table.version),
}));

export const goldenCases = pgTable('golden_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  datasetId: uuid('dataset_id').notNull().references(() => goldenDatasets.id),
  caseId: text('case_id').notNull(),
  split: text('split').notNull(),
  inputSnapshotId: text('input_snapshot_id').notNull(),
  expectedBehavior: text('expected_behavior').notNull(),
  hardGateExpectationsJson: text('hard_gate_expectations_json').notNull(),
  provenance: text('provenance').notNull(),
  groundTruthSource: text('ground_truth_source').notNull(),
  approvedBy: text('approved_by'),
}, (table) => ({
  datasetSplitIdx: index('golden_cases_dataset_split_idx').on(table.datasetId, table.split),
}));

export const benchmarkRuns = pgTable('benchmark_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  datasetId: uuid('dataset_id').notNull().references(() => goldenDatasets.id),
  datasetVersion: text('dataset_version').notNull(),
  split: text('split').notNull(),
  candidateId: text('candidate_id').notNull(),
  modelId: text('model_id').notNull(),
  promptVersion: text('prompt_version').notNull(),
  schemaVersion: text('schema_version').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  datasetCreatedIdx: index('benchmark_runs_dataset_created_idx').on(table.datasetId, table.createdAt),
}));

export const benchmarkCaseResults = pgTable('benchmark_case_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => benchmarkRuns.id),
  caseId: text('case_id').notNull(),
  correctnessBasisPoints: integer('correctness_basis_points').notNull(),
  groundingBasisPoints: integer('grounding_basis_points').notNull(),
  structuredOutputBasisPoints: integer('structured_output_basis_points').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  costMicros: integer('cost_micros').notNull(),
  hardGateFailuresJson: text('hard_gate_failures_json').notNull(),
  regressionPassed: text('regression_passed').notNull(),
  judgeModelId: text('judge_model_id'),
  judgeRubricVersion: text('judge_rubric_version'),
}, (table) => ({
  runCaseIdx: index('benchmark_case_results_run_case_idx').on(table.runId, table.caseId),
}));
