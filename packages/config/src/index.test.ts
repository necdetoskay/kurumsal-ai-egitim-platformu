import { describe, expect, it } from 'vitest';
import { loadConfig } from './index.js';

describe('loadConfig', () => {
  it('parses required runtime configuration', () => {
    const config = loadConfig({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      REDIS_URL: 'redis://localhost:6379',
    });

    expect(config.API_PORT).toBe(3000);
    expect(config.NODE_ENV).toBe('development');
  });

  it('rejects invalid dependency URLs', () => {
    expect(() =>
      loadConfig({
        DATABASE_URL: 'not-a-url',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toThrow();
  });
});
