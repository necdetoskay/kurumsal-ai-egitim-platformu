import type { SessionState } from './auth';

export type LoginInput = {
  email: string;
  password: string;
  returnPath: string;
};

export type VerificationInput = {
  challenge: 'mfa' | 'email';
  code: string;
};

export interface SessionAdapter {
  bootstrap(): Promise<SessionState>;
  login(input: LoginInput): Promise<SessionState>;
  verify(input: VerificationInput): Promise<SessionState>;
  logout(): Promise<void>;
}

export function assertSessionAdapterResult(session: SessionState): SessionState {
  if (session.status !== 'authenticated') return session;
  if (!session.userId || !session.tenantId || !session.expiresAt) return { status: 'forbidden' };
  return session;
}
