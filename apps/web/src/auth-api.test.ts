import { describe, expect, it } from 'vitest';
import { mapSessionResponse } from './auth-api';

describe('auth API mapping', () => {
  it('maps authenticated session into protected shell state', () => {
    expect(mapSessionResponse({
      status: 200,
      body: { state: 'authenticated', principal: { userId: 'u1', tenantId: 't1', role: 'reviewer', expiresAt: '2026-08-12T12:00:00.000Z' } },
    })).toEqual({ status: 'authenticated', userId: 'u1', tenantId: 't1', role: 'reviewer', expiresAt: '2026-08-12T12:00:00.000Z' });
  });

  it('maps 401 variants explicitly', () => {
    expect(mapSessionResponse({ status: 401, body: { state: 'unauthenticated' } })).toEqual({ status: 'unauthenticated' });
    expect(mapSessionResponse({ status: 401, body: { state: 'expired' } })).toEqual({ status: 'expired' });
    expect(mapSessionResponse({ status: 401, body: { state: 'verification-required', challenge: 'mfa' } })).toEqual({ status: 'verification-required', challenge: 'mfa' });
  });

  it('maps 403 and maintenance fail closed', () => {
    expect(mapSessionResponse({ status: 403, body: { state: 'forbidden' } })).toEqual({ status: 'forbidden' });
    expect(mapSessionResponse({ status: 503, body: { state: 'maintenance' } })).toEqual({ status: 'maintenance' });
  });
});
