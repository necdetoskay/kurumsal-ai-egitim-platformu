import { authorize, type ActorContext, type Permission } from '@kaep/authz';

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
  return authorize({
    actor: input.actor,
    permission: input.permission,
    resource: {
      tenantId: input.resource.tenantId,
      ownerUserId: input.resource.ownerUserId,
    },
    requireSelf: input.requireSelf,
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
  if (!canAccessResource({
    actor: input.actor,
    permission: input.permission,
    resource,
    requireSelf: input.requireSelf,
  })) return null;
  return resource;
}
