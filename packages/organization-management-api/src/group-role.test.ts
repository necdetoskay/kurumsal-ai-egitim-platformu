import { describe, expect, it } from 'vitest';
import { assertScopedRoleShape, groupRoleRoutes, mapGroupDomainError } from './group-role.js';

describe('group and scoped-role API contract', () => {
  it('matches canonical group, membership, dynamic rule and role routes', () => {
    const paths = new Set(groupRoleRoutes.map((route) => `${route.method} ${route.path}`));
    expect(paths).toContain('POST /api/v1/groups/:groupId/members');
    expect(paths).toContain('POST /api/v1/groups/:groupId/members:bulk-add');
    expect(paths).toContain('POST /api/v1/groups/:groupId/members/:employeeId/remove');
    expect(paths).toContain('PUT /api/v1/groups/:groupId/rules');
    expect(paths).toContain('POST /api/v1/groups/:groupId/evaluate');
    expect(paths).toContain('POST /api/v1/groups/:groupId/reconcile');
    expect(paths).toContain('DELETE /api/v1/users/:userId/organization-role-assignments/:assignmentId');
  });

  it('keeps membership removal as a lifecycle command instead of delete', () => {
    const route = groupRoleRoutes.find((item) => item.path.includes('/members/:employeeId/remove'));
    expect(route).toMatchObject({ method: 'POST', lifecycleCommand: true, mutation: true });
    expect(groupRoleRoutes.some((item) => item.method === 'DELETE' && item.path.includes('/groups/:groupId/members'))).toBe(false);
  });

  it('validates exactly one non-tenant role scope target', () => {
    expect(() => assertScopedRoleShape({ roleId: 'r', scopeType: 'TENANT', organizationId: null, companyId: null, departmentId: null })).not.toThrow();
    expect(() => assertScopedRoleShape({ roleId: 'r', scopeType: 'COMPANY', organizationId: null, companyId: 'c', departmentId: null })).not.toThrow();
    expect(() => assertScopedRoleShape({ roleId: 'r', scopeType: 'DEPARTMENT', organizationId: 'o', companyId: null, departmentId: 'd' })).toThrow('INVALID_ROLE_SCOPE_SHAPE');
  });

  it('maps membership and ownership violations to canonical API codes', () => {
    expect(mapGroupDomainError('GROUP_MEMBERSHIP_ALREADY_ACTIVE')).toEqual({ status: 409, code: 'DUPLICATE_ACTIVE_MEMBERSHIP' });
    expect(mapGroupDomainError('GROUP_EMPLOYEE_ORGANIZATION_MISMATCH')).toEqual({ status: 422, code: 'CROSS_ORGANIZATION_REFERENCE' });
    expect(mapGroupDomainError('SYSTEM_GROUP_MANUAL_MUTATION_FORBIDDEN')).toEqual({ status: 422, code: 'INVALID_LIFECYCLE_TRANSITION' });
  });

  it('marks bulk-add and reconcile as mutations for idempotency enforcement', () => {
    for (const path of ['/api/v1/groups/:groupId/members:bulk-add', '/api/v1/groups/:groupId/reconcile']) {
      expect(groupRoleRoutes.find((item) => item.path === path)).toMatchObject({ method: 'POST', mutation: true });
    }
  });
});
