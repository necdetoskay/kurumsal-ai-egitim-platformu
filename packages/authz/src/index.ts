export const permissions = [
  'organization.read',
  'organization.manage',
  'user.read',
  'user.invite',
  'user.manage',
  'role.assign',
  'training.read',
  'training.create',
  'training.edit',
  'training.submit_review',
  'training.review',
  'training.publish',
  'training.archive',
  'assignment.create',
  'assignment.manage',
  'learning.consume',
  'learning.progress.self',
  'question.read',
  'question.create',
  'question.edit',
  'question.review',
  'assessment.read',
  'assessment.create',
  'assessment.edit',
  'assessment.publish',
  'assessment.attempt.self',
  'assessment.result.self',
  'assessment.result.read',
  'retake.request.self',
  'retake.review',
  'certificate.self',
  'certificate.read',
  'certificate.manage',
  'ai.generate',
  'ai.review',
  'ai.operations.read',
  'analytics.self',
  'analytics.organization',
  'audit.read',
  'platform.tenant_support',
] as const;

export type Permission = (typeof permissions)[number];

export const tenantRoles = ['tenant_admin', 'instructor', 'reviewer', 'learner'] as const;
export type TenantRole = (typeof tenantRoles)[number];

const rolePermissions: Record<TenantRole, ReadonlySet<Permission>> = {
  tenant_admin: new Set<Permission>([
    'organization.read', 'organization.manage', 'user.read', 'user.invite', 'user.manage', 'role.assign',
    'training.read', 'training.create', 'training.edit', 'training.submit_review', 'training.review', 'training.publish', 'training.archive',
    'assignment.create', 'assignment.manage', 'learning.consume', 'learning.progress.self',
    'question.read', 'question.create', 'question.edit', 'question.review',
    'assessment.read', 'assessment.create', 'assessment.edit', 'assessment.publish', 'assessment.attempt.self', 'assessment.result.self', 'assessment.result.read',
    'retake.request.self', 'retake.review', 'certificate.self', 'certificate.read', 'certificate.manage',
    'ai.generate', 'ai.review', 'ai.operations.read', 'analytics.self', 'analytics.organization', 'audit.read',
  ]),
  instructor: new Set<Permission>([
    'organization.read', 'user.read', 'training.read', 'training.create', 'training.edit', 'training.submit_review', 'training.publish',
    'assignment.create', 'assignment.manage', 'learning.consume', 'learning.progress.self',
    'question.read', 'question.create', 'question.edit', 'assessment.read', 'assessment.create', 'assessment.edit', 'assessment.publish',
    'assessment.attempt.self', 'assessment.result.self', 'assessment.result.read', 'retake.request.self', 'retake.review',
    'certificate.self', 'certificate.read', 'certificate.manage', 'ai.generate', 'ai.review', 'ai.operations.read', 'analytics.self', 'analytics.organization',
  ]),
  reviewer: new Set<Permission>([
    'organization.read', 'user.read', 'training.read', 'training.edit', 'training.review', 'learning.consume', 'learning.progress.self',
    'question.read', 'question.edit', 'question.review', 'assessment.read', 'assessment.edit', 'assessment.attempt.self', 'assessment.result.self', 'assessment.result.read',
    'retake.request.self', 'certificate.self', 'certificate.read', 'ai.generate', 'ai.review', 'analytics.self', 'analytics.organization',
  ]),
  learner: new Set<Permission>([
    'organization.read', 'training.read', 'learning.consume', 'learning.progress.self', 'assessment.read', 'assessment.attempt.self',
    'assessment.result.self', 'retake.request.self', 'certificate.self', 'analytics.self',
  ]),
};

export interface ActorContext {
  actorId: string;
  tenantId: string;
  roles: readonly TenantRole[];
}

export interface ResourceScope {
  tenantId: string;
  ownerUserId?: string;
}

export interface AuthorizationRequest {
  actor: ActorContext;
  permission: Permission;
  resource?: ResourceScope;
  requireSelf?: boolean;
}

export function hasPermission(actor: ActorContext, permission: Permission): boolean {
  return actor.roles.some((role) => rolePermissions[role]?.has(permission) ?? false);
}

export function authorize(request: AuthorizationRequest): boolean {
  const { actor, permission, resource, requireSelf = false } = request;

  if (!hasPermission(actor, permission)) return false;
  if (resource && resource.tenantId !== actor.tenantId) return false;
  if (requireSelf && resource?.ownerUserId !== actor.actorId) return false;

  return true;
}

export * from './tenant-context.js';
