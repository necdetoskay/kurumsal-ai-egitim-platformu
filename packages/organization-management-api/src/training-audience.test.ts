import { describe, expect, it } from 'vitest';
import { assertAudienceConfirmGate, assertAudiencePreviewIsSideEffectFree, trainingAudienceRoutes } from './training-audience.js';

describe('training audience API contracts', () => {
  it('keeps preview side-effect free and confirm mutating', () => {
    const preview = trainingAudienceRoutes.find((route) => route.path.endsWith('/preview'))!;
    const confirm = trainingAudienceRoutes.find((route) => route.path.endsWith('/confirm'))!;
    expect(preview.mutation).toBe(false);
    expect(confirm.mutation).toBe(true);
    expect(() => assertAudiencePreviewIsSideEffectFree(preview)).not.toThrow();
  });

  it('requires stable fingerprint, targets and idempotency for confirm', () => {
    expect(() => assertAudienceConfirmGate({ organizationId: 'o1', trainingId: 't1', trainingVersionId: 'v1', targets: [], resolutionFingerprint: 'bad', idempotencyKey: '' })).toThrow();
    expect(() => assertAudienceConfirmGate({ organizationId: 'o1', trainingId: 't1', trainingVersionId: 'v1', targets: [{ type: 'GROUP', id: 'g1' }], resolutionFingerprint: 'a'.repeat(64), idempotencyKey: 'idem-1' })).not.toThrow();
  });
});
