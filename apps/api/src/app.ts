import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { createDatabase } from '@kaep/db';
import type { AppConfig } from '@kaep/config';
import { persistConfirmedAudienceAssignments, AudienceAssignmentPersistenceError } from './audience-assignment-persistence.js';
import { createAuthenticator, AuthenticationError } from './authentication.js';
import { createOrganizationRuntime } from './organization-runtime.js';
import { createLearnerRuntime, LearnerRuntimeError, type ProgressKind } from './learner-runtime.js';
import { createAssessmentRuntime, AssessmentRuntimeError } from './assessment-runtime.js';
import { createInsightRuntime, InsightRuntimeError } from './insight-runtime.js';
import { createOrganizationAnalyticsRuntime, OrganizationAnalyticsError, type AnalyticsScopeType } from './organization-analytics-runtime.js';

export function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
  });

  const database = createDatabase(config.DATABASE_URL);
  const authenticate = createAuthenticator(config, database);
  const organizationRuntime = createOrganizationRuntime(database);
  const learnerRuntime = createLearnerRuntime(database);
  const assessmentRuntime = createAssessmentRuntime(database);
  const insightRuntime = createInsightRuntime(database);
  const organizationAnalyticsRuntime = createOrganizationAnalyticsRuntime(database);
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

  async function learnerPrincipal(request:any, reply:any) {
    try {
      const principal=await authenticate(request.headers.authorization);
      if (!principal.roleCodes.includes('learner')) { reply.code(403).send({code:'INSUFFICIENT_ROLE'}); return null; }
      return principal;
    } catch (error) {
      reply.code(401).send({code:error instanceof AuthenticationError ? error.code : 'TOKEN_INVALID'}); return null;
    }
  }
  function learnerError(reply:any,error:unknown) {
    if(error instanceof LearnerRuntimeError){
      const status=error.code==='INVALID_PROGRESS'?400:404;
      return reply.code(status).send({code:error.code});
    }
    throw error;
  }

  app.get('/api/v1/learner/assignments', async (request,reply)=>{
    const p=await learnerPrincipal(request,reply); if(!p)return;
    return {items:await learnerRuntime.listAssignments(p)};
  });

  app.get('/api/v1/learner/trainings/:trainingId', async (request,reply)=>{
    const p=await learnerPrincipal(request,reply); if(!p)return;
    const {trainingId}=request.params as {trainingId:string};
    const result=await learnerRuntime.getTraining(p,trainingId);
    return result??reply.code(404).send({code:'TRAINING_NOT_ASSIGNED'});
  });

  app.put('/api/v1/learner/progress/:trainingVersionId', async (request,reply)=>{
    const p=await learnerPrincipal(request,reply); if(!p)return;
    const {trainingVersionId}=request.params as {trainingVersionId:string};
    const b=(request.body??{}) as any;
    if('tenantId' in b||'learnerId' in b)return reply.code(400).send({code:'CLIENT_IDENTITY_OVERRIDE_FORBIDDEN'});
    if(!b.assignmentId||!b.sourceId)return reply.code(400).send({code:'INVALID_REQUEST'});
    const kind=(b.kind??'MODULE') as ProgressKind;
    const progressPermille=b.progressPermille??(b.completed===true?1000:0);
    try { return await learnerRuntime.putProgress(p,{assignmentId:b.assignmentId,trainingVersionId,kind,sourceId:b.sourceId,progressPermille,positionSeconds:b.positionSeconds,completed:b.completed}); }
    catch(error){ return learnerError(reply,error); }
  });

  async function itemProgress(request:any,reply:any,kind:ProgressKind,paramName:string){
    const p=await learnerPrincipal(request,reply); if(!p)return;
    const b=request.body??{};
    if('tenantId' in b||'learnerId' in b)return reply.code(400).send({code:'CLIENT_IDENTITY_OVERRIDE_FORBIDDEN'});
    if(!b.assignmentId||!b.trainingVersionId)return reply.code(400).send({code:'INVALID_REQUEST'});
    const sourceId=request.params[paramName];
    try { return await learnerRuntime.putProgress(p,{assignmentId:b.assignmentId,trainingVersionId:b.trainingVersionId,kind,sourceId,progressPermille:b.progressPermille??(b.completed===true?1000:0),positionSeconds:b.positionSeconds,completed:b.completed}); }
    catch(error){ return learnerError(reply,error); }
  }
  app.put('/api/v1/learner/modules/:moduleId/progress',(request,reply)=>itemProgress(request,reply,'MODULE','moduleId'));
  app.put('/api/v1/learner/contents/:contentId/progress',(request,reply)=>itemProgress(request,reply,'CONTENT','contentId'));
  app.put('/api/v1/learner/videos/:videoId/progress',(request,reply)=>itemProgress(request,reply,'VIDEO','videoId'));

  app.get('/api/v1/learner/trainings/:trainingVersionId/resume', async (request,reply)=>{
    const p=await learnerPrincipal(request,reply); if(!p)return;
    const {trainingVersionId}=request.params as {trainingVersionId:string};
    try { return await learnerRuntime.resume(p,trainingVersionId); }
    catch(error){ return learnerError(reply,error); }
  });

  app.get('/api/v1/learner/insights',async(request,reply)=>{
    const p=await learnerPrincipal(request,reply);if(!p)return;
    const {trainingVersionId}=request.query as {trainingVersionId?:string};
    if(!trainingVersionId)return reply.code(400).send({code:'TRAINING_VERSION_REQUIRED'});
    try{return await insightRuntime.getInsights(p,trainingVersionId);}
    catch(error){if(error instanceof InsightRuntimeError)return reply.code(404).send({code:error.code});throw error;}
  });

  function assessmentError(reply:any,error:unknown){
    if(error instanceof AssessmentRuntimeError){
      const status=error.code==='INVALID_ANSWER'?400:error.code==='ATTEMPT_NOT_MUTABLE'?409:404;
      return reply.code(status).send({code:error.code});
    }
    throw error;
  }
  app.get('/api/v1/learner/assessments',async(request,reply)=>{
    const p=await learnerPrincipal(request,reply);if(!p)return;
    return {items:await assessmentRuntime.listAssessments(p)};
  });
  app.post('/api/v1/assessments/:assessmentId/attempts',async(request,reply)=>{
    const p=await learnerPrincipal(request,reply);if(!p)return;
    const {assessmentId}=request.params as {assessmentId:string};
    try{return reply.code(201).send(await assessmentRuntime.startAttempt(p,assessmentId));}
    catch(error){return assessmentError(reply,error);}
  });
  app.get('/api/v1/attempts/:attemptId',async(request,reply)=>{
    const p=await learnerPrincipal(request,reply);if(!p)return;
    const {attemptId}=request.params as {attemptId:string};
    try{return await assessmentRuntime.getAttempt(p,attemptId);}catch(error){return assessmentError(reply,error);}
  });
  app.put('/api/v1/attempts/:attemptId/answers/:questionVersionId',async(request,reply)=>{
    const p=await learnerPrincipal(request,reply);if(!p)return;
    const {attemptId,questionVersionId}=request.params as {attemptId:string;questionVersionId:string};
    const b=(request.body??{}) as any;
    if('tenantId' in b||'learnerId' in b)return reply.code(400).send({code:'CLIENT_IDENTITY_OVERRIDE_FORBIDDEN'});
    try{return await assessmentRuntime.saveAnswer(p,attemptId,questionVersionId,b.selectedOptionIndex);}catch(error){return assessmentError(reply,error);}
  });
  app.post('/api/v1/attempts/:attemptId/submit',async(request,reply)=>{
    const p=await learnerPrincipal(request,reply);if(!p)return;
    const {attemptId}=request.params as {attemptId:string};
    try{return await assessmentRuntime.submitAttempt(p,attemptId);}catch(error){return assessmentError(reply,error);}
  });
  app.post('/api/v1/attempts/:attemptId/retake',async(request,reply)=>{
    const p=await learnerPrincipal(request,reply);if(!p)return;
    const {attemptId}=request.params as {attemptId:string};
    try{return reply.code(201).send(await assessmentRuntime.requestRetake(p,attemptId));}catch(error){return assessmentError(reply,error);}
  });
  app.get('/api/v1/learner/certificates',async(request,reply)=>{
    const p=await learnerPrincipal(request,reply);if(!p)return;
    return {items:await assessmentRuntime.listCertificates(p)};
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

  app.get('/api/v1/admin/learning-analytics', async (request,reply)=>{
    const p=await adminPrincipal(request,reply); if(!p)return;
    const q=(request.query??{}) as Record<string,unknown>;
    if('tenantId' in q||'learnerId' in q)return reply.code(400).send({code:'CLIENT_IDENTITY_OVERRIDE_FORBIDDEN'});
    const scopeType=q.scopeType as AnalyticsScopeType|undefined;
    const scopeId=typeof q.scopeId==='string'?q.scopeId:undefined;
    const trainingVersionId=typeof q.trainingVersionId==='string'?q.trainingVersionId:undefined;
    if(!scopeType||!['ORGANIZATION','COMPANY','DEPARTMENT','GROUP'].includes(scopeType)||!scopeId)return reply.code(400).send({code:'INVALID_ANALYTICS_SCOPE'});
    const input=trainingVersionId?{scopeType,scopeId,trainingVersionId}:{scopeType,scopeId};
    try { return await organizationAnalyticsRuntime.getAggregate(p,input); }
    catch(error){ if(error instanceof OrganizationAnalyticsError)return reply.code(404).send({code:error.code}); throw error; }
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
