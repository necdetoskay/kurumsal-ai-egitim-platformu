import { describe, expect, it } from 'vitest';
import { sessionMessage, type SessionState } from './auth';

const states: SessionState[] = [
  { status: 'bootstrapping' },
  { status: 'unauthenticated' },
  { status: 'verification-required', challenge: 'email' },
  { status: 'authenticated', userId: 'u', tenantId: 't', role: 'reviewer', expiresAt: '2026-08-12T12:00:00.000Z' },
  { status: 'expired' },
  { status: 'forbidden' },
  { status: 'maintenance' },
];

describe('session state coverage', () => {
  it('provides user-facing copy for every session state', () => {
    for (const state of states) {
      expect(sessionMessage(state).title.length).toBeGreaterThan(0);
      expect(sessionMessage(state).detail.length).toBeGreaterThan(0);
    }
  });
});
