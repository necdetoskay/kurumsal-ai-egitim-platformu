import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenants, users } from './schema.js';

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  status: text('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ tenantStatusIdx: index('questions_tenant_status_idx').on(table.tenantId, table.status) }));

export const questionVersions = pgTable('question_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  questionId: uuid('question_id').notNull().references(() => questions.id),
  version: integer('version').notNull(),
  prompt: text('prompt').notNull(),
  optionsJson: jsonb('options_json').notNull(),
  correctOptionIndex: integer('correct_option_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ questionVersionUq: uniqueIndex('question_versions_question_version_uq').on(table.questionId, table.version) }));

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  status: text('status').notNull().default('DRAFT'),
  passPercent: integer('pass_percent').notNull().default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ tenantStatusIdx: index('assessments_tenant_status_idx').on(table.tenantId, table.status) }));

export const assessmentQuestionSnapshots = pgTable('assessment_question_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id),
  questionId: uuid('question_id').notNull().references(() => questions.id),
  questionVersionId: uuid('question_version_id').notNull().references(() => questionVersions.id),
  position: integer('position').notNull(),
  prompt: text('prompt').notNull(),
  optionsJson: jsonb('options_json').notNull(),
  correctOptionIndex: integer('correct_option_index').notNull(),
  points: integer('points').notNull().default(1),
}, (table) => ({ assessmentPositionUq: uniqueIndex('assessment_question_snapshots_assessment_position_uq').on(table.assessmentId, table.position) }));

export const attempts = pgTable('attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id),
  learnerUserId: uuid('learner_user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('CREATED'),
  scorePercent: integer('score_percent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({ tenantLearnerIdx: index('attempts_tenant_learner_idx').on(table.tenantId, table.learnerUserId) }));

export const attemptAnswers = pgTable('attempt_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  attemptId: uuid('attempt_id').notNull().references(() => attempts.id),
  questionVersionId: uuid('question_version_id').notNull().references(() => questionVersions.id),
  selectedOptionIndex: integer('selected_option_index').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ attemptQuestionUq: uniqueIndex('attempt_answers_attempt_question_uq').on(table.attemptId, table.questionVersionId) }));

export const retakeRequests = pgTable('retake_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  learnerUserId: uuid('learner_user_id').notNull().references(() => users.id),
  priorAttemptId: uuid('prior_attempt_id').notNull().references(() => attempts.id),
  status: text('status').notNull().default('REQUESTED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
}, (table) => ({ tenantStatusIdx: index('retake_requests_tenant_status_idx').on(table.tenantId, table.status) }));
