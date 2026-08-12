export type CandidateStatus = 'DRAFT' | 'VALIDATION_FAILED' | 'REVIEW_REQUIRED' | 'READY_FOR_REVIEW' | 'REJECTED';

export interface EvidenceRef { id: string; tenantId: string; usable: boolean }
export interface QuestionCandidate {
  id: string;
  tenantId: string;
  trainingId: string;
  prompt: string;
  options: readonly string[];
  correctOptionIndex: number;
  evidenceRefs: readonly EvidenceRef[];
  schemaVersion: string;
  promptVersion: string;
  modelId: string;
  runId: string;
  inputSnapshotId: string;
  repairAttempt: number;
}

export type ValidationCode = 'EMPTY_PROMPT' | 'INVALID_OPTION_COUNT' | 'INVALID_ANSWER_KEY' | 'MISSING_EVIDENCE' | 'UNUSABLE_EVIDENCE' | 'TENANT_MISMATCH' | 'DUPLICATE';
export interface ValidationFinding { code: ValidationCode; blocking: true; detail?: string }
export interface EvaluatorResult { score: number; grounded: boolean; unambiguous: boolean; reason: string; evaluatorRunId: string }
export interface QualityDecision { status: CandidateStatus; findings: readonly ValidationFinding[]; evaluator?: EvaluatorResult }

export function validateCandidate(candidate: QuestionCandidate, existingFingerprints: ReadonlySet<string> = new Set()): readonly ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  if (!candidate.prompt.trim()) findings.push({ code: 'EMPTY_PROMPT', blocking: true });
  if (candidate.options.length < 2) findings.push({ code: 'INVALID_OPTION_COUNT', blocking: true });
  if (!Number.isInteger(candidate.correctOptionIndex) || candidate.correctOptionIndex < 0 || candidate.correctOptionIndex >= candidate.options.length) findings.push({ code: 'INVALID_ANSWER_KEY', blocking: true });
  if (candidate.evidenceRefs.length === 0) findings.push({ code: 'MISSING_EVIDENCE', blocking: true });
  for (const evidence of candidate.evidenceRefs) {
    if (!evidence.usable) findings.push({ code: 'UNUSABLE_EVIDENCE', blocking: true, detail: evidence.id });
    if (evidence.tenantId !== candidate.tenantId) findings.push({ code: 'TENANT_MISMATCH', blocking: true, detail: evidence.id });
  }
  if (existingFingerprints.has(fingerprintCandidate(candidate))) findings.push({ code: 'DUPLICATE', blocking: true });
  return Object.freeze(findings.map((x) => Object.freeze({ ...x })));
}

export function fingerprintCandidate(candidate: Pick<QuestionCandidate, 'prompt' | 'options'>): string {
  const normalize = (value: string) => value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
  return JSON.stringify([normalize(candidate.prompt), ...candidate.options.map(normalize)]);
}

export function decideQuality(candidate: QuestionCandidate, evaluator?: EvaluatorResult, existingFingerprints: ReadonlySet<string> = new Set()): QualityDecision {
  const findings = validateCandidate(candidate, existingFingerprints);
  if (findings.length > 0) return Object.freeze({ status: 'VALIDATION_FAILED' as const, findings });
  if (!evaluator) return Object.freeze({ status: 'REVIEW_REQUIRED' as const, findings });
  if (!evaluator.grounded || !evaluator.unambiguous) return Object.freeze({ status: 'REJECTED' as const, findings, evaluator: Object.freeze({ ...evaluator }) });
  return Object.freeze({ status: 'READY_FOR_REVIEW' as const, findings, evaluator: Object.freeze({ ...evaluator }) });
}

export function nextRepairAttempt(candidate: QuestionCandidate, maxAttempts: number): QuestionCandidate {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 0) throw new Error('INVALID_REPAIR_LIMIT');
  if (candidate.repairAttempt >= maxAttempts) throw new Error('REPAIR_LIMIT_REACHED');
  return { ...candidate, repairAttempt: candidate.repairAttempt + 1 };
}

export function canAutonomouslyPublishQuestion(_decision: QualityDecision): false { return false; }

export function reviewerProjection(candidate: QuestionCandidate) { return { ...candidate, evidenceRefs: candidate.evidenceRefs.map((x) => ({ ...x })) }; }
export function learnerProjection(candidate: QuestionCandidate) {
  const { correctOptionIndex: _hidden, ...safe } = candidate;
  return safe;
}
