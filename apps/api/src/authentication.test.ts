import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthenticator } from './authentication.js';

const { jwtVerifyMock } = vi.hoisted(() => ({ jwtVerifyMock: vi.fn() }));
vi.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: jwtVerifyMock,
}));

const config:any={
  AUTH_JWKS_URL:'https://auth.invalid/jwks',
  AUTH_ISSUER:'https://auth.invalid/',
  AUTH_AUDIENCE:'kaep-api',
};

function dbWithRoles(roleCodes:string[]=['learner']) {
  const query=vi.fn()
    .mockResolvedValueOnce({rowCount:1,rows:[{userId:'user-a'}]})
    .mockResolvedValueOnce({rowCount:1,rows:[{tenantId:'tenant-a'}]})
    .mockResolvedValueOnce({rows:roleCodes.map((roleCode)=>({roleCode,permissionCode:roleCode==='tenant_admin'?'organization.manage':null}))});
  return {database:{pool:{query}} as any,query};
}

describe('verified bearer authentication',()=>{
  beforeEach(()=>{
    jwtVerifyMock.mockReset();
    jwtVerifyMock.mockResolvedValue({payload:{sub:'subject-a',tenant_id:'tenant-a'}});
  });

  it('fails closed without bearer token',async()=>{
    const auth=createAuthenticator(config,{pool:{query:vi.fn()}} as any);
    await expect(auth(undefined)).rejects.toMatchObject({code:'TOKEN_REQUIRED'});
  });

  it.each([
    ['invalid signature',new Error('signature verification failed')],
    ['expired token',new Error('JWTExpired')],
    ['wrong audience',new Error('JWTClaimValidationFailed: aud')],
  ])('rejects %s before database lookup',async(_label,error)=>{
    jwtVerifyMock.mockRejectedValueOnce(error);
    const query=vi.fn();
    const auth=createAuthenticator(config,{pool:{query}} as any);
    await expect(auth('Bearer bad-token')).rejects.toMatchObject({code:'TOKEN_INVALID'});
    expect(query).not.toHaveBeenCalled();
    expect(jwtVerifyMock).toHaveBeenCalledWith('bad-token',expect.anything(),{issuer:config.AUTH_ISSUER,audience:config.AUTH_AUDIENCE});
  });

  it('rejects a missing tenant claim',async()=>{
    jwtVerifyMock.mockResolvedValueOnce({payload:{sub:'subject-a'}});
    const query=vi.fn();
    const auth=createAuthenticator(config,{pool:{query}} as any);
    await expect(auth('Bearer signed-token')).rejects.toMatchObject({code:'TENANT_MEMBERSHIP_REQUIRED'});
    expect(query).not.toHaveBeenCalled();
  });

  it('distinguishes inactive or unknown subject',async()=>{
    const query=vi.fn().mockResolvedValueOnce({rowCount:0,rows:[]});
    const auth=createAuthenticator(config,{pool:{query}} as any);
    await expect(auth('Bearer signed-token')).rejects.toMatchObject({code:'SUBJECT_NOT_ACTIVE'});
  });

  it('fails closed on tenant membership mismatch',async()=>{
    const query=vi.fn()
      .mockResolvedValueOnce({rowCount:1,rows:[{userId:'user-a'}]})
      .mockResolvedValueOnce({rowCount:0,rows:[]});
    const auth=createAuthenticator(config,{pool:{query}} as any);
    await expect(auth('Bearer signed-token')).rejects.toMatchObject({code:'TENANT_MEMBERSHIP_REQUIRED'});
    expect(query.mock.calls[1]?.[1]).toEqual(['user-a','tenant-a']);
  });

  it.each(['tenant_admin','instructor','learner'])('derives valid %s role server-side',async(roleCode)=>{
    jwtVerifyMock.mockResolvedValueOnce({payload:{sub:'subject-a',tenant_id:'tenant-a',role:'tenant_admin',roles:['tenant_admin']}});
    const {database,query}=dbWithRoles([roleCode]);
    const auth=createAuthenticator(config,database);
    const p=await auth('Bearer signed-token');
    expect(p.userId).toBe('user-a');
    expect(p.tenantId).toBe('tenant-a');
    expect(p.roleCodes).toEqual([roleCode]);
    expect(p.roleCodes).not.toContain(roleCode==='tenant_admin'?'instructor':'tenant_admin');
    expect(query.mock.calls[0]?.[1]).toEqual(['subject-a']);
    expect(query.mock.calls[1]?.[1]).toEqual(['user-a','tenant-a']);
  });

  it('ignores caller role claims and returns only database grants',async()=>{
    jwtVerifyMock.mockResolvedValueOnce({payload:{sub:'subject-a',tenant_id:'tenant-a',role:'tenant_admin',roles:['tenant_admin']}});
    const {database}=dbWithRoles(['learner']);
    const auth=createAuthenticator(config,database);
    await expect(auth('Bearer signed-token')).resolves.toMatchObject({roleCodes:['learner']});
  });
});
