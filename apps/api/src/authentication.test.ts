import { describe, expect, it, vi } from 'vitest';
import { AuthenticationError, createAuthenticator } from './authentication.js';

vi.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: vi.fn(async () => ({ payload: { sub: 'subject-a', tenant_id: 'tenant-a' } })),
}));

const config:any={ AUTH_JWKS_URL:'https://auth.invalid/jwks', AUTH_ISSUER:'https://auth.invalid/', AUTH_AUDIENCE:'kaep-api' };

describe('verified bearer authentication',()=>{
  it('fails closed without bearer token',async()=>{
    const auth=createAuthenticator(config,{pool:{query:vi.fn()}} as any);
    await expect(auth(undefined)).rejects.toMatchObject({code:'TOKEN_REQUIRED'});
  });
  it('derives tenant user and roles from verified subject plus database',async()=>{
    const query=vi.fn()
      .mockResolvedValueOnce({rowCount:1,rows:[{userId:'user-a',tenantId:'tenant-a'}]})
      .mockResolvedValueOnce({rows:[{roleCode:'tenant_admin',permissionCode:'organization.manage'}]});
    const auth=createAuthenticator(config,{pool:{query}} as any);
    const p=await auth('Bearer signed-token');
    expect(p).toEqual({userId:'user-a',tenantId:'tenant-a',roleCodes:['tenant_admin'],permissions:['organization.manage']});
    expect(query.mock.calls[0]?.[1]).toEqual(['subject-a','tenant-a']);
  });
});
