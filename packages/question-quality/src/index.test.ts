import { describe, expect, it } from 'vitest';
import { canAutonomouslyPublishQuestion, decideQuality, fingerprintCandidate, learnerProjection, nextRepairAttempt, type QuestionCandidate } from './index.js';

const base: QuestionCandidate = {
  id: 'q1', tenantId: 't1', trainingId: 'tr1', prompt: '2 + 2 kaçtır?', options: ['3', '4'], correctOptionIndex: 1,
  evidenceRefs: [{ id: 'e1', tenantId: 't1', usable: true }], schemaVersion: '1', promptVersion: 'p1', modelId: 'm1', runId: 'r1', inputSnapshotId: 's1', repairAttempt: 0,
};

describe('question quality invariants', () => {
  it('blocks missing evidence before evaluator', () => {
    const result = decideQuality({ ...base, evidenceRefs: [] }, { score: 100, grounded: true, unambiguous: true, reason: 'ok', evaluatorRunId: 'er1' });
    expect(result.status).toBe('VALIDATION_FAILED');
  });

  it('rejects cross-tenant evidence', () => {
    const result = decideQuality({ ...base, evidenceRefs: [{ id: 'e2', tenantId: 't2', usable: true }] });
    expect(result.findings.some((x) => x.code === 'TENANT_MISMATCH')).toBe(true);
  });

  it('detects deterministic duplicate fingerprint', () => {
    const result = decideQuality(base, undefined, new Set([fingerprintCandidate(base)]));
    expect(result.findings.some((x) => x.code === 'DUPLICATE')).toBe(true);
  });

  it('requires evaluator before ready-for-review', () => {
    expect(decideQuality(base).status).toBe('REVIEW_REQUIRED');
    expect(decideQuality(base, { score: 90, grounded: true, unambiguous: true, reason: 'ok', evaluatorRunId: 'er1' }).status).toBe('READY_FOR_REVIEW');
  });

  it('bounds repair attempts', () => {
    expect(nextRepairAttempt(base, 1).repairAttempt).toBe(1);
    expect(() => nextRepairAttempt({ ...base, repairAttempt: 1 }, 1)).toThrow('REPAIR_LIMIT_REACHED');
  });

  it('never permits autonomous publish and hides answer key from learner projection', () => {
    const decision = decideQuality(base, { score: 90, grounded: true, unambiguous: true, reason: 'ok', evaluatorRunId: 'er1' });
    expect(canAutonomouslyPublishQuestion(decision)).toBe(false);
    expect('correctOptionIndex' in learnerProjection(base)).toBe(false);
  });
});
