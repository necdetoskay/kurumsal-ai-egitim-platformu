import { afterEach, describe, expect, it } from 'vitest';
import type { AppConfig } from '@kaep/config';
import { buildApp } from './app.js';

const config: AppConfig = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 3000,
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'postgresql://kaep:kaep@localhost:5432/kaep',
  REDIS_URL: 'redis://localhost:6379',
};

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('foundation health endpoints', () => {
  it('returns liveness without requiring dependency calls', async () => {
    const app = buildApp(config);
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
