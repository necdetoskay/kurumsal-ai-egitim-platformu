import { describe, expect, it } from 'vitest';
import { canRenderProtectedShell } from './auth';

describe('auth boundary regression', () => {
  it('does not treat verification-required as authenticated', () => {
    expect(canRenderProtectedShell({ status: 'verification-required', challenge: 'mfa' })).toBe(false);
  });
});
