import { describe, expect, it } from 'vitest';
import { assertImportConfirmReviewed, assertIntegrationIdempotencyKey, organizationIntegrationRoutes } from './integrations.js';

describe('organization integration API contracts', () => {
  it('contains canonical import, integration sync and audit routes', () => {
    expect(organizationIntegrationRoutes).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'POST', path: '/api/v1/organization-imports' }),
      expect.objectContaining({ method: 'POST', path: '/api/v1/organization-imports/:importId/confirm', lifecycleCommand: true }),
      expect.objectContaining({ method: 'POST', path: '/api/v1/organization-integrations/:integrationId/sync', lifecycleCommand: true }),
      expect.objectContaining({ method: 'GET', path: '/api/v1/organization-audit' }),
    ]));
  });

  it('requires explicit review before import confirmation', () => {
    expect(() => assertImportConfirmReviewed({ reviewed: false as true, conflictResolutions: [] })).toThrow('IMPORT_REVIEW_REQUIRED');
  });

  it('requires idempotency keys for critical mutations', () => {
    expect(() => assertIntegrationIdempotencyKey(undefined)).toThrow('IDEMPOTENCY_KEY_REQUIRED');
    expect(assertIntegrationIdempotencyKey(' k1 ')).toBe('k1');
  });

  it('exposes no hard-delete mutation route', () => {
    expect(organizationIntegrationRoutes.some((route) => route.method === 'DELETE')).toBe(false);
  });
});
