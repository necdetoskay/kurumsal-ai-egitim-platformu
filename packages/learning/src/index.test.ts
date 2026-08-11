import { describe, expect, it } from 'vitest';
import {
  certificateEligibilityKey,
  evaluateCompletion,
  issueCertificate,
  resolveAssignment,
  revokeCertificate,
  type Certificate,
  type LearningEvidence,
  type TrainingAssignment,
} from './index.js';

const assignment: TrainingAssignment = {
  id: 'a1', tenantId: 't1', learnerId: 'u1', trainingId: 'tr1', trainingVersionId: 'tv1', status: 'ACTIVE', assignedAt: new Date('2026-01-01'),
};

function evidence(overrides: Partial<LearningEvidence>): LearningEvidence {
  return {
    id: 'e1', tenantId: 't1', assignmentId: 'a1', learnerId: 'u1', trainingId: 'tr1', trainingVersionId: 'tv1',
    type: 'MODULE_COMPLETED', sourceId: 'm1', occurredAt: new Date('2026-01-02'), ...overrides,
  };
}

describe('learning progress and certification invariants', () => {
  it('resolves duplicate active assignment idempotently', () => {
    expect(resolveAssignment([assignment], { ...assignment, id: 'a2' }).id).toBe('a1');
  });

  it('requires module and assessment evidence for completion', () => {
    const current = { assignmentId: 'a1', completed: false, evidenceIds: [] as string[] };
    const partial = evaluateCompletion({
      assignment,
      evidence: [evidence({})],
      policy: { requiredModuleIds: ['m1'], assessmentRequired: true },
      current,
      completedAt: new Date('2026-01-03'),
    });
    expect(partial.completed).toBe(false);

    const complete = evaluateCompletion({
      assignment,
      evidence: [
        evidence({}),
        evidence({ id: 'e2', type: 'ASSESSMENT_RESULT', sourceId: 'attempt1', payload: { assessmentId: 'as1', attemptId: 'attempt1', passed: true, normalizedScore: 90 } }),
      ],
      policy: { requiredModuleIds: ['m1'], assessmentRequired: true },
      current,
      completedAt: new Date('2026-01-03'),
    });
    expect(complete.completed).toBe(true);
  });

  it('keeps completion monotonic and idempotent', () => {
    const completed = { assignmentId: 'a1', completed: true, completedAt: new Date('2026-01-03'), evidenceIds: ['e1'] };
    expect(evaluateCompletion({ assignment, evidence: [], policy: { requiredModuleIds: ['m1'], assessmentRequired: false }, current: completed, completedAt: new Date('2026-01-04') })).toBe(completed);
  });

  it('rejects cross-tenant evidence', () => {
    expect(() => evaluateCompletion({
      assignment,
      evidence: [evidence({ tenantId: 't2' })],
      policy: { requiredModuleIds: ['m1'], assessmentRequired: false },
      current: { assignmentId: 'a1', completed: false, evidenceIds: [] },
      completedAt: new Date('2026-01-03'),
    })).toThrow('TENANT_BOUNDARY_VIOLATION');
  });

  it('issues only one certificate per eligibility evidence and preserves revocation history', () => {
    const key = certificateEligibilityKey({ tenantId: 't1', learnerId: 'u1', trainingVersionId: 'tv1', completionEvidenceId: 'completion1', assessmentEvidenceId: 'result1' });
    const original: Certificate = { id: 'c1', tenantId: 't1', learnerId: 'u1', trainingId: 'tr1', trainingVersionId: 'tv1', eligibilityEvidenceKey: key, status: 'ISSUED', issuedAt: new Date('2026-01-05') };
    expect(issueCertificate({ existing: [original], certificate: { ...original, id: 'c2' } }).id).toBe('c1');
    const revoked = revokeCertificate(original, new Date('2026-01-06'), 'policy violation');
    expect(revoked.status).toBe('REVOKED');
    expect(original.status).toBe('ISSUED');
  });
});
