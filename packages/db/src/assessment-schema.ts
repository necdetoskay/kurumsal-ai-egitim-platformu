import { boolean, foreignKey, index, integer, jsonb, pgTable, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants, users } from './schema.js';
import { trainingVersions } from './training-schema.js';

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  status: text('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ tenantIdIdUq: unique('questions_tenant_id_id_uq').on(table.tenantId, table.id), tenantStatusIdx: index('questions_tenant_status_idx').on(table.tenantId, table.status) }));

export const questionVersions = pgTable('question_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  questionId: uuid('question_id').notNull(),
  version: integer('version').notNull(),
  prompt: text('prompt').notNull(),
  optionsJson: jsonb('options_json').notNull(),
  correctOptionIndex: integer('correct_option_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ questionFk: foreignKey({ name: 'question_versions_tenant_question_fk', columns: [table.tenantId, table.questionId], foreignColumns: [questions.tenantId, questions.id] }).onDelete('restrict'), tenantIdIdUq: unique('question_versions_tenant_id_id_uq').on(table.tenantId, table.id), questionVersionUq: uniqueIndex('question_versions_tenant_question_version_uq').on(table.tenantId, table.questionId, table.version) }));

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  status: text('status').notNull().default('DRAFT'),
  passPercent: integer('pass_percent').notNull().default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ tenantIdIdUq: unique('assessments_tenant_id_id_uq').on(table.tenantId, table.id), tenantStatusIdx: index('assessments_tenant_status_idx').on(table.tenantId, table.status) }));

export const trainingAssessments = pgTable('training_assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  trainingId: uuid('training_id').notNull(),
  trainingVersionId: uuid('training_version_id').notNull(),
  assessmentId: uuid('assessment_id').notNull(),
  required: boolean('required').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  trainingVersionFk: foreignKey({
    name: 'training_assessments_tenant_training_version_fk',
    columns: [table.tenantId, table.trainingId, table.trainingVersionId],
    foreignColumns: [trainingVersions.tenantId, trainingVersions.trainingId, trainingVersions.id],
  }).onDelete('restrict'),
  assessmentFk: foreignKey({
    name: 'training_assessments_tenant_assessment_fk',
    columns: [table.tenantId, table.assessmentId],
    foreignColumns: [assessments.tenantId, assessments.id],
  }).onDelete('restrict'),
  versionAssessmentUq: uniqueIndex('training_assessments_version_assessment_uq').on(table.tenantId, table.trainingVersionId, table.assessmentId),
  versionIdx: index('training_assessments_version_idx').on(table.tenantId, table.trainingVersionId),
}));

export const assessmentQuestionSnapshots = pgTable('assessment_question_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  assessmentId: uuid('assessment_id').notNull(),
  questionId: uuid('question_id').notNull(),
  questionVersionId: uuid('question_version_id').notNull(),
  position: integer('position').notNull(),
  prompt: text('prompt').notNull(),
  optionsJson: jsonb('options_json').notNull(),
  correctOptionIndex: integer('correct_option_index').notNull(),
  points: integer('points').notNull().default(1),
}, (table) => ({ assessmentFk: foreignKey({ name: 'assessment_snapshots_tenant_assessment_fk', columns: [table.tenantId, table.assessmentId], foreignColumns: [assessments.tenantId, assessments.id] }).onDelete('restrict'), questionFk: foreignKey({ name: 'assessment_snapshots_tenant_question_fk', columns: [table.tenantId, table.questionId], foreignColumns: [questions.tenantId, questions.id] }).onDelete('restrict'), questionVersionFk: foreignKey({ name: 'assessment_snapshots_tenant_question_version_fk', columns: [table.tenantId, table.questionVersionId], foreignColumns: [questionVersions.tenantId, questionVersions.id] }).onDelete('restrict'), assessmentPositionUq: uniqueIndex('assessment_question_snapshots_tenant_position_uq').on(table.tenantId, table.assessmentId, table.position) }));

export const attempts = pgTable('attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  assessmentId: uuid('assessment_id').notNull(),
  learnerUserId: uuid('learner_user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('CREATED'),
  scorePercent: integer('score_percent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({ assessmentFk: foreignKey({ name: 'attempts_tenant_assessment_fk', columns: [table.tenantId, table.assessmentId], foreignColumns: [assessments.tenantId, assessments.id] }).onDelete('restrict'), tenantIdIdUq: unique('attempts_tenant_id_id_uq').on(table.tenantId, table.id), tenantLearnerIdx: index('attempts_tenant_learner_idx').on(table.tenantId, table.learnerUserId), activeAttemptUq: uniqueIndex('attempts_active_attempt_uq').on(table.tenantId, table.assessmentId, table.learnerUserId).where(sql`${table.status} in ('CREATED','IN_PROGRESS')`) }));

export const attemptAnswers = pgTable('attempt_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  attemptId: uuid('attempt_id').notNull(),
  questionVersionId: uuid('question_version_id').notNull(),
  selectedOptionIndex: integer('selected_option_index').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ attemptFk: foreignKey({ name: 'attempt_answers_tenant_attempt_fk', columns: [table.tenantId, table.attemptId], foreignColumns: [attempts.tenantId, attempts.id] }).onDelete('restrict'), questionVersionFk: foreignKey({ name: 'attempt_answers_tenant_question_version_fk', columns: [table.tenantId, table.questionVersionId], foreignColumns: [questionVersions.tenantId, questionVersions.id] }).onDelete('restrict'), attemptQuestionUq: uniqueIndex('attempt_answers_tenant_attempt_question_uq').on(table.tenantId, table.attemptId, table.questionVersionId) }));

export const retakeRequests = pgTable('retake_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  learnerUserId: uuid('learner_user_id').notNull().references(() => users.id),
  priorAttemptId: uuid('prior_attempt_id').notNull(),
  status: text('status').notNull().default('REQUESTED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
}, (table) => ({ priorAttemptFk: foreignKey({ name: 'retake_requests_tenant_attempt_fk', columns: [table.tenantId, table.priorAttemptId], foreignColumns: [attempts.tenantId, attempts.id] }).onDelete('restrict'), tenantStatusIdx: index('retake_requests_tenant_status_idx').on(table.tenantId, table.status), requestedPriorUq: uniqueIndex('retake_requests_requested_prior_uq').on(table.tenantId, table.priorAttemptId).where(sql`${table.status} = 'REQUESTED'`) }));
