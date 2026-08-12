import type { WebRole } from './navigation';

export type SessionStatus =
  | 'bootstrapping'
  | 'unauthenticated'
  | 'verification-required'
  | 'authenticated'
  | 'expired'
  | 'forbidden'
  | 'maintenance';

export type AuthenticatedSession = {
  status: 'authenticated';
  userId: string;
  tenantId: string;
  role: WebRole;
  expiresAt: string;
};

export type SessionState =
  | { status: 'bootstrapping' }
  | { status: 'unauthenticated' }
  | { status: 'verification-required'; challenge: 'mfa' | 'email' }
  | AuthenticatedSession
  | { status: 'expired' }
  | { status: 'forbidden' }
  | { status: 'maintenance' };

export function safeReturnPath(value: string | null | undefined): string {
  if (!value) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';

  try {
    const parsed = new URL(value, 'https://kaep.local');
    if (parsed.origin !== 'https://kaep.local') return '/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
}

export function roleFromSession(session: SessionState): WebRole | null {
  return session.status === 'authenticated' ? session.role : null;
}

export function canRenderProtectedShell(session: SessionState): session is AuthenticatedSession {
  return session.status === 'authenticated';
}

export function sessionMessage(session: SessionState): { title: string; detail: string } {
  switch (session.status) {
    case 'bootstrapping':
      return { title: 'Oturum kontrol ediliyor', detail: 'Kimlik ve rol bilgileri güvenli şekilde doğrulanıyor.' };
    case 'unauthenticated':
      return { title: 'Oturum açmanız gerekiyor', detail: 'Korumalı içeriğe erişmek için giriş yapın.' };
    case 'verification-required':
      return {
        title: session.challenge === 'mfa' ? 'Ek doğrulama gerekli' : 'Hesap doğrulaması gerekli',
        detail: 'Oturum açma işlemini tamamlamak için doğrulama adımını bitirin.',
      };
    case 'expired':
      return { title: 'Oturum süresi doldu', detail: 'Devam etmek için yeniden giriş yapın.' };
    case 'forbidden':
      return { title: 'Erişim izniniz yok', detail: 'Bu kaynağa erişim yetkiniz bulunmuyor.' };
    case 'maintenance':
      return { title: 'Bakım çalışması', detail: 'Hizmet geçici olarak kullanılamıyor.' };
    case 'authenticated':
      return { title: 'Oturum açık', detail: 'Kimlik ve rol doğrulandı.' };
  }
}
