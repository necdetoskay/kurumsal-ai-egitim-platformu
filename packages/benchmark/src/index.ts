export type DatasetSplit = 'development' | 'qualification' | 'regression';
export type GroundTruthSource = 'deterministic' | 'canonical_source' | 'human_reviewed' | 'judge_assisted';

export interface GoldenCase {
  caseId: string;
  datasetVersion: string;
  capability: string;
  split: DatasetSplit;
  inputSnapshotId: string;
  expectedBehavior: string;
  hardGateExpectations: readonly string[];
  provenance: string;
  approvedBy?: string;
  groundTruthSource: GroundTruthSource;
}

export interface CandidateIdentity {
  candidateId: string;
  modelId: string;
  promptVersion: string;
  schemaVersion: string;
}

export interface JudgeLineage {
  modelId: string;
  rubricVersion: string;
}

export interface CaseEvaluation {
  caseId: string;
  candidateId: string;
  correctness: number;
  grounding: number;
  structuredOutput: number;
  latencyMs: number;
  costMicros: number;
  hardGateFailures: readonly string[];
  regressionPassed: boolean;
  judge?: JudgeLineage;
}

export interface BenchmarkRun {
  runId: string;
  datasetVersion: string;
  split: DatasetSplit;
  candidate: CandidateIdentity;
  evaluations: readonly CaseEvaluation[];
}

export class BenchmarkError extends Error {}

export function validateGoldenCase(testCase: GoldenCase): void {
  if (!testCase.caseId || !testCase.datasetVersion || !testCase.inputSnapshotId) throw new BenchmarkError('INVALID_CASE');
  if (testCase.groundTruthSource === 'judge_assisted' && !testCase.approvedBy) throw new BenchmarkError('JUDGE_GROUND_TRUTH_REQUIRES_REVIEW');
  if (testCase.split === 'regression' && !testCase.provenance) throw new BenchmarkError('REGRESSION_REQUIRES_PROVENANCE');
}

export function validateRun(run: BenchmarkRun, cases: readonly GoldenCase[]): void {
  const relevant = cases.filter((c) => c.datasetVersion === run.datasetVersion && c.split === run.split);
  if (relevant.length === 0) throw new BenchmarkError('DATASET_SPLIT_EMPTY');
  const ids = new Set(relevant.map((c) => c.caseId));
  for (const result of run.evaluations) if (!ids.has(result.caseId)) throw new BenchmarkError('CASE_OUTSIDE_RECORDED_DATASET_SPLIT');
}

export interface BenchmarkSummary {
  candidateId: string;
  caseCount: number;
  hardGateFailureCount: number;
  regressionFailureCount: number;
  meanCorrectness: number;
  meanGrounding: number;
  structuredOutputRate: number;
  meanLatencyMs: number;
  totalCostMicros: number;
}

const mean = (values: readonly number[]) => values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

export function summarize(run: BenchmarkRun): BenchmarkSummary {
  return {
    candidateId: run.candidate.candidateId,
    caseCount: run.evaluations.length,
    hardGateFailureCount: run.evaluations.reduce((n, e) => n + e.hardGateFailures.length, 0),
    regressionFailureCount: run.evaluations.filter((e) => !e.regressionPassed).length,
    meanCorrectness: mean(run.evaluations.map((e) => e.correctness)),
    meanGrounding: mean(run.evaluations.map((e) => e.grounding)),
    structuredOutputRate: mean(run.evaluations.map((e) => e.structuredOutput)),
    meanLatencyMs: mean(run.evaluations.map((e) => e.latencyMs)),
    totalCostMicros: run.evaluations.reduce((n, e) => n + e.costMicros, 0),
  };
}

export interface PromotionPolicy {
  minCorrectness: number;
  minGrounding: number;
  minStructuredOutputRate: number;
  maxRegressionFailures: number;
}

export interface PromotionReport {
  decision: 'PROMOTE' | 'REJECT';
  baseline: BenchmarkSummary;
  candidate: BenchmarkSummary;
  reasons: readonly string[];
}

export function compareForPromotion(baselineRun: BenchmarkRun, candidateRun: BenchmarkRun, policy: PromotionPolicy): PromotionReport {
  if (baselineRun.datasetVersion !== candidateRun.datasetVersion || baselineRun.split !== candidateRun.split) {
    throw new BenchmarkError('NON_COMPARABLE_RUNS');
  }
  const baseline = summarize(baselineRun);
  const candidate = summarize(candidateRun);
  const reasons: string[] = [];
  if (candidate.hardGateFailureCount > 0) reasons.push('HARD_GATE_FAILURE');
  if (candidate.regressionFailureCount > policy.maxRegressionFailures) reasons.push('REGRESSION_THRESHOLD');
  if (candidate.meanCorrectness < policy.minCorrectness) reasons.push('CORRECTNESS_THRESHOLD');
  if (candidate.meanGrounding < policy.minGrounding) reasons.push('GROUNDING_THRESHOLD');
  if (candidate.structuredOutputRate < policy.minStructuredOutputRate) reasons.push('STRUCTURED_OUTPUT_THRESHOLD');
  return { decision: reasons.length === 0 ? 'PROMOTE' : 'REJECT', baseline, candidate, reasons };
}

export function deriveThreshold(samples: readonly number[], floor: number): number {
  if (samples.length === 0) throw new BenchmarkError('NO_SAMPLES');
  const sorted = [...samples].sort((a, b) => a - b);
  const p10 = sorted[Math.floor((sorted.length - 1) * 0.1)] ?? sorted[0]!;
  return Math.max(floor, p10);
}
