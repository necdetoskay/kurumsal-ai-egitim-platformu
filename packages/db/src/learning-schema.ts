import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenants, users } from './schema.js';
import { trainingVersions, trainings } from './training-schema.js';

export const trainingAssignments = pgTable('training_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  learnerId: uuid('learner_id').notNull().references(() => users.id),
  trainingId: uuid('training_id').notNull().references(() => trainings.id),
  trainingVersionId: uuid('training_version_id').notNull().references(() => trainingVersions.id),
  status: text('status').notNull().default('ACTIVE'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantLearnerIdx: index('training_assignments_tenant_learner_idx').on(table.tenantId, table.learnerId),
  identityStatusIdx: index('training_assignments_identity_status_idx').on(table.tenantId, table.learnerId, table.trainingVersionId, table.status),
}));

export const learningEvidence = pgTable('learning_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  assignmentId: uuid('assignment_id').notNull().references(() => trainingAssignments.id),
  learnerId: uuid('learner_id').notNull().references(() => users.id),
  trainingId: uuid('training_id').notNull().references(() => trainings.id),
  trainingVersionId: uuid('training_version_id').notNull().references(() => trainingVersions.id),
  type: text('type').notNull(),
  sourceId: text('source_id').notNull(),
  payload: jsonb('payload'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceUnique: uniqueIndex('learning_evidence_source_uq').on(table.tenantId, table.assignmentId, table.type, table.sourceId),
  assignmentOccurredIdx: index('learning_evidence_assignment_occurred_idx').on(table.tenantId, table.assignmentId, table.occurredAt),
}));

export const trainingCompletions = pgTable('training_completions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  assignmentId: uuid('assignment_id').notNull().references(() => trainingAssignments.id),
  learnerId: uuid('learner_id').notNull().references(() => users.id),
  trainingId: uuid('training_id').notNull().references(() => trainings.id),
  trainingVersionId: uuid('training_version_id').notNull().references(() => trainingVersions.id),
  evidenceSnapshot: jsonb('evidence_snapshot').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assignmentUnique: uniqueIndex('training_completions_assignment_uq').on(table.tenantId, table.assignmentId),
}));

export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  learnerId: uuid('learner_id').notNull().references(() => users.id),
  trainingId: uuid('training_id').notNull().references(() => trainings.id),
  trainingVersionId: uuid('training_version_id').notNull().references(() => trainingVersions.id),
  eligibilityEvidenceKey: text('eligibility_evidence_key').notNull(),
  status: text('status').notNull().default('ISSUED'),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokeReason: text('revoke_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  eligibilityUnique: uniqueIndex('certificates_eligibility_uq').on(table.tenantId, table.eligibilityEvidenceKey),
  learnerTrainingIdx: index('certificates_learner_training_idx').on(table.tenantId, table.learnerId, table.trainingId),
}));
