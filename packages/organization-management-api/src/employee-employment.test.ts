import { describe, expect, it } from 'vitest';
import { employeeEmploymentRoutes, mapEmploymentDomainError } from './employee-employment.js';

const routeKey = (method: string, path: string) => `${method} ${path}`;

describe('employee and employment API contract', () => {
  it('matches the canonical route surface', () => {
    const routes = new Set(employeeEmploymentRoutes.map((route) => routeKey(route.method, route.path)));
    expect(routes).toEqual(new Set([
      'GET /api/v1/organizations/:organizationId/employees',
      'POST /api/v1/organizations/:organizationId/employees',
      'GET /api/v1/employees/:employeeId',
      'PATCH /api/v1/employees/:employeeId',
      'POST /api/v1/employees/:employeeId/terminate',
      'POST /api/v1/employees/:employeeId/reactivate',
      'GET /api/v1/employees/:employeeId/employments',
      'POST /api/v1/employees/:employeeId/employments',
      'POST /api/v1/employments/:employmentId/end',
      'POST /api/v1/employees/:employeeId/transfer',
    ]));
  });

  it('does not expose hard-delete mutation paths', () => {
    expect(employeeEmploymentRoutes.some((route) => route.method === ('DELETE' as never))).toBe(false);
  });

  it('marks transfer and lifecycle endpoints as commands', () => {
    const lifecycle = employeeEmploymentRoutes.filter((route) => route.lifecycleCommand).map((route) => route.path);
    expect(lifecycle).toContain('/api/v1/employees/:employeeId/transfer');
    expect(lifecycle).toContain('/api/v1/employments/:employmentId/end');
    expect(lifecycle).toContain('/api/v1/employees/:employeeId/terminate');
  });

  it('maps domain scope and temporal conflicts to canonical API error codes', () => {
    expect(mapEmploymentDomainError('TENANT_SCOPE_MISMATCH')).toBe('CROSS_TENANT_REFERENCE');
    expect(mapEmploymentDomainError('COMPANY_SCOPE_MISMATCH')).toBe('CROSS_ORGANIZATION_REFERENCE');
    expect(mapEmploymentDomainError('DEPARTMENT_SCOPE_MISMATCH')).toBe('CROSS_COMPANY_DEPARTMENT_REFERENCE');
    expect(mapEmploymentDomainError('INVALID_EFFECTIVE_DATE')).toBe('EMPLOYMENT_DATE_OVERLAP');
    expect(mapEmploymentDomainError('EMPLOYEE_HAS_ACTIVE_PRIMARY_EMPLOYMENT')).toBe('ACTIVE_PRIMARY_EMPLOYMENT_EXISTS');
  });
});
