import { authorize, type ActorContext, type Permission, type ResourceScope } from '@kaep/authz';

export interface SecuredResource {
  id: string;
  tenantId: string;
  ownerUserId?: string;
}

export function canAccessResource(input: {
  actor: ActorContext;
  permission: Permission;
  resource: SecuredResource;
  requireSelf?: boolean;
}): boolean {
  const resourceScope: ResourceScope = input.resource.ownerUserId === undefined
    ? { tenantId: input.resource.tenantId }
    : { tenantId: input.resource.tenantId, ownerUserId: input.resource.ownerUserId };

  return authorize({
    actor: input.actor,
    permission: input.permission,
    resource: resourceScope,
    ...(input.requireSelf === undefined ? {} : { requireSelf: input.requireSelf }),
  });
}

export function secureLookup<T extends SecuredResource>(input: {
  actor: ActorContext;
  permission: Permission;
  resourceId: string;
  records: readonly T[];
  requireSelf?: boolean;
}): T | null {
  const resource = input.records.find((candidate) => candidate.id === input.resourceId);
  if (!resource) return null;

  const allowed = canAccessResource({
    actor: input.actor,
    permission: input.permission,
    resource,
    ...(input.requireSelf === undefined ? {} : { requireSelf: input.requireSelf }),
  });

  return allowed ? resource : null;
}
