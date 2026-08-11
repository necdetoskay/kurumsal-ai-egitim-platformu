import { describe, expect, it } from 'vitest';
import type { ActorContext } from '@kaep/authz';
import { secureLookup } from './security.js';

const tenantAAdmin: ActorContext = {
  actorId: 'admin-a',
  tenantId: 'tenant-a',
  roles: ['tenant_admin'],
};

const tenantALearner: ActorContext = {
  actorId: 'learner-a',
  tenantId: 'tenant-a',
  roles: ['learner'],
};

const resources = [
  { id: 'result-a', tenantId: 'tenant-a', ownerUserId: 'learner-a' },
  { id: 'result-a-other', tenantId: 'tenant-a', ownerUserId: 'learner-other' },
  { id: 'result-b', tenantId: 'tenant-b', ownerUserId: 'learner-b' },
] as const;

describe('API object-level authorization hard gates', () => {
  it('returns an in-tenant resource when permission allows it', () => {
    expect(secureLookup({
      actor: tenantAAdmin,
      permission: 'assessment.result.read',
      resourceId: 'result-a',
      records: resources,
    })?.id).toBe('result-a');
  });

  it('collapses cross-tenant resource ids to not-found semantics', () => {
    expect(secureLookup({
      actor: tenantAAdmin,
      permission: 'assessment.result.read',
      resourceId: 'result-b',
      records: resources,
    })).toBeNull();
  });

  it('prevents learner BOLA access to another learner result', () => {
    expect(secureLookup({
      actor: tenantALearner,
      permission: 'assessment.result.self',
      resourceId: 'result-a-other',
      records: resources,
      requireSelf: true,
    })).toBeNull();
  });

  it('allows learner self-scoped access only to own resource', () => {
    expect(secureLookup({
      actor: tenantALearner,
      permission: 'assessment.result.self',
      resourceId: 'result-a',
      records: resources,
      requireSelf: true,
    })?.id).toBe('result-a');
  });
});
