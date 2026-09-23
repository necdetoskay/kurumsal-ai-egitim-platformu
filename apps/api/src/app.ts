import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { createDatabase } from '@kaep/db';
import type { AppConfig } from '@kaep/config';
import { persistConfirmedAudienceAssignments, AudienceAssignmentPersistenceError } from './audience-assignment-persistence.js';

type TrustedAudiencePrincipal = { tenantId: string; userId: string; role: 'tenant_admin' | 'instructor' };

function trustedAudiencePrincipal(headers: Record<string, string | string[] | undefined>): TrustedAudiencePrincipal | null {
  // Temporary trusted-edge adapter: production ingress must strip client-supplied
  // x-kaep-* headers and inject verified identity. Never accept tenant_id from body/query.
  const tenantId = typeof headers['x-kaep-tenant-id'] === 'string' ? headers['x-kaep-tenant-id'].trim() : '';
  const userId = typeof headers['x-kaep-user-id'] === 'string' ? headers['x-kaep-user-id'].trim() : '';
  const role = headers['x-kaep-role'];
  if (!tenantId || !userId || (role !== 'tenant_admin' && role !== 'instructor')) return null;
  return { tenantId, userId, role };
}

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

  app.post('/api/v1/training-audiences/:resolutionId/assignments', async (request, reply) => {
    const principal = trustedAudiencePrincipal(request.headers);
    if (!principal) return reply.code(401).send({ code: 'SESSION_REQUIRED' });

    const params = request.params as { resolutionId: string };
    const body = (request.body ?? {}) as Partial<{
      tenantId: string;
      trainingId: string;
      trainingVersionId: string;
      resolutionFingerprint: string;
      idempotencyKey: string;
    }>;

    if ('tenantId' in body) return reply.code(400).send({ code: 'CLIENT_TENANT_OVERRIDE_FORBIDDEN' });
    if (!body.trainingId || !body.trainingVersionId || !body.resolutionFingerprint || !body.idempotencyKey) {
      return reply.code(400).send({ code: 'INVALID_REQUEST' });
    }

    try {
      const execution = await persistConfirmedAudienceAssignments(database, {
        tenantId: principal.tenantId,
        trainingId: body.trainingId,
        trainingVersionId: body.trainingVersionId,
        resolutionId: params.resolutionId,
        resolutionFingerprint: body.resolutionFingerprint,
        idempotencyKey: body.idempotencyKey,
      });
      return reply.code(execution.replayed ? 200 : 201).send(execution);
    } catch (error) {
      if (error instanceof AudienceAssignmentPersistenceError) {
        const status = error.code === 'RESOLUTION_NOT_AVAILABLE' ? 404
          : error.code === 'RESOLUTION_SCOPE_MISMATCH' || error.code === 'LEARNER_NOT_ASSIGNABLE' ? 403
          : error.code.includes('IDEMPOTENCY') || error.code.includes('CONFLICT') ? 409
          : 400;
        return reply.code(status).send({ code: error.code });
      }
      request.log.error({ err: error }, 'audience assignment failed');
      return reply.code(500).send({ code: 'INTERNAL_ERROR' });
    }
  });

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
