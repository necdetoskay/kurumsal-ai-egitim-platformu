import { describe, expect, it } from 'vitest';
import { defaultScreenFor, learnerProjectionContract, screenFor, screens } from './screens';

describe('canonical screen registry', () => {
  it('provides a default screen for all V1 roles', () => {
    expect(defaultScreenFor('tenant_admin').id).toBe(9);
    expect(defaultScreenFor('instructor').id).toBe(23);
    expect(defaultScreenFor('reviewer').id).toBe(42);
    expect(defaultScreenFor('learner').id).toBe(48);
  });

  it('fails closed for cross-role learner routes', () => {
    expect(screenFor('learner', '/admin')).toBeNull();
    expect(screenFor('learner', '/questions')).toBeNull();
    expect(screenFor('reviewer', '/learn/assessment/player')).toBeNull();
  });

  it('marks learner-facing screens as answer-key safe and server-authoritative', () => {
    const assessmentPlayer = screenFor('learner', '/learn/assessment/player');
    expect(assessmentPlayer).not.toBeNull();
    expect(learnerProjectionContract(assessmentPlayer!)).toEqual({ exposesAnswerKey: false, serverAuthoritative: true });
  });

  it('covers critical state-matrix workflow states', () => {
    expect(screenFor('learner', '/learn/player')?.workflowStates).toContain('progress-save-failed');
    expect(screenFor('learner', '/learn/assessment/player')?.workflowStates).toContain('autosave-failed');
    expect(screenFor('reviewer', '/reviews')?.workflowStates).toContain('changes-requested');
    expect(screens.some((screen) => screen.workflowStates.includes('revoked'))).toBe(true);
  });
});
