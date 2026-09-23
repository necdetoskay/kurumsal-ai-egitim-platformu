import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { createDatabase } from '@kaep/db';
import type { AppConfig } from '@kaep/config';
import { persistConfirmedAudienceAssignments, AudienceAssignmentPersistenceError } from './audience-assignment-persistence.js';
import { createAuthenticator, AuthenticationError } from './authentication.js';
import { createOrganizationRuntime } from './organization-runtime.js';

export function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
  });

  const database = createDatabase(config.DATABASE_URL);
  const authenticate = createAuthenticator(config, database);
  const organizationRuntime = createOrganizationRuntime(database);
  const redis = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  app.get('/healthz', async () => ({ status: 'ok' }));

  app.post('/api/v1/training-audiences/:resolutionId/assignments', async (request, reply) => {
    let principal;
    try { principal = await authenticate(request.headers.authorization); }
    catch (error) { return reply.code(401).send({ code: error instanceof AuthenticationError ? error.code : 'TOKEN_INVALID' }); }
    if (!principal.roleCodes.some((role) => role === 'tenant_admin' || role === 'instructor')) return reply.code(403).send({ code: 'INSUFFICIENT_ROLE' });

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
    let principal;
    try { principal = await authenticate(request.headers.authorization); }
    catch (error) { return reply.code(401).send({ code: error instanceof AuthenticationError ? error.code : 'TOKEN_INVALID' }); }
    if (!principal.roleCodes.includes('learner')) return reply.code(403).send({ code: 'INSUFFICIENT_ROLE' });
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
    let principal;
    try { principal = await authenticate(request.headers.authorization); }
    catch (error) { return reply.code(401).send({ code: error instanceof AuthenticationError ? error.code : 'TOKEN_INVALID' }); }
    if (!principal.roleCodes.includes('learner')) return reply.code(403).send({ code: 'INSUFFICIENT_ROLE' });
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
    let principal;
    try { principal = await authenticate(request.headers.authorization); }
    catch (error) { return reply.code(401).send({ code: error instanceof AuthenticationError ? error.code : 'TOKEN_INVALID' }); }
    if (!principal.roleCodes.includes('learner')) return reply.code(403).send({ code: 'INSUFFICIENT_ROLE' });
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
    let principal;
    try { principal = await authenticate(request.headers.authorization); }
    catch (error) { return reply.code(401).send({ code: error instanceof AuthenticationError ? error.code : 'TOKEN_INVALID' }); }
    if (!principal.roleCodes.includes('learner')) return reply.code(403).send({ code: 'INSUFFICIENT_ROLE' });
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

  async function adminPrincipal(request:any, reply:any) {
    try {
      const principal=await authenticate(request.headers.authorization);
      if (!principal.roleCodes.includes('tenant_admin')) { reply.code(403).send({code:'FORBIDDEN'}); return null; }
      return principal;
    } catch (error) {
      reply.code(401).send({code:error instanceof AuthenticationError ? error.code : 'TOKEN_INVALID'}); return null;
    }
  }
  app.get('/api/v1/organizations', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; return {items:await organizationRuntime.listOrganizations(p)}; });
  app.post('/api/v1/organizations', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const b:any=request.body??{}; if(!b.name||!b.code)return reply.code(400).send({code:'INVALID_REQUEST'}); return reply.code(201).send(await organizationRuntime.createOrganization(p,b)); });
  app.get('/api/v1/organizations/:organizationId/tree', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {organizationId}=request.params as any; const v=await organizationRuntime.getOrganizationTree(p,organizationId); return v??reply.code(404).send({code:'ORGANIZATION_NOT_FOUND'}); });
  app.post('/api/v1/organizations/:organizationId/companies', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {organizationId}=request.params as any; const v=await organizationRuntime.createCompany(p,organizationId,request.body??{}); return v?reply.code(201).send(v):reply.code(404).send({code:'ORGANIZATION_NOT_FOUND'}); });
  app.post('/api/v1/companies/:companyId/departments', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {companyId}=request.params as any; const v=await organizationRuntime.createDepartment(p,companyId,request.body??{}); return v?reply.code(201).send(v):reply.code(404).send({code:'COMPANY_NOT_FOUND'}); });
  app.get('/api/v1/organizations/:organizationId/employees', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {organizationId}=request.params as any; return {items:await organizationRuntime.listEmployees(p,organizationId)}; });
  app.post('/api/v1/organizations/:organizationId/employees', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {organizationId}=request.params as any; const v=await organizationRuntime.createEmployee(p,organizationId,request.body??{}); return v?reply.code(201).send(v):reply.code(404).send({code:'ORGANIZATION_NOT_FOUND'}); });
  app.post('/api/v1/employees/:employeeId/employments', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {employeeId}=request.params as any; const v=await organizationRuntime.startEmployment(p,employeeId,request.body??{}); return v?reply.code(201).send(v):reply.code(404).send({code:'EMPLOYEE_NOT_FOUND'}); });
  app.get('/api/v1/organizations/:organizationId/groups', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {organizationId}=request.params as any; return {items:await organizationRuntime.listGroups(p,organizationId)}; });
  app.post('/api/v1/organizations/:organizationId/groups', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {organizationId}=request.params as any; const v=await organizationRuntime.createGroup(p,organizationId,request.body??{}); return v?reply.code(201).send(v):reply.code(404).send({code:'ORGANIZATION_NOT_FOUND'}); });
  app.post('/api/v1/groups/:groupId/members', async (request,reply)=>{ const p=await adminPrincipal(request,reply); if(!p)return; const {groupId}=request.params as any; const v=await organizationRuntime.addGroupMember(p,groupId,request.body??{}); return v?reply.code(201).send(v):reply.code(404).send({code:'GROUP_OR_EMPLOYEE_NOT_FOUND'}); });

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
