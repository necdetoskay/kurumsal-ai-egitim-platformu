import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AppConfig } from '@kaep/config';
import type { DatabaseClient } from '@kaep/db';

export type AuthenticatedPrincipal = {
  tenantId: string;
  userId: string;
  roleCodes: string[];
  permissions: string[];
};

export class AuthenticationError extends Error {
  constructor(public readonly code: 'TOKEN_REQUIRED'|'TOKEN_INVALID'|'SUBJECT_NOT_ACTIVE'|'TENANT_MEMBERSHIP_REQUIRED') { super(code); }
}

export function createAuthenticator(config: AppConfig, database: DatabaseClient) {
  const jwks = createRemoteJWKSet(new URL(config.AUTH_JWKS_URL));
  return async function authenticate(authorization: string | undefined): Promise<AuthenticatedPrincipal> {
    if (!authorization?.startsWith('Bearer ')) throw new AuthenticationError('TOKEN_REQUIRED');
    const token = authorization.slice(7).trim();
    if (!token) throw new AuthenticationError('TOKEN_REQUIRED');
    let subject: string;
    let tenantClaim: unknown;
    try {
      const verified = await jwtVerify(token, jwks, { issuer: config.AUTH_ISSUER, audience: config.AUTH_AUDIENCE });
      if (!verified.payload.sub) throw new AuthenticationError('TOKEN_INVALID');
      subject = verified.payload.sub;
      tenantClaim = verified.payload.tenant_id;
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError('TOKEN_INVALID');
    }
    if (typeof tenantClaim !== 'string' || !tenantClaim) throw new AuthenticationError('TENANT_MEMBERSHIP_REQUIRED');
    const subjectResult = await database.pool.query(
      `select id as "userId" from users
        where external_subject=$1 and is_active=true
        limit 1`,
      [subject],
    );
    if (!subjectResult.rowCount) throw new AuthenticationError('SUBJECT_NOT_ACTIVE');
    const userId = subjectResult.rows[0].userId;
    const membershipResult = await database.pool.query(
      `select tenant_id as "tenantId" from memberships
        where user_id=$1 and tenant_id=$2 and status='active'
        limit 1`,
      [userId, tenantClaim],
    );
    if (!membershipResult.rowCount) throw new AuthenticationError('TENANT_MEMBERSHIP_REQUIRED');
    const tenantId = membershipResult.rows[0].tenantId;
    const grants = await database.pool.query(
      `select distinct r.code as "roleCode", rp.permission_code as "permissionCode"
         from memberships m
         join user_roles ur on ur.membership_id=m.id
         join roles r on r.id=ur.role_id and (r.tenant_id=m.tenant_id or r.tenant_id is null)
         left join role_permissions rp on rp.role_id=r.id
        where m.user_id=$1 and m.tenant_id=$2 and m.status='active'`,
      [userId, tenantId],
    );
    return {
      userId, tenantId,
      roleCodes: [...new Set(grants.rows.map((r:any)=>r.roleCode).filter(Boolean))],
      permissions: [...new Set(grants.rows.map((r:any)=>r.permissionCode).filter(Boolean))],
    };
  };
}
