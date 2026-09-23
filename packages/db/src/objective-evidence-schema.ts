import { boolean, foreignKey, index, integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenants, users } from './schema.js';
import { learningObjectives, trainingVersions } from './training-schema.js';
import { trainingAssignments } from './learning-schema.js';
import { assessments, attempts, questionVersions } from './assessment-schema.js';

export const objectiveEvidence = pgTable('objective_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  assignmentId: uuid('assignment_id').notNull(),
  learnerId: uuid('learner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  trainingId: uuid('training_id').notNull(),
  trainingVersionId: uuid('training_version_id').notNull(),
  objectiveId: uuid('objective_id').notNull(),
  assessmentId: uuid('assessment_id').notNull(),
  attemptId: uuid('attempt_id').notNull(),
  questionVersionId: uuid('question_version_id').notNull(),
  earnedPoints: integer('earned_points').notNull(),
  possiblePoints: integer('possible_points').notNull(),
  correct: boolean('correct').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assignmentFk: foreignKey({
    name: 'objective_evidence_tenant_assignment_fk',
    columns: [table.tenantId, table.assignmentId],
    foreignColumns: [trainingAssignments.tenantId, trainingAssignments.id],
  }).onDelete('restrict'),
  versionFk: foreignKey({
    name: 'objective_evidence_tenant_training_version_fk',
    columns: [table.tenantId, table.trainingId, table.trainingVersionId],
    foreignColumns: [trainingVersions.tenantId, trainingVersions.trainingId, trainingVersions.id],
  }).onDelete('restrict'),
  objectiveFk: foreignKey({
    name: 'objective_evidence_tenant_objective_fk',
    columns: [table.tenantId, table.objectiveId],
    foreignColumns: [learningObjectives.tenantId, learningObjectives.id],
  }).onDelete('restrict'),
  assessmentFk: foreignKey({
    name: 'objective_evidence_tenant_assessment_fk',
    columns: [table.tenantId, table.assessmentId],
    foreignColumns: [assessments.tenantId, assessments.id],
  }).onDelete('restrict'),
  attemptFk: foreignKey({
    name: 'objective_evidence_tenant_attempt_fk',
    columns: [table.tenantId, table.attemptId],
    foreignColumns: [attempts.tenantId, attempts.id],
  }).onDelete('restrict'),
  questionVersionFk: foreignKey({
    name: 'objective_evidence_tenant_question_version_fk',
    columns: [table.tenantId, table.questionVersionId],
    foreignColumns: [questionVersions.tenantId, questionVersions.id],
  }).onDelete('restrict'),
  attemptQuestionUq: uniqueIndex('objective_evidence_attempt_question_uq').on(table.tenantId, table.attemptId, table.questionVersionId),
  learnerObjectiveIdx: index('objective_evidence_learner_objective_idx').on(table.tenantId, table.learnerId, table.trainingVersionId, table.objectiveId, table.createdAt),
}));
