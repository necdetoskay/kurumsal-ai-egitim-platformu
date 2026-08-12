import { describe, expect, it } from 'vitest';
import { navForRole } from './navigation';

describe('role-aware navigation', () => {
  it('keeps learner navigation inside learner inventory', () => {
    const ids = navForRole('learner').flatMap((item) => item.inventory);
    expect(Math.min(...ids)).toBeGreaterThanOrEqual(48);
    expect(Math.max(...ids)).toBeLessThanOrEqual(64);
    expect(ids).not.toContain(55 + 1000);
  });

  it('does not expose admin inventory through learner shell', () => {
    const learnerIds = new Set(navForRole('learner').flatMap((item) => item.inventory));
    for (const id of navForRole('tenant_admin').flatMap((item) => item.inventory)) {
      expect(learnerIds.has(id)).toBe(false);
    }
  });

  it('provides distinct shells for every V1 role', () => {
    const roots = ['tenant_admin', 'instructor', 'reviewer', 'learner'] as const;
    for (const role of roots) expect(navForRole(role).length).toBeGreaterThan(0);
    expect(navForRole('tenant_admin')).not.toEqual(navForRole('instructor'));
    expect(navForRole('reviewer')).not.toEqual(navForRole('learner'));
  });
});
