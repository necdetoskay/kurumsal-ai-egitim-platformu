import { safeReturnPath, type SessionState } from './auth';

export type AuthRoute = '/login' | '/verify' | '/session-expired' | '/maintenance' | '/';

export function authRouteFor(session: SessionState): AuthRoute {
  switch (session.status) {
    case 'verification-required': return '/verify';
    case 'expired': return '/session-expired';
    case 'maintenance': return '/maintenance';
    case 'unauthenticated': return '/login';
    case 'bootstrapping':
    case 'forbidden':
    case 'authenticated':
      return '/';
  }
}

export function buildLoginHref(returnPath: string): string {
  const safe = safeReturnPath(returnPath);
  return `/login?returnTo=${encodeURIComponent(safe)}`;
}
