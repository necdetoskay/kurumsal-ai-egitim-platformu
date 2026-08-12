import { describe, expect, it } from 'vitest';
import { defaultScreenFor, learnerProjectionContract, screenFor, screens } from './screens';

describe('canonical screen registry', () => {
  it('provides a default screen for all V1 roles', () => {
    expect(defaultScreenFor('tenant_admin').id).toBe(9);
    expect(defaultScreenFor('instructor').id).toBe(23);
    expect(defaultScreenFor('reviewer').id).toBe(42);
    expect(defaultScreenFor('learner').id).toBe(48);
  });

  it('fails closed for cross-role routes', () => {
    expect(screenFor('learner', '/admin')).toBeNull();
    expect(screenFor('learner', '/instructor/questions')).toBeNull();
    expect(screenFor('reviewer', '/learn/assessments')).toBeNull();
  });

  it('marks learner-facing screens as answer-key safe and server-authoritative', () => {
    const assessment = screenFor('learner', '/learn/assessments');
    expect(assessment).not.toBeNull();
    expect(learnerProjectionContract(assessment!)).toEqual({ exposesAnswerKey: false, serverAuthoritative: true });
  });

  it('covers critical state-matrix workflow states', () => {
    expect(screenFor('learner', '/learn/assessments')?.workflowStates).toContain('autosave-failed');
    expect(screenFor('reviewer', '/reviewer/queue')?.workflowStates).toContain('changes-requested');
    expect(screenFor('learner', '/learn/insights')?.workflowStates).toContain('insufficient-evidence');
    expect(screens.some((screen) => screen.workflowStates.includes('revoked'))).toBe(true);
  });
});
