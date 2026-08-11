import { describe, expect, it } from 'vitest';
import { authorize, type ActorContext } from './index.js';

const tenantAAdmin: ActorContext = {
  actorId: 'user-a-admin',
  tenantId: 'tenant-a',
  roles: ['tenant_admin'],
};

const tenantAInstructor: ActorContext = {
  actorId: 'user-a-instructor',
  tenantId: 'tenant-a',
  roles: ['instructor'],
};

const tenantALearner: ActorContext = {
  actorId: 'user-a-learner',
  tenantId: 'tenant-a',
  roles: ['learner'],
};

describe('authorization policy hard gates', () => {
  it('allows explicit permission inside the trusted tenant boundary', () => {
    expect(authorize({
      actor: tenantAAdmin,
      permission: 'user.manage',
      resource: { tenantId: 'tenant-a' },
    })).toBe(true);
  });

  it('denies a permission that the role does not have', () => {
    expect(authorize({
      actor: tenantALearner,
      permission: 'role.assign',
      resource: { tenantId: 'tenant-a' },
    })).toBe(false);
  });

  it('denies cross-tenant access even when the actor otherwise has permission', () => {
    expect(authorize({
      actor: tenantAAdmin,
      permission: 'user.read',
      resource: { tenantId: 'tenant-b' },
    })).toBe(false);
  });

  it('denies self-scoped access to another user resource', () => {
    expect(authorize({
      actor: tenantALearner,
      permission: 'assessment.result.self',
      resource: { tenantId: 'tenant-a', ownerUserId: 'another-user' },
      requireSelf: true,
    })).toBe(false);
  });

  it('does not imply publish permission from create/edit permissions', () => {
    const restrictedInstructor: ActorContext = {
      ...tenantAInstructor,
      roles: ['reviewer'],
    };

    expect(authorize({
      actor: restrictedInstructor,
      permission: 'training.publish',
      resource: { tenantId: 'tenant-a' },
    })).toBe(false);
  });
});
