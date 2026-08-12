import type { SessionStatus } from './auth';

export const authSessionStatuses: SessionStatus[] = [
  'authenticated',
  'bootstrapping',
  'unauthenticated',
  'verification-required',
  'expired',
  'forbidden',
  'maintenance',
];
