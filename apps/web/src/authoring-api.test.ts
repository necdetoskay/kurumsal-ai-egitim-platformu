import { describe, expect, it } from 'vitest';
import { mapAuthoringApiResult } from './authoring-api';
import type { TrainingDraft } from './authoring';

const draft: TrainingDraft = {
  id: 't1', title: 'Test', version: 1, stage: 'editing', learningObjectives: ['o1'], modules: ['m1'], evidence: [{ sourceId: 's1', evidenceId: 'e1', label: 'Evidence' }], aiGenerated: false, saveState: 'saved',
};

describe('authoring API mapping', () => {
  it('maps success with the server draft', () => {
    expect(mapAuthoringApiResult({ ok: true, status: 200, draft })).toEqual({ state: 'success', draft });
  });

  it('fails closed on auth and permission failures', () => {
    expect(mapAuthoringApiResult({ ok: false, status: 401, code: 'SESSION_REQUIRED' })).toEqual({ state: 'unauthenticated' });
    expect(mapAuthoringApiResult({ ok: false, status: 403, code: 'FORBIDDEN' })).toEqual({ state: 'forbidden' });
  });

  it('does not convert validation or conflict failures into success', () => {
    expect(mapAuthoringApiResult({ ok: false, status: 409, code: 'VERSION_CONFLICT' })).toEqual({ state: 'conflict' });
    expect(mapAuthoringApiResult({ ok: false, status: 422, code: 'INVALID_DRAFT' })).toEqual({ state: 'validation-error' });
  });
});
