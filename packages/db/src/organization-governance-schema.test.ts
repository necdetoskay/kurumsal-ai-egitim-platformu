import { describe, expect, it } from 'vitest';

import {
  dynamicGroupRules,
  employeeExternalIdentities,
  groupMemberships,
  groups,
  organizationAuditEvents,
  userRoleAssignments,
} from './organization-governance-schema.js';

describe('organization governance schema', () => {
  it('exports canonical governance tables', () => {
    expect(groups).toBeDefined();
    expect(groupMemberships).toBeDefined();
    expect(dynamicGroupRules).toBeDefined();
    expect(employeeExternalIdentities).toBeDefined();
    expect(userRoleAssignments).toBeDefined();
    expect(organizationAuditEvents).toBeDefined();
  });
});
