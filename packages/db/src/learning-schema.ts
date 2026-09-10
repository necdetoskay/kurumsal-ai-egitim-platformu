import { sql } from 'drizzle-orm';
import { check, foreignKey, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
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
  tenantIdentityUnique: uniqueIndex('training_assignments_tenant_id_uq').on(table.tenantId, table.id),
  tenantLearnerIdx: index('training_assignments_tenant_learner_idx').on(table.tenantId, table.learnerId),
  identityStatusIdx: index('training_assignments_identity_status_idx').on(table.tenantId, table.learnerId, table.trainingVersionId, table.status),
  activeIdentityUnique: uniqueIndex('training_assignments_active_identity_uq')
    .on(table.tenantId, table.learnerId, table.trainingId, table.trainingVersionId)
    .where(sql`${table.status} = 'ACTIVE'`),
}));

export const trainingAssignmentOriginType = pgEnum('training_assignment_origin_type', ['DIRECT', 'AUDIENCE_RESOLUTION']);

/**
 * Learning-owned immutable provenance. Multiple origins may point to the same
 * assignment so an already-active assignment can retain both its original
 * reason and later confirmed audience resolutions that semantically reuse it.
 */
export const trainingAssignmentOrigins = pgTable('training_assignment_origins', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  assignmentId: uuid('assignment_id').notNull(),
  originType: trainingAssignmentOriginType('origin_type').notNull(),
  originKey: text('origin_key').notNull(),
  sourceRefId: text('source_ref_id'),
  sourceFingerprint: text('source_fingerprint'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assignmentFk: foreignKey({
    name: 'training_assignment_origins_tenant_assignment_fk',
    columns: [table.tenantId, table.assignmentId],
    foreignColumns: [trainingAssignments.tenantId, trainingAssignments.id],
  }).onDelete('restrict'),
  assignmentOriginUnique: uniqueIndex('training_assignment_origins_assignment_origin_uq').on(table.tenantId, table.assignmentId, table.originKey),
  sourceLookupIdx: index('training_assignment_origins_source_idx').on(table.tenantId, table.originType, table.sourceRefId),
  shape: check('training_assignment_origins_shape_ck', sql`(
    (${table.originType} = 'DIRECT' and ${table.sourceRefId} is null and ${table.sourceFingerprint} is null and ${table.originKey} = 'DIRECT') or
    (${table.originType} = 'AUDIENCE_RESOLUTION' and ${table.sourceRefId} is not null and ${table.sourceFingerprint} is not null and ${table.originKey} = ('AUDIENCE_RESOLUTION:' || ${table.sourceRefId}))
  )`),
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
