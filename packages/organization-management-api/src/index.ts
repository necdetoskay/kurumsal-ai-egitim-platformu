export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface AuthContext {
  tenantId: string;
  userId: string;
  permissions: readonly string[];
  correlationId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  correlationId: string;
}

export interface ResourceEnvelope<T> {
  data: T;
  meta: { correlationId: string };
}

export interface CollectionEnvelope<T> {
  data: T[];
  meta: { nextCursor: string | null; count: number; correlationId: string };
}

export interface ErrorEnvelope { error: ApiError; }
export interface RouteContract { method: HttpMethod; path: string; mutation: boolean; lifecycleCommand?: boolean; }

export const coreOrganizationRoutes: readonly RouteContract[] = [
  { method: 'GET', path: '/api/v1/organizations', mutation: false },
  { method: 'POST', path: '/api/v1/organizations', mutation: true },
  { method: 'GET', path: '/api/v1/organizations/:organizationId', mutation: false },
  { method: 'PATCH', path: '/api/v1/organizations/:organizationId', mutation: true },
  { method: 'POST', path: '/api/v1/organizations/:organizationId/passivate', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/organizations/:organizationId/reactivate', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/organizations/:organizationId/companies', mutation: false },
  { method: 'POST', path: '/api/v1/organizations/:organizationId/companies', mutation: true },
  { method: 'GET', path: '/api/v1/companies/:companyId', mutation: false },
  { method: 'PATCH', path: '/api/v1/companies/:companyId', mutation: true },
  { method: 'POST', path: '/api/v1/companies/:companyId/passivate', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/companies/:companyId/reactivate', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/companies/:companyId/departments', mutation: false },
  { method: 'POST', path: '/api/v1/companies/:companyId/departments', mutation: true },
  { method: 'GET', path: '/api/v1/departments/:departmentId', mutation: false },
  { method: 'PATCH', path: '/api/v1/departments/:departmentId', mutation: true },
  { method: 'POST', path: '/api/v1/departments/:departmentId/move', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/departments/:departmentId/passivate', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/departments/:departmentId/reactivate', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/organizations/:organizationId/positions', mutation: false },
  { method: 'POST', path: '/api/v1/organizations/:organizationId/positions', mutation: true },
  { method: 'GET', path: '/api/v1/positions/:positionId', mutation: false },
  { method: 'PATCH', path: '/api/v1/positions/:positionId', mutation: true },
  { method: 'POST', path: '/api/v1/positions/:positionId/passivate', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/positions/:positionId/reactivate', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/organizations/:organizationId/locations', mutation: false },
  { method: 'POST', path: '/api/v1/organizations/:organizationId/locations', mutation: true },
  { method: 'GET', path: '/api/v1/locations/:locationId', mutation: false },
  { method: 'PATCH', path: '/api/v1/locations/:locationId', mutation: true },
  { method: 'POST', path: '/api/v1/locations/:locationId/passivate', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/locations/:locationId/reactivate', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/organizations/:organizationId/tree', mutation: false },
] as const;

export interface CoreResourceAuthorizer {
  assertTenantAccess(context: AuthContext): Promise<void>;
  assertOrganizationAccess(context: AuthContext, organizationId: string, action: 'read' | 'write'): Promise<void>;
  assertCompanyAccess(context: AuthContext, companyId: string, action: 'read' | 'write'): Promise<void>;
  assertDepartmentAccess(context: AuthContext, departmentId: string, action: 'read' | 'write'): Promise<void>;
}

export interface CoreResourceService {
  listOrganizations(context: AuthContext, query: Record<string, unknown>): Promise<CollectionEnvelope<unknown>>;
  getOrganization(context: AuthContext, organizationId: string): Promise<ResourceEnvelope<unknown>>;
  createOrganization(context: AuthContext, input: Record<string, unknown>): Promise<ResourceEnvelope<unknown>>;
  updateOrganization(context: AuthContext, organizationId: string, input: Record<string, unknown>): Promise<ResourceEnvelope<unknown>>;
  passivateOrganization(context: AuthContext, organizationId: string, expectedVersion?: number): Promise<ResourceEnvelope<unknown>>;
  reactivateOrganization(context: AuthContext, organizationId: string, expectedVersion?: number): Promise<ResourceEnvelope<unknown>>;
  moveDepartment(context: AuthContext, departmentId: string, input: { newParentDepartmentId: string | null; expectedVersion?: number }): Promise<ResourceEnvelope<unknown>>;
}

const forbiddenPayloadKeys = new Set(['tenantId', 'tenant_id']);
export function assertNoClientTenantOverride(payload: Record<string, unknown>): void { for (const key of forbiddenPayloadKeys) if (Object.prototype.hasOwnProperty.call(payload, key)) throw new Error('CLIENT_TENANT_OVERRIDE_FORBIDDEN'); }
export function resourceEnvelope<T>(data: T, correlationId: string): ResourceEnvelope<T> { return { data, meta: { correlationId } }; }
export function collectionEnvelope<T>(data: T[], correlationId: string, nextCursor: string | null = null): CollectionEnvelope<T> { return { data, meta: { nextCursor, count: data.length, correlationId } }; }
export function errorEnvelope(code: string, correlationId: string, details?: unknown): ErrorEnvelope { return { error: { code, message: 'İşlem gerçekleştirilemedi.', ...(details !== undefined ? { details } : {}), correlationId } }; }

export * from './employee-employment.js';
export * from './group-role.js';
export * from './shared-gates.js';
export * from './integrations.js';
