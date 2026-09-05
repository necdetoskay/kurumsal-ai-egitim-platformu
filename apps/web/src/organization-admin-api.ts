export interface OrganizationAdminHttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
}

export interface DepartmentMovePayload {
  newParentDepartmentId: string | null;
  expectedVersion?: number;
}

export class OrganizationAdminApi {
  constructor(private readonly http: OrganizationAdminHttpClient) {}

  listOrganizations() {
    return this.http.get('/api/v1/organizations');
  }

  getOrganizationTree(organizationId: string) {
    return this.http.get(`/api/v1/organizations/${encodeURIComponent(organizationId)}/tree`);
  }

  createCompany(organizationId: string, input: Record<string, unknown>) {
    assertNoTenantOverride(input);
    return this.http.post(`/api/v1/organizations/${encodeURIComponent(organizationId)}/companies`, input);
  }

  createDepartment(companyId: string, input: Record<string, unknown>) {
    assertNoTenantOverride(input);
    return this.http.post(`/api/v1/companies/${encodeURIComponent(companyId)}/departments`, input);
  }

  moveDepartment(departmentId: string, input: DepartmentMovePayload) {
    return this.http.post(`/api/v1/departments/${encodeURIComponent(departmentId)}/move`, input);
  }

  passivateCompany(companyId: string, expectedVersion?: number) {
    return this.http.post(`/api/v1/companies/${encodeURIComponent(companyId)}/passivate`, expectedVersion === undefined ? undefined : { expectedVersion });
  }

  reactivateCompany(companyId: string, expectedVersion?: number) {
    return this.http.post(`/api/v1/companies/${encodeURIComponent(companyId)}/reactivate`, expectedVersion === undefined ? undefined : { expectedVersion });
  }

  passivateDepartment(departmentId: string, expectedVersion?: number) {
    return this.http.post(`/api/v1/departments/${encodeURIComponent(departmentId)}/passivate`, expectedVersion === undefined ? undefined : { expectedVersion });
  }

  reactivateDepartment(departmentId: string, expectedVersion?: number) {
    return this.http.post(`/api/v1/departments/${encodeURIComponent(departmentId)}/reactivate`, expectedVersion === undefined ? undefined : { expectedVersion });
  }
}

export function assertNoTenantOverride(input: Record<string, unknown>): void {
  if ('tenantId' in input || 'tenant_id' in input) throw new Error('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
}
