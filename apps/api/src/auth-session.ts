export type ApiRole = 'tenant_admin' | 'instructor' | 'reviewer' | 'learner';

export type SessionPrincipal = {
  userId: string;
  tenantId: string;
  role: ApiRole;
  expiresAt: string;
  verified: boolean;
};

export type AuthSessionResult =
  | { status: 200; body: { state: 'authenticated'; principal: SessionPrincipal } }
  | { status: 401; body: { state: 'unauthenticated' | 'expired' | 'verification-required'; challenge?: 'mfa' | 'email' } }
  | { status: 403; body: { state: 'forbidden' } }
  | { status: 503; body: { state: 'maintenance' } };

export function projectSession(input: {
  principal?: SessionPrincipal | null;
  now: string;
  maintenance?: boolean;
  authorized?: boolean;
  challenge?: 'mfa' | 'email' | null;
}): AuthSessionResult {
  if (input.maintenance) return { status: 503, body: { state: 'maintenance' } };
  if (!input.principal) return { status: 401, body: { state: 'unauthenticated' } };
  if (Date.parse(input.principal.expiresAt) <= Date.parse(input.now)) return { status: 401, body: { state: 'expired' } };
  if (!input.principal.verified || input.challenge) {
    return { status: 401, body: { state: 'verification-required', challenge: input.challenge ?? 'mfa' } };
  }
  if (input.authorized === false) return { status: 403, body: { state: 'forbidden' } };
  return { status: 200, body: { state: 'authenticated', principal: input.principal } };
}

export function logoutResult(): { status: 204 } {
  return { status: 204 };
}
