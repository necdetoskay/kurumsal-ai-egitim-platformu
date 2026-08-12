import { authorize, type ActorContext, type Permission, type ResourceScope } from '@kaep/authz';

export class ApplicationBoundaryError extends Error {
  constructor(public readonly code: 'FORBIDDEN' | 'IDEMPOTENCY_CONFLICT') {
    super(code);
  }
}

export function requireAuthorizedAction(input: {
  actor: ActorContext;
  permission: Permission;
  resource: ResourceScope;
  requireSelf?: boolean;
}): void {
  if (!authorize(input)) throw new ApplicationBoundaryError('FORBIDDEN');
}

export interface IdempotencyRecord<T> {
  key: string;
  fingerprint: string;
  result: T;
}

export function executeIdempotently<T>(input: {
  key: string;
  fingerprint: string;
  existing: readonly IdempotencyRecord<T>[];
  execute: () => T;
}): { result: T; records: readonly IdempotencyRecord<T>[]; replayed: boolean } {
  const prior = input.existing.find((record) => record.key === input.key);
  if (prior) {
    if (prior.fingerprint !== input.fingerprint) throw new ApplicationBoundaryError('IDEMPOTENCY_CONFLICT');
    return { result: prior.result, records: input.existing, replayed: true };
  }

  const result = input.execute();
  const record = Object.freeze({ key: input.key, fingerprint: input.fingerprint, result });
  return { result, records: Object.freeze([...input.existing, record]), replayed: false };
}
