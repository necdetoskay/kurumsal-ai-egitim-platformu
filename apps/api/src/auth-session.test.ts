import { describe, expect, it } from 'vitest';
import { logoutResult, projectSession } from './auth-session.js';

const principal = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'learner' as const,
  expiresAt: '2026-08-12T12:00:00.000Z',
  verified: true,
};

describe('auth session projection', () => {
  it('returns authenticated principal without secrets', () => {
    expect(projectSession({ principal, now: '2026-08-12T10:00:00.000Z' })).toEqual({
      status: 200,
      body: { state: 'authenticated', principal },
    });
  });

  it('maps missing and expired sessions to 401', () => {
    expect(projectSession({ principal: null, now: '2026-08-12T10:00:00.000Z' }).body).toEqual({ state: 'unauthenticated' });
    expect(projectSession({ principal, now: '2026-08-12T13:00:00.000Z' }).body).toEqual({ state: 'expired' });
  });

  it('requires verification before authorization', () => {
    expect(projectSession({ principal: { ...principal, verified: false }, now: '2026-08-12T10:00:00.000Z', challenge: 'mfa' })).toEqual({
      status: 401,
      body: { state: 'verification-required', challenge: 'mfa' },
    });
  });

  it('does not disclose resource or tenant detail on forbidden', () => {
    expect(projectSession({ principal, now: '2026-08-12T10:00:00.000Z', authorized: false })).toEqual({
      status: 403,
      body: { state: 'forbidden' },
    });
  });

  it('uses 204 logout result', () => {
    expect(logoutResult()).toEqual({ status: 204 });
  });
});
