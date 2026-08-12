import test from 'node:test';
import assert from 'node:assert/strict';
import { compareForPromotion, deriveThreshold, validateGoldenCase, validateRun, type BenchmarkRun, type GoldenCase } from './index.js';

const baseCase: GoldenCase = {
  caseId: 'c1', datasetVersion: 'v1', capability: 'question_generation', split: 'qualification', inputSnapshotId: 'snap1',
  expectedBehavior: 'grounded valid question', hardGateExpectations: ['grounding'], provenance: 'fixture', groundTruthSource: 'human_reviewed', approvedBy: 'reviewer1'
};

test('judge-assisted ground truth requires review', () => {
  assert.throws(() => validateGoldenCase({ ...baseCase, groundTruthSource: 'judge_assisted', approvedBy: undefined }), /JUDGE_GROUND_TRUTH_REQUIRES_REVIEW/);
});

test('run cannot evaluate cases outside recorded dataset split', () => {
  const run: BenchmarkRun = { runId: 'r', datasetVersion: 'v1', split: 'qualification', candidate: { candidateId: 'x', modelId: 'm', promptVersion: 'p', schemaVersion: 's' }, evaluations: [{ caseId: 'other', candidateId: 'x', correctness: 1, grounding: 1, structuredOutput: 1, latencyMs: 1, costMicros: 1, hardGateFailures: [], regressionPassed: true }] };
  assert.throws(() => validateRun(run, [baseCase]), /CASE_OUTSIDE_RECORDED_DATASET_SPLIT/);
});

test('hard gate failure blocks promotion even with perfect scores', () => {
  const mk = (id: string, failures: readonly string[]): BenchmarkRun => ({ runId: id, datasetVersion: 'v1', split: 'qualification', candidate: { candidateId: id, modelId: 'm', promptVersion: 'p', schemaVersion: 's' }, evaluations: [{ caseId: 'c1', candidateId: id, correctness: 1, grounding: 1, structuredOutput: 1, latencyMs: 10, costMicros: 10, hardGateFailures: failures, regressionPassed: true }] });
  const report = compareForPromotion(mk('base', []), mk('candidate', ['grounding']), { minCorrectness: .8, minGrounding: .8, minStructuredOutputRate: .9, maxRegressionFailures: 0 });
  assert.equal(report.decision, 'REJECT');
  assert.deepEqual(report.reasons, ['HARD_GATE_FAILURE']);
});

test('threshold derivation is deterministic', () => {
  assert.equal(deriveThreshold([0.9, 0.8, 0.7, 0.95, 0.85], 0.6), deriveThreshold([0.95, 0.7, 0.85, 0.8, 0.9], 0.6));
});
