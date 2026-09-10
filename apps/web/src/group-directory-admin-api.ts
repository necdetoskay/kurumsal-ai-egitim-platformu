export interface GroupDirectoryHttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
}

export class GroupDirectoryAdminApi {
  constructor(private readonly http: GroupDirectoryHttpClient) {}
  listGroups(organizationId: string) { return this.http.get(`/api/v1/organizations/${encodeURIComponent(organizationId)}/groups`); }
  addManualMember(groupId: string, employeeId: string, validFrom: string) { return this.http.post(`/api/v1/groups/${encodeURIComponent(groupId)}/members`, { employeeId, validFrom }); }
  removeManualMember(groupId: string, employeeId: string, effectiveAt: string) { return this.http.post(`/api/v1/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(employeeId)}/remove`, { effectiveAt }); }
  listPositions(organizationId: string) { return this.http.get(`/api/v1/organizations/${encodeURIComponent(organizationId)}/positions`); }
  createPosition(organizationId: string, input: Record<string, unknown>) { assertNoTenantOverride(input); return this.http.post(`/api/v1/organizations/${encodeURIComponent(organizationId)}/positions`, input); }
  passivatePosition(id: string) { return this.http.post(`/api/v1/positions/${encodeURIComponent(id)}/passivate`); }
  reactivatePosition(id: string) { return this.http.post(`/api/v1/positions/${encodeURIComponent(id)}/reactivate`); }
  listLocations(organizationId: string) { return this.http.get(`/api/v1/organizations/${encodeURIComponent(organizationId)}/locations`); }
  createLocation(organizationId: string, input: Record<string, unknown>) { assertNoTenantOverride(input); return this.http.post(`/api/v1/organizations/${encodeURIComponent(organizationId)}/locations`, input); }
  passivateLocation(id: string) { return this.http.post(`/api/v1/locations/${encodeURIComponent(id)}/passivate`); }
  reactivateLocation(id: string) { return this.http.post(`/api/v1/locations/${encodeURIComponent(id)}/reactivate`); }
}

export function assertNoTenantOverride(input: Record<string, unknown>): void {
  if ('tenantId' in input || 'tenant_id' in input) throw new Error('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
}
