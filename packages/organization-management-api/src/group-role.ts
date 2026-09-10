import type { AuthContext, CollectionEnvelope, ResourceEnvelope, RouteContract } from './index.js';

export type GroupType = 'MANUAL' | 'DYNAMIC' | 'SYSTEM';
export type RoleScopeType = 'TENANT' | 'ORGANIZATION' | 'COMPANY' | 'DEPARTMENT';

export const groupRoleRoutes: readonly RouteContract[] = [
  { method: 'GET', path: '/api/v1/organizations/:organizationId/groups', mutation: false },
  { method: 'POST', path: '/api/v1/organizations/:organizationId/groups', mutation: true },
  { method: 'GET', path: '/api/v1/groups/:groupId', mutation: false },
  { method: 'PATCH', path: '/api/v1/groups/:groupId', mutation: true },
  { method: 'POST', path: '/api/v1/groups/:groupId/passivate', mutation: true, lifecycleCommand: true },
  { method: 'POST', path: '/api/v1/groups/:groupId/reactivate', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/groups/:groupId/members', mutation: false },
  { method: 'POST', path: '/api/v1/groups/:groupId/members', mutation: true },
  { method: 'POST', path: '/api/v1/groups/:groupId/members:bulk-add', mutation: true },
  { method: 'POST', path: '/api/v1/groups/:groupId/members/:employeeId/remove', mutation: true, lifecycleCommand: true },
  { method: 'GET', path: '/api/v1/groups/:groupId/rules', mutation: false },
  { method: 'PUT', path: '/api/v1/groups/:groupId/rules', mutation: true },
  { method: 'POST', path: '/api/v1/groups/:groupId/evaluate', mutation: false },
  { method: 'POST', path: '/api/v1/groups/:groupId/reconcile', mutation: true },
  { method: 'GET', path: '/api/v1/users/:userId/organization-role-assignments', mutation: false },
  { method: 'POST', path: '/api/v1/users/:userId/organization-role-assignments', mutation: true },
  { method: 'DELETE', path: '/api/v1/users/:userId/organization-role-assignments/:assignmentId', mutation: true, lifecycleCommand: true },
] as const;

export interface CreateGroupRequest {
  name: string;
  description?: string;
  groupType: GroupType;
}

export interface AddGroupMemberRequest {
  employeeId: string;
  validFrom: string;
}

export interface BulkAddGroupMembersRequest {
  employeeIds: string[];
}

export interface RemoveGroupMemberRequest {
  effectiveAt: string;
}

export interface DynamicGroupRuleItem {
  field: string;
  operator: string;
  value: unknown;
  logicalOperator: 'AND' | 'OR';
  sortOrder: number;
}

export interface PutDynamicGroupRulesRequest {
  expectedRuleVersion: number;
  rules: DynamicGroupRuleItem[];
}

export interface ScopedRoleAssignmentRequest {
  roleId: string;
  scopeType: RoleScopeType;
  organizationId: string | null;
  companyId: string | null;
  departmentId: string | null;
}

export interface GroupRoleAuthorizer {
  assertOrganizationAccess(context: AuthContext, organizationId: string, action: 'read' | 'write'): Promise<void>;
  assertGroupAccess(context: AuthContext, groupId: string, action: 'read' | 'write'): Promise<void>;
  assertUserRoleAssignmentAccess(context: AuthContext, userId: string, action: 'read' | 'write'): Promise<void>;
}

export interface GroupRoleApiService {
  listGroups(context: AuthContext, organizationId: string, query: Record<string, unknown>): Promise<CollectionEnvelope<unknown>>;
  addMember(context: AuthContext, groupId: string, input: AddGroupMemberRequest): Promise<ResourceEnvelope<unknown>>;
  bulkAddMembers(context: AuthContext, groupId: string, input: BulkAddGroupMembersRequest, idempotencyKey: string): Promise<ResourceEnvelope<unknown>>;
  removeMember(context: AuthContext, groupId: string, employeeId: string, input: RemoveGroupMemberRequest): Promise<ResourceEnvelope<unknown>>;
  putRules(context: AuthContext, groupId: string, input: PutDynamicGroupRulesRequest): Promise<ResourceEnvelope<unknown>>;
  evaluateGroup(context: AuthContext, groupId: string): Promise<CollectionEnvelope<unknown>>;
  reconcileGroup(context: AuthContext, groupId: string, idempotencyKey: string): Promise<ResourceEnvelope<unknown>>;
  createRoleAssignment(context: AuthContext, userId: string, input: ScopedRoleAssignmentRequest): Promise<ResourceEnvelope<unknown>>;
}

export function assertScopedRoleShape(input: ScopedRoleAssignmentRequest): void {
  const present = [input.organizationId, input.companyId, input.departmentId].filter((value) => value !== null).length;
  if (input.scopeType === 'TENANT') {
    if (present !== 0) throw new Error('INVALID_ROLE_SCOPE_SHAPE');
    return;
  }
  if (present !== 1) throw new Error('INVALID_ROLE_SCOPE_SHAPE');
  if (input.scopeType === 'ORGANIZATION' && input.organizationId === null) throw new Error('INVALID_ROLE_SCOPE_SHAPE');
  if (input.scopeType === 'COMPANY' && input.companyId === null) throw new Error('INVALID_ROLE_SCOPE_SHAPE');
  if (input.scopeType === 'DEPARTMENT' && input.departmentId === null) throw new Error('INVALID_ROLE_SCOPE_SHAPE');
}

export function mapGroupDomainError(code: string): { status: number; code: string } {
  switch (code) {
    case 'GROUP_MEMBERSHIP_ALREADY_ACTIVE':
      return { status: 409, code: 'DUPLICATE_ACTIVE_MEMBERSHIP' };
    case 'TENANT_SCOPE_MISMATCH':
      return { status: 422, code: 'CROSS_TENANT_REFERENCE' };
    case 'GROUP_EMPLOYEE_ORGANIZATION_MISMATCH':
      return { status: 422, code: 'CROSS_ORGANIZATION_REFERENCE' };
    case 'SYSTEM_GROUP_MANUAL_MUTATION_FORBIDDEN':
    case 'SYSTEM_GROUP_RECONCILE_FORBIDDEN':
    case 'DYNAMIC_GROUP_MANUAL_MUTATION_FORBIDDEN':
    case 'GROUP_MEMBERSHIP_SOURCE_PROTECTED':
      return { status: 422, code: 'INVALID_LIFECYCLE_TRANSITION' };
    default:
      return { status: 422, code };
  }
}
