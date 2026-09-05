import type { AuthContext, CollectionEnvelope, ResourceEnvelope, RouteContract } from './index.js';

export const employeeEmploymentRoutes: readonly RouteContract[] = [
  { method: 'GET', path: '/api/v1/organizations/:organizationId/employees', mutation: false },
  { method: 'POST', path: '/api/v1/organizations/:organizationId/employees', mutation: true },
  { method: 'GET', path: '/api/v1/employees/:employeeId', mutation: false },
  { method: 'PATCH', path: '/api/v1/employees/:employeeId', mutation: true },
  { method: 'POST', path: '/api/v1/employees/:employeeId/terminate', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/employees/:employeeId/reactivate', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/employees/:employeeId/employments', mutation: false },
  { method: 'POST', path: '/api/v1/employees/:employeeId/employments', mutation: true },
  { method: 'POST', path: '/api/v1/employments/:employmentId/end', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/employees/:employeeId/transfer', mutation: true, lifecycleCommand: true },
] as const;

export interface EmployeeEmploymentAuthorizer {
  assertOrganizationEmployeeAccess(
    context: AuthContext,
    organizationId: string,
    action: 'read' | 'write',
  ): Promise<void>;
  assertEmployeeAccess(context: AuthContext, employeeId: string, action: 'read' | 'write'): Promise<void>;
  assertEmploymentAccess(context: AuthContext, employmentId: string, action: 'read' | 'write'): Promise<void>;
}

export interface EmployeeCreateRequest {
  employeeNo?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: string | null;
}

export interface EmployeeTerminateRequest {
  terminationDate: string;
  reason?: string;
  expectedVersion: number;
}

export interface EmploymentStartRequest {
  companyId: string;
  departmentId: string | null;
  positionId: string | null;
  locationId: string | null;
  managerEmploymentId: string | null;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN' | 'OTHER';
  startDate: string;
  isPrimary: boolean;
}

export interface EmploymentEndRequest {
  endDate: string;
  expectedVersion: number;
}

export interface EmployeeTransferRequest {
  fromEmploymentId: string;
  newPlacement: {
    companyId: string;
    departmentId: string | null;
    positionId: string | null;
    locationId: string | null;
    managerEmploymentId: string | null;
  };
  effectiveDate: string;
  expectedEmploymentVersion: number;
}

export interface EmployeeEmploymentApiService {
  listEmployees(
    context: AuthContext,
    organizationId: string,
    query: Record<string, unknown>,
  ): Promise<CollectionEnvelope<unknown>>;
  createEmployee(
    context: AuthContext,
    organizationId: string,
    input: EmployeeCreateRequest,
  ): Promise<ResourceEnvelope<unknown>>;
  getEmployee(context: AuthContext, employeeId: string): Promise<ResourceEnvelope<unknown>>;
  updateEmployee(
    context: AuthContext,
    employeeId: string,
    input: Record<string, unknown>,
  ): Promise<ResourceEnvelope<unknown>>;
  terminateEmployee(
    context: AuthContext,
    employeeId: string,
    input: EmployeeTerminateRequest,
  ): Promise<ResourceEnvelope<unknown>>;
  reactivateEmployee(
    context: AuthContext,
    employeeId: string,
    expectedVersion: number,
  ): Promise<ResourceEnvelope<unknown>>;
  listEmployments(context: AuthContext, employeeId: string): Promise<CollectionEnvelope<unknown>>;
  startEmployment(
    context: AuthContext,
    employeeId: string,
    input: EmploymentStartRequest,
  ): Promise<ResourceEnvelope<unknown>>;
  endEmployment(
    context: AuthContext,
    employmentId: string,
    input: EmploymentEndRequest,
  ): Promise<ResourceEnvelope<unknown>>;
  transferEmployee(
    context: AuthContext,
    employeeId: string,
    input: EmployeeTransferRequest,
  ): Promise<ResourceEnvelope<unknown>>;
}

const employmentErrorMap: Readonly<Record<string, string>> = {
  ACTIVE_PRIMARY_EMPLOYMENT_EXISTS: 'ACTIVE_PRIMARY_EMPLOYMENT_EXISTS',
  EMPLOYEE_HAS_ACTIVE_PRIMARY_EMPLOYMENT: 'ACTIVE_PRIMARY_EMPLOYMENT_EXISTS',
  INVALID_EFFECTIVE_DATE: 'EMPLOYMENT_DATE_OVERLAP',
  COMPANY_SCOPE_MISMATCH: 'CROSS_ORGANIZATION_REFERENCE',
  DEPARTMENT_SCOPE_MISMATCH: 'CROSS_COMPANY_DEPARTMENT_REFERENCE',
  POSITION_SCOPE_MISMATCH: 'CROSS_ORGANIZATION_REFERENCE',
  LOCATION_SCOPE_MISMATCH: 'CROSS_ORGANIZATION_REFERENCE',
  LOCATION_COMPANY_SCOPE_MISMATCH: 'CROSS_COMPANY_DEPARTMENT_REFERENCE',
  TENANT_SCOPE_MISMATCH: 'CROSS_TENANT_REFERENCE',
};

export function mapEmploymentDomainError(code: string): string {
  return employmentErrorMap[code] ?? code;
}
