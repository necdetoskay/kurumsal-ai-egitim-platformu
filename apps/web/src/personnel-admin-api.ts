export interface PersonnelHttpClient {
  get(path: string): Promise<unknown>;
  post(path: string, body?: unknown): Promise<unknown>;
  patch(path: string, body: unknown): Promise<unknown>;
}

export interface TransferEmploymentPayload {
  companyId: string;
  departmentId?: string;
  positionId?: string;
  locationId?: string;
  managerEmployeeId?: string;
  employmentType?: string;
  effectiveDate: string;
  expectedVersion?: number;
}

export class PersonnelAdminApi {
  constructor(private readonly http: PersonnelHttpClient) {}

  listEmployees(query = '') { return this.http.get(`/api/v1/employees${query ? `?q=${encodeURIComponent(query)}` : ''}`); }
  getEmployee(employeeId: string) { return this.http.get(`/api/v1/employees/${encodeURIComponent(employeeId)}`); }
  getEmploymentHistory(employeeId: string) { return this.http.get(`/api/v1/employees/${encodeURIComponent(employeeId)}/employments`); }
  createEmployee(input: Record<string, unknown>) { assertNoTenantOverride(input); return this.http.post('/api/v1/employees', input); }
  updateEmployee(employeeId: string, input: Record<string, unknown>) { assertNoTenantOverride(input); return this.http.patch(`/api/v1/employees/${encodeURIComponent(employeeId)}`, input); }
  passivateEmployee(employeeId: string) { return this.http.post(`/api/v1/employees/${encodeURIComponent(employeeId)}/passivate`); }
  terminateEmployee(employeeId: string, body?: unknown) { return this.http.post(`/api/v1/employees/${encodeURIComponent(employeeId)}/terminate`, body); }
  transferEmployment(employeeId: string, input: TransferEmploymentPayload) {
    assertNoTenantOverride(input as unknown as Record<string, unknown>);
    return this.http.post(`/api/v1/employees/${encodeURIComponent(employeeId)}/employment-transfer`, input);
  }
}

export function assertNoTenantOverride(input: Record<string, unknown>): void {
  if ('tenantId' in input || 'tenant_id' in input) throw new Error('CLIENT_TENANT_OVERRIDE_FORBIDDEN');
}
