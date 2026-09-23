import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '@kaep/config';

vi.mock('./authentication.js', () => ({
  AuthenticationError: class AuthenticationError extends Error {},
  createAuthenticator: () => async (authorization: string | undefined) => {
    if (!authorization?.startsWith('Bearer ')) throw new Error('TOKEN_REQUIRED');
    return { tenantId: 'tenant-a', userId: 'admin-a', roleCodes: ['tenant_admin'], permissions: [] };
  },
}));

vi.mock('./audience-assignment-persistence.js', async () => {
  class AudienceAssignmentPersistenceError extends Error {
    constructor(public readonly code: string) { super(code); }
  }
  return {
    AudienceAssignmentPersistenceError,
    persistConfirmedAudienceAssignments: vi.fn(async (_db: unknown, input: any) => ({
      replayed: false,
      result: { resolutionId: input.resolutionId, createdCount: 1, reusedCount: 0 },
    })),
  };
});

import { buildApp } from './app.js';

const config: AppConfig = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 3000,
  DATABASE_URL: 'postgresql://kaep:kaep@127.0.0.1:5432/kaep',
  REDIS_URL: 'redis://127.0.0.1:6379',
  LOG_LEVEL: 'silent',
  AUTH_JWKS_URL: 'https://auth.invalid/.well-known/jwks.json',
  AUTH_ISSUER: 'https://auth.invalid/',
  AUTH_AUDIENCE: 'kaep-api',
};

const apps: ReturnType<typeof buildApp>[] = [];
afterEach(async () => { while (apps.length) await apps.pop()!.close(); });

describe('M1 audience assignment HTTP boundary', () => {
  it('fails closed without trusted session context', async () => {
    const app = buildApp(config); apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/training-audiences/r1/assignments',
      payload: { trainingId: 't1', trainingVersionId: 'v1', resolutionFingerprint: 'a'.repeat(64), idempotencyKey: 'k1' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects client tenant override', async () => {
    const app = buildApp(config); apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/training-audiences/r1/assignments',
      headers: { authorization: 'Bearer test-token' },
      payload: { tenantId: 'tenant-b', trainingId: 't1', trainingVersionId: 'v1', resolutionFingerprint: 'a'.repeat(64), idempotencyKey: 'k1' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: 'CLIENT_TENANT_OVERRIDE_FORBIDDEN' });
  });

  it('binds trusted tenant to persistence boundary', async () => {
    const app = buildApp(config); apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/training-audiences/r1/assignments',
      headers: { authorization: 'Bearer test-token' },
      payload: { trainingId: 't1', trainingVersionId: 'v1', resolutionFingerprint: 'a'.repeat(64), idempotencyKey: 'k1' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().result.resolutionId).toBe('r1');
  });
});
