import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { createDatabase } from '@kaep/db';
import type { AppConfig } from '@kaep/config';

export function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
  });

  const database = createDatabase(config.DATABASE_URL);
  const redis = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  app.get('/healthz', async () => ({ status: 'ok' }));

  app.get('/readyz', async (_request, reply) => {
    const checks = {
      postgres: 'unknown',
      redis: 'unknown',
    } as const;

    try {
      await database.ping();
      if (redis.status === 'wait') await redis.connect();
      await redis.ping();

      return {
        status: 'ready',
        checks: { postgres: 'ok', redis: 'ok' },
      };
    } catch (error) {
      app.log.error({ err: error }, 'readiness check failed');
      return reply.code(503).send({
        status: 'not_ready',
        checks,
      });
    }
  });

  app.addHook('onClose', async () => {
    await database.close();
    if (redis.status !== 'end') redis.disconnect();
  });

  return app;
}
