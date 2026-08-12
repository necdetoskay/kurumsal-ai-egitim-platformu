import { describe, expect, it } from 'vitest';
import { canRenderProtectedShell, type SessionState } from './auth';

const blockedStates: SessionState[] = [
  { status: 'bootstrapping' },
  { status: 'unauthenticated' },
  { status: 'verification-required', challenge: 'mfa' },
  { status: 'expired' },
  { status: 'forbidden' },
  { status: 'maintenance' },
];

describe('protected shell gate', () => {
  it.each(blockedStates)('blocks protected shell for $status', (session) => {
    expect(canRenderProtectedShell(session)).toBe(false);
  });

  it('allows protected shell only with complete authenticated session shape', () => {
    expect(canRenderProtectedShell({
      status: 'authenticated',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'tenant_admin',
      expiresAt: '2026-08-12T12:00:00.000Z',
    })).toBe(true);
  });
});
