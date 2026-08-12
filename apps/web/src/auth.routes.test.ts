import { describe, expect, it } from 'vitest';
import { authRouteFor, buildLoginHref } from './auth.routes';

describe('authRouteFor', () => {
  it('maps unauthenticated and expired states explicitly', () => {
    expect(authRouteFor({ status: 'unauthenticated' })).toBe('/login');
    expect(authRouteFor({ status: 'expired' })).toBe('/session-expired');
  });

  it('maps verification state explicitly', () => {
    expect(authRouteFor({ status: 'verification-required', challenge: 'mfa' })).toBe('/verify');
  });
});

describe('buildLoginHref', () => {
  it('encodes a safe relative return path', () => {
    expect(buildLoginHref('/learner/trainings?tab=active')).toBe('/login?returnTo=%2Flearner%2Ftrainings%3Ftab%3Dactive');
  });

  it('drops unsafe external return targets', () => {
    expect(buildLoginHref('https://evil.example')).toBe('/login?returnTo=%2F');
  });
});
