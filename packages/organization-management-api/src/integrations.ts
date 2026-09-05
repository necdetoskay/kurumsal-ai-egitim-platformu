import type { AuthContext, CollectionEnvelope, ResourceEnvelope, RouteContract } from './index.js';

export const organizationIntegrationRoutes: readonly RouteContract[] = [
  { method: 'POST', path: '/api/v1/organization-imports', mutation: true },
  { method: 'GET', path: '/api/v1/organization-imports/:importId', mutation: false },
  { method: 'POST', path: '/api/v1/organization-imports/:importId/preview', mutation: false },
  { method: 'POST', path: '/api/v1/organization-imports/:importId/confirm', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/organization-integrations', mutation: false },
  { method: 'GET', path: '/api/v1/organization-integrations/:integrationId', mutation: false },
  { method: 'POST', path: '/api/v1/organization-integrations/:integrationId/sync', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/organization-sync-jobs/:syncJobId', mutation: false },
  { method: 'GET', path: '/api/v1/organization-audit', mutation: false },
] as const;

export interface ImportCreateRequest { fileName: string; fileType: 'CSV' | 'XLSX'; mapping?: Record<string, string>; }
export interface ImportConfirmRequest { reviewed: true; conflictResolutions: Array<{ rowNumber: number; resolution: 'SKIP' | 'LINK_EXISTING' | 'TRANSFER'; targetEmployeeId?: string }>; }
export interface IntegrationSyncRequest { expectedSourceVersion?: string; }

export interface OrganizationIntegrationAuthorizer {
  assertOrganizationOperationsAccess(context: AuthContext, action: 'read' | 'write'): Promise<void>;
  assertAuditAccess(context: AuthContext): Promise<void>;
}

export interface OrganizationIntegrationApiService {
  createImport(context: AuthContext, input: ImportCreateRequest, idempotencyKey: string): Promise<ResourceEnvelope<unknown>>;
  getImport(context: AuthContext, importId: string): Promise<ResourceEnvelope<unknown>>;
  previewImport(context: AuthContext, importId: string): Promise<ResourceEnvelope<unknown>>;
  confirmImport(context: AuthContext, importId: string, input: ImportConfirmRequest, idempotencyKey: string): Promise<ResourceEnvelope<unknown>>;
  listIntegrations(context: AuthContext): Promise<CollectionEnvelope<unknown>>;
  runIntegrationSync(context: AuthContext, integrationId: string, input: IntegrationSyncRequest, idempotencyKey: string): Promise<ResourceEnvelope<unknown>>;
  getSyncJob(context: AuthContext, syncJobId: string): Promise<ResourceEnvelope<unknown>>;
  queryAudit(context: AuthContext, query: Record<string, unknown>): Promise<CollectionEnvelope<unknown>>;
}

export function assertImportConfirmReviewed(input: ImportConfirmRequest): void {
  if (input.reviewed !== true) throw new Error('IMPORT_REVIEW_REQUIRED');
}

export function assertIntegrationIdempotencyKey(value: string | undefined): string {
  if (!value?.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  return value.trim();
}
