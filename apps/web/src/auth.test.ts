import { describe, expect, it } from 'vitest';
import { canRenderProtectedShell, roleFromSession, safeReturnPath, sessionMessage, type SessionState } from './auth';

describe('safeReturnPath', () => {
  it('accepts same-origin relative paths', () => {
    expect(safeReturnPath('/learner/trainings?tab=active#resume')).toBe('/learner/trainings?tab=active#resume');
  });

  it('rejects absolute and protocol-relative redirects', () => {
    expect(safeReturnPath('https://evil.example/phish')).toBe('/');
    expect(safeReturnPath('//evil.example/phish')).toBe('/');
  });

  it('fails closed for missing return paths', () => {
    expect(safeReturnPath(undefined)).toBe('/');
    expect(safeReturnPath(null)).toBe('/');
  });
});

describe('session boundary', () => {
  const authenticated: SessionState = {
    status: 'authenticated',
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: 'learner',
    expiresAt: '2026-08-12T12:00:00.000Z',
  };

  it('renders protected shell only for authenticated sessions', () => {
    expect(canRenderProtectedShell(authenticated)).toBe(true);
    expect(canRenderProtectedShell({ status: 'expired' })).toBe(false);
    expect(canRenderProtectedShell({ status: 'unauthenticated' })).toBe(false);
  });

  it('derives role only from authenticated session state', () => {
    expect(roleFromSession(authenticated)).toBe('learner');
    expect(roleFromSession({ status: 'forbidden' })).toBeNull();
  });

  it('keeps forbidden copy generic and tenant-safe', () => {
    const copy = sessionMessage({ status: 'forbidden' });
    expect(copy.detail).not.toContain('tenant');
    expect(copy.detail).not.toContain('resource');
  });

  it('exposes explicit MFA verification state', () => {
    expect(sessionMessage({ status: 'verification-required', challenge: 'mfa' }).title).toContain('doğrulama');
  });
});
