export interface OperationsAdminHttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
}

export type AudienceTargetType = 'ORGANIZATION' | 'COMPANY' | 'DEPARTMENT' | 'GROUP' | 'EMPLOYEE';
export interface AudienceTargetInput { type: AudienceTargetType; id: string; }
export interface AudiencePreviewInput {
  organizationId: string;
  trainingId: string;
  trainingVersionId: string;
  targets: readonly AudienceTargetInput[];
}
export interface AudienceConfirmInput extends AudiencePreviewInput {
  resolutionFingerprint: string;
  idempotencyKey: string;
}

export class OperationsAdminApi {
  constructor(private readonly http: OperationsAdminHttpClient) {}

  listImports() { return this.http.get('/api/v1/organization-imports'); }
  getImport(importId: string) { return this.http.get(`/api/v1/organization-imports/${encodeURIComponent(importId)}`); }
  createImport(input: Record<string, unknown>) { assertNoTenantOverride(input); return this.http.post('/api/v1/organization-imports', input); }
  confirmImport(importId: string, input: Record<string, unknown>) { assertNoTenantOverride(input); return this.http.post(`/api/v1/organization-imports/${encodeURIComponent(importId)}/confirm`, input); }

  listIntegrations() { return this.http.get('/api/v1/organization-integrations'); }
  configureIntegration(integrationId: string, input: Record<string, unknown>) { assertNoTenantOverride(input); return this.http.post(`/api/v1/organization-integrations/${encodeURIComponent(integrationId)}/configure`, input); }

  listAudit(query = '') { return this.http.get(`/api/v1/organization-audit${query ? `?${query}` : ''}`); }

  previewAudience(input: AudiencePreviewInput) { return this.http.post('/api/v1/training-audiences/preview', input); }
  confirmAudience(input: AudienceConfirmInput) { return this.http.post('/api/v1/training-audiences/confirm', input); }
}

export function assertNoTenantOverride(input: Record<string, unknown>): void {
  if ('tenantId' in input || 'tenant_id' in input) throw new Error('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
}
