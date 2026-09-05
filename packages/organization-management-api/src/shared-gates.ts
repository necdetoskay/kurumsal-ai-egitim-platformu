import type { AuthContext, ErrorEnvelope } from './index.js';

export type ScopeType = 'TENANT' | 'ORGANIZATION' | 'COMPANY' | 'DEPARTMENT';

export interface TrustedSessionContext {
  tenantId: string;
  userId: string;
  permissions: readonly string[];
  correlationId: string;
}

export interface ScopedResource {
  tenantId: string;
  organizationId?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
}

export class ApiGateError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 409 | 422,
    public readonly code: string,
  ) {
    super(code);
    this.name = 'ApiGateError';
  }
}

export function authContextFromTrustedSession(session: TrustedSessionContext): AuthContext {
  if (!session.tenantId || !session.userId || !session.correlationId) {
    throw new ApiGateError(401, 'UNAUTHENTICATED');
  }
  return {
    tenantId: session.tenantId,
    userId: session.userId,
    permissions: session.permissions,
    correlationId: session.correlationId,
  };
}

export function assertPermission(context: AuthContext, requiredPermission: string): void {
  if (!context.permissions.includes(requiredPermission)) {
    throw new ApiGateError(403, 'FORBIDDEN');
  }
}

export function assertResourceScope(context: AuthContext, resource: ScopedResource, expected?: {
  organizationId?: string;
  companyId?: string;
  departmentId?: string;
}): void {
  if (resource.tenantId !== context.tenantId) {
    throw new ApiGateError(422, 'CROSS_TENANT_REFERENCE');
  }
  if (expected?.organizationId !== undefined && resource.organizationId !== expected.organizationId) {
    throw new ApiGateError(422, 'CROSS_ORGANIZATION_REFERENCE');
  }
  if (expected?.companyId !== undefined && resource.companyId !== expected.companyId) {
    throw new ApiGateError(422, 'CROSS_COMPANY_DEPARTMENT_REFERENCE');
  }
  if (expected?.departmentId !== undefined && resource.departmentId !== expected.departmentId) {
    throw new ApiGateError(403, 'FORBIDDEN');
  }
}

export interface IdempotencyRecord<T> {
  requestHash: string;
  result: T;
}

export interface IdempotencyStore {
  get<T>(tenantId: string, operation: string, key: string): Promise<IdempotencyRecord<T> | null>;
  put<T>(tenantId: string, operation: string, key: string, record: IdempotencyRecord<T>): Promise<void>;
}

export async function executeIdempotent<T>(input: {
  context: AuthContext;
  operation: string;
  key: string | undefined;
  requestHash: string;
  store: IdempotencyStore;
  execute: () => Promise<T>;
}): Promise<{ replayed: boolean; result: T }> {
  if (!input.key) throw new ApiGateError(400, 'VALIDATION_ERROR');
  const existing = await input.store.get<T>(input.context.tenantId, input.operation, input.key);
  if (existing) {
    if (existing.requestHash !== input.requestHash) {
      throw new ApiGateError(409, 'IDEMPOTENCY_CONFLICT');
    }
    return { replayed: true, result: existing.result };
  }
  const result = await input.execute();
  await input.store.put(input.context.tenantId, input.operation, input.key, { requestHash: input.requestHash, result });
  return { replayed: false, result };
}

export function assertExpectedVersion(currentVersion: number, expectedVersion: number | undefined): void {
  if (expectedVersion === undefined) throw new ApiGateError(400, 'VALIDATION_ERROR');
  if (currentVersion !== expectedVersion) throw new ApiGateError(409, 'VERSION_CONFLICT');
}

export function resolveExpectedVersion(input: { ifMatch?: string; expectedVersion?: number }): number | undefined {
  if (input.expectedVersion !== undefined) return input.expectedVersion;
  if (input.ifMatch === undefined) return undefined;
  const normalized = input.ifMatch.replace(/^W\//, '').replace(/^"|"$/g, '');
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export function gateErrorEnvelope(error: unknown, correlationId: string): { status: number; body: ErrorEnvelope } {
  if (error instanceof ApiGateError) {
    return {
      status: error.status,
      body: { error: { code: error.code, message: 'İşlem gerçekleştirilemedi.', correlationId } },
    };
  }
  return {
    status: 422,
    body: { error: { code: 'VALIDATION_ERROR', message: 'İşlem gerçekleştirilemedi.', correlationId } },
  };
}
