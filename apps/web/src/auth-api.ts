import type { SessionState } from './auth';
import type { WebRole } from './navigation';

type SessionResponse =
  | { status: 200; body: { state: 'authenticated'; principal: { userId: string; tenantId: string; role: WebRole; expiresAt: string } } }
  | { status: 401; body: { state: 'unauthenticated' | 'expired' | 'verification-required'; challenge?: 'mfa' | 'email' } }
  | { status: 403; body: { state: 'forbidden' } }
  | { status: 503; body: { state: 'maintenance' } };

export function mapSessionResponse(response: SessionResponse): SessionState {
  if (response.status === 200) {
    return { status: 'authenticated', ...response.body.principal };
  }
  if (response.status === 403) return { status: 'forbidden' };
  if (response.status === 503) return { status: 'maintenance' };
  if (response.body.state === 'verification-required') {
    return { status: 'verification-required', challenge: response.body.challenge ?? 'mfa' };
  }
  if (response.body.state === 'expired') return { status: 'expired' };
  return { status: 'unauthenticated' };
}

export interface AuthTransport {
  bootstrap(): Promise<SessionResponse>;
  login(credentials: { email: string; password: string }): Promise<SessionResponse>;
  verifyMfa(input: { code: string }): Promise<SessionResponse>;
  logout(): Promise<{ status: 204 }>;
}

export async function logoutToPublic(transport: AuthTransport): Promise<SessionState> {
  const result = await transport.logout();
  return result.status === 204 ? { status: 'unauthenticated' } : { status: 'unauthenticated' };
}
