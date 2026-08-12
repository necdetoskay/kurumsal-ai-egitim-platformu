import { describe, expect, it } from 'vitest';
import { assertSessionAdapterResult } from './auth.adapter';

describe('assertSessionAdapterResult', () => {
  it('fails closed when authenticated session identity is incomplete', () => {
    expect(assertSessionAdapterResult({
      status: 'authenticated',
      userId: '',
      tenantId: 'tenant-1',
      role: 'learner',
      expiresAt: '2026-08-12T12:00:00.000Z',
    })).toEqual({ status: 'forbidden' });
  });

  it('preserves complete authenticated session', () => {
    const session = {
      status: 'authenticated' as const,
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'learner' as const,
      expiresAt: '2026-08-12T12:00:00.000Z',
    };
    expect(assertSessionAdapterResult(session)).toEqual(session);
  });
});
