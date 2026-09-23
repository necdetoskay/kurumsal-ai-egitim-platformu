import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { createDatabase } from '@kaep/db';
import type { AppConfig } from '@kaep/config';
import { persistConfirmedAudienceAssignments, AudienceAssignmentPersistenceError } from './audience-assignment-persistence.js';

type TrustedAudiencePrincipal = { tenantId: string; userId: string; role: 'tenant_admin' | 'instructor' };
type TrustedLearnerPrincipal = { tenantId: string; userId: string; role: 'learner' };

function trustedAudiencePrincipal(headers: Record<string, string | string[] | undefined>): TrustedAudiencePrincipal | null {
  // Temporary trusted-edge adapter: production ingress must strip client-supplied
  // x-kaep-* headers and inject verified identity. Never accept tenant_id from body/query.
  const tenantId = typeof headers['x-kaep-tenant-id'] === 'string' ? headers['x-kaep-tenant-id'].trim() : '';
  const userId = typeof headers['x-kaep-user-id'] === 'string' ? headers['x-kaep-user-id'].trim() : '';
  const role = headers['x-kaep-role'];
  if (!tenantId || !userId || (role !== 'tenant_admin' && role !== 'instructor')) return null;
  return { tenantId, userId, role };
}

function trustedLearnerPrincipal(headers: Record<string, string | string[] | undefined>): TrustedLearnerPrincipal | null {
  const tenantId = typeof headers['x-kaep-tenant-id'] === 'string' ? headers['x-kaep-tenant-id'].trim() : '';
  const userId = typeof headers['x-kaep-user-id'] === 'string' ? headers['x-kaep-user-id'].trim() : '';
  if (!tenantId || !userId || headers['x-kaep-role'] !== 'learner') return null;
  return { tenantId, userId, role: 'learner' };
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

  app.get('/api/v1/learner/assignments', async (request, reply) => {
    const principal = trustedLearnerPrincipal(request.headers);
    if (!principal) return reply.code(401).send({ code: 'SESSION_REQUIRED' });
    const result = await database.pool.query(
      `select a.id, a.training_id as "trainingId", a.training_version_id as "trainingVersionId",
              a.status, a.assigned_at as "assignedAt", a.completed_at as "completedAt",
              t.title, t.description
         from training_assignments a
         join trainings t on t.id = a.training_id and t.tenant_id = a.tenant_id
        where a.tenant_id = $1 and a.learner_id = $2
        order by a.assigned_at desc`,
      [principal.tenantId, principal.userId],
    );
    return { items: result.rows };
  });

  app.get('/api/v1/learner/trainings/:trainingId', async (request, reply) => {
    const principal = trustedLearnerPrincipal(request.headers);
    if (!principal) return reply.code(401).send({ code: 'SESSION_REQUIRED' });
    const { trainingId } = request.params as { trainingId: string };
    const result = await database.pool.query(
      `select a.id as "assignmentId", a.training_id as "trainingId",
              a.training_version_id as "trainingVersionId", a.status,
              t.title, t.description, v.version, v.snapshot
         from training_assignments a
         join trainings t on t.id = a.training_id and t.tenant_id = a.tenant_id
         join training_versions v on v.id = a.training_version_id and v.training_id = a.training_id and v.tenant_id = a.tenant_id
        where a.tenant_id = $1 and a.learner_id = $2 and a.training_id = $3
        order by a.assigned_at desc limit 1`,
      [principal.tenantId, principal.userId, trainingId],
    );
    if (!result.rowCount) return reply.code(404).send({ code: 'TRAINING_NOT_ASSIGNED' });
    return result.rows[0];
  });

  app.put('/api/v1/learner/progress/:trainingVersionId', async (request, reply) => {
    const principal = trustedLearnerPrincipal(request.headers);
    if (!principal) return reply.code(401).send({ code: 'SESSION_REQUIRED' });
    const { trainingVersionId } = request.params as { trainingVersionId: string };
    const body = (request.body ?? {}) as { assignmentId?: string; sourceId?: string; completed?: boolean; tenantId?: string; learnerId?: string };
    if ('tenantId' in body || 'learnerId' in body) return reply.code(400).send({ code: 'CLIENT_IDENTITY_OVERRIDE_FORBIDDEN' });
    if (!body.assignmentId || !body.sourceId) return reply.code(400).send({ code: 'INVALID_REQUEST' });

    const assignment = await database.pool.query(
      `select id, training_id from training_assignments
        where id = $1 and tenant_id = $2 and learner_id = $3 and training_version_id = $4 and status = 'ACTIVE'`,
      [body.assignmentId, principal.tenantId, principal.userId, trainingVersionId],
    );
    if (!assignment.rowCount) return reply.code(404).send({ code: 'ASSIGNMENT_NOT_AVAILABLE' });

    const payload = JSON.stringify({ completed: body.completed === true });
    const written = await database.pool.query(
      `insert into learning_evidence
        (tenant_id, assignment_id, learner_id, training_id, training_version_id, type, source_id, payload, occurred_at)
       values ($1,$2,$3,$4,$5,'MODULE_COMPLETED',$6,$7::jsonb,now())
       on conflict (tenant_id, assignment_id, type, source_id) do nothing
       returning id, occurred_at as "occurredAt"`,
      [principal.tenantId, body.assignmentId, principal.userId, assignment.rows[0].training_id, trainingVersionId, body.sourceId, payload],
    );
    if (written.rowCount) return reply.code(201).send({ replayed: false, evidence: written.rows[0] });
    const existing = await database.pool.query(
      `select id, occurred_at as "occurredAt", payload from learning_evidence
        where tenant_id=$1 and assignment_id=$2 and type='MODULE_COMPLETED' and source_id=$3`,
      [principal.tenantId, body.assignmentId, body.sourceId],
    );
    return reply.code(200).send({ replayed: true, evidence: existing.rows[0] });
  });

  app.get('/api/v1/learner/trainings/:trainingVersionId/resume', async (request, reply) => {
    const principal = trustedLearnerPrincipal(request.headers);
    if (!principal) return reply.code(401).send({ code: 'SESSION_REQUIRED' });
    const { trainingVersionId } = request.params as { trainingVersionId: string };
    const result = await database.pool.query(
      `select e.source_id as "sourceId", e.payload, e.occurred_at as "occurredAt"
         from learning_evidence e
         join training_assignments a on a.id=e.assignment_id and a.tenant_id=e.tenant_id
        where e.tenant_id=$1 and e.learner_id=$2 and e.training_version_id=$3
        order by e.occurred_at desc`,
      [principal.tenantId, principal.userId, trainingVersionId],
    );
    return { trainingVersionId, progress: result.rows };
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
