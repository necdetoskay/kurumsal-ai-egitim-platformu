export type QuestionStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'RETIRED';
export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type AttemptStatus = 'CREATED' | 'IN_PROGRESS' | 'SUBMITTED' | 'SCORED' | 'COMPLETED' | 'EXPIRED' | 'INVALIDATED';
export type RetakeStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export class DomainError extends Error {}

export interface QuestionVersion {
  id: string;
  questionId: string;
  version: number;
  prompt: string;
  options: readonly string[];
  correctOptionIndex: number;
}

export interface Question {
  id: string;
  tenantId: string;
  status: QuestionStatus;
  versions: readonly QuestionVersion[];
}

export function transitionQuestion(question: Question, next: QuestionStatus): Question {
  const allowed: Record<QuestionStatus, readonly QuestionStatus[]> = {
    DRAFT: ['IN_REVIEW'],
    IN_REVIEW: ['DRAFT', 'APPROVED'],
    APPROVED: ['RETIRED'],
    RETIRED: [],
  };
  if (!allowed[question.status].includes(next)) throw new DomainError('INVALID_QUESTION_TRANSITION');
  return { ...question, status: next };
}

export interface AssessmentQuestionSnapshot {
  questionId: string;
  questionVersionId: string;
  prompt: string;
  options: readonly string[];
  correctOptionIndex: number;
  points: number;
}

export interface Assessment {
  id: string;
  tenantId: string;
  status: AssessmentStatus;
  snapshots: readonly AssessmentQuestionSnapshot[];
  passPercent: number;
}

export function publishAssessment(assessment: Assessment, snapshots: readonly AssessmentQuestionSnapshot[]): Assessment {
  if (assessment.status !== 'DRAFT') throw new DomainError('INVALID_ASSESSMENT_TRANSITION');
  if (snapshots.length === 0) throw new DomainError('ASSESSMENT_REQUIRES_QUESTION_SNAPSHOT');
  const frozen = snapshots.map((item) => Object.freeze({ ...item, options: Object.freeze([...item.options]) }));
  return Object.freeze({ ...assessment, status: 'PUBLISHED' as const, snapshots: Object.freeze(frozen) });
}

export function transitionAssessment(assessment: Assessment, next: AssessmentStatus): Assessment {
  const allowed: Record<AssessmentStatus, readonly AssessmentStatus[]> = {
    DRAFT: ['PUBLISHED'],
    PUBLISHED: ['CLOSED'],
    CLOSED: ['ARCHIVED'],
    ARCHIVED: [],
  };
  if (!allowed[assessment.status].includes(next)) throw new DomainError('INVALID_ASSESSMENT_TRANSITION');
  return { ...assessment, status: next };
}

export interface AttemptAnswer {
  questionVersionId: string;
  selectedOptionIndex: number;
}

export interface Attempt {
  id: string;
  tenantId: string;
  learnerUserId: string;
  assessmentId: string;
  status: AttemptStatus;
  answers: readonly AttemptAnswer[];
  scorePercent?: number;
  passed?: boolean;
}

export function beginAttempt(attempt: Attempt): Attempt {
  if (attempt.status !== 'CREATED') throw new DomainError('INVALID_ATTEMPT_TRANSITION');
  return { ...attempt, status: 'IN_PROGRESS' };
}

export function saveAnswer(attempt: Attempt, actorUserId: string, answer: AttemptAnswer): Attempt {
  if (attempt.status !== 'IN_PROGRESS') throw new DomainError('ATTEMPT_NOT_MUTABLE');
  if (attempt.learnerUserId !== actorUserId) throw new DomainError('ATTEMPT_OWNER_MISMATCH');
  const remaining = attempt.answers.filter((x) => x.questionVersionId !== answer.questionVersionId);
  return { ...attempt, answers: [...remaining, { ...answer }] };
}

export function submitAttempt(attempt: Attempt): Attempt {
  if (attempt.status === 'SUBMITTED' || attempt.status === 'SCORED' || attempt.status === 'COMPLETED') return attempt;
  if (attempt.status !== 'IN_PROGRESS') throw new DomainError('INVALID_ATTEMPT_TRANSITION');
  return Object.freeze({ ...attempt, status: 'SUBMITTED' as const, answers: Object.freeze(attempt.answers.map((x) => Object.freeze({ ...x }))) });
}

export function scoreAttempt(attempt: Attempt, assessment: Assessment): Attempt {
  if (attempt.status !== 'SUBMITTED') throw new DomainError('ATTEMPT_NOT_SUBMITTED');
  const answerMap = new Map(attempt.answers.map((x) => [x.questionVersionId, x.selectedOptionIndex]));
  const total = assessment.snapshots.reduce((sum, q) => sum + q.points, 0);
  const earned = assessment.snapshots.reduce((sum, q) => sum + (answerMap.get(q.questionVersionId) === q.correctOptionIndex ? q.points : 0), 0);
  const scorePercent = total === 0 ? 0 : Math.round((earned / total) * 10000) / 100;
  return { ...attempt, status: 'SCORED', scorePercent, passed: scorePercent >= assessment.passPercent };
}

export function finalizeAttempt(attempt: Attempt): Attempt {
  if (attempt.status !== 'SCORED') throw new DomainError('INVALID_ATTEMPT_TRANSITION');
  return { ...attempt, status: 'COMPLETED' };
}

export function learnerAssessmentProjection(assessment: Assessment) {
  return {
    id: assessment.id,
    status: assessment.status,
    passPercent: assessment.passPercent,
    questions: assessment.snapshots.map(({ correctOptionIndex: _hidden, ...safe }) => safe),
  };
}

export interface RetakeRequest {
  id: string;
  tenantId: string;
  learnerUserId: string;
  priorAttemptId: string;
  status: RetakeStatus;
}

export function decideRetake(request: RetakeRequest, next: Exclude<RetakeStatus, 'REQUESTED'>): RetakeRequest {
  if (request.status !== 'REQUESTED') throw new DomainError('INVALID_RETAKE_TRANSITION');
  return { ...request, status: next };
}
