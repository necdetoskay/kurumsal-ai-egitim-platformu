import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '@kaep/db';
import { createOrganizationRuntime, type OrgPrincipal } from './organization-runtime.js';

function requiredEnv(name:string){const value=process.env[name];if(!value)throw new Error(`${name} is required for Organization MUR qualification`);return value;}
async function expectPgCode(p:Promise<unknown>,code:string){await assert.rejects(p,(e:unknown)=>typeof e==='object'&&e!==null&&'code' in e&&(e as {code?:string}).code===code);}
async function seedTenant(pool:any,id:string,label:string){await pool.query('insert into tenants(id,name,slug) values($1,$2,$3)',[id,label,`org-mur-${randomUUID()}`]);}
async function seedUser(pool:any,id:string,label:string){await pool.query('insert into users(id,display_name,email,is_active) values($1,$2,$3,true)',[id,label,`${randomUUID()}@example.invalid`]);}

async function main(){
 const db=createDatabase(requiredEnv('DATABASE_URL'));
 try{
  const tenant1=randomUUID(),tenant2=randomUUID(),actor1=randomUUID(),actor2=randomUUID();
  await seedTenant(db.pool,tenant1,'Org MUR Tenant 1'); await seedTenant(db.pool,tenant2,'Org MUR Tenant 2');
  await seedUser(db.pool,actor1,'Org MUR Admin 1'); await seedUser(db.pool,actor2,'Org MUR Admin 2');
  const p1:OrgPrincipal={tenantId:tenant1,userId:actor1}; const p2:OrgPrincipal={tenantId:tenant2,userId:actor2};
  const runtime=createOrganizationRuntime(db);

  const org=await runtime.createOrganization(p1,{name:'Qualification Org',code:`Q-${randomUUID().slice(0,8)}`});
  assert.ok(org?.id);
  assert.equal((await runtime.listOrganizations(p1)).some((x:any)=>x.id===org.id),true);
  assert.equal(await runtime.getOrganizationTree(p2,org.id),null);
  assert.equal(await runtime.createCompany(p2,org.id,{name:'Cross Tenant',code:'X'}),null);

  const company=await runtime.createCompany(p1,org.id,{name:'Main Company',code:`C-${randomUUID().slice(0,8)}`});
  assert.ok(company?.id);
  const department=await runtime.createDepartment(p1,company.id,{name:'IT',code:`D-${randomUUID().slice(0,8)}`});
  assert.ok(department?.id);
  const employee=await runtime.createEmployee(p1,org.id,{firstName:'MUR',lastName:'Employee',employeeNo:`E-${randomUUID().slice(0,8)}`});
  assert.ok(employee?.id);
  const employment=await runtime.startEmployment(p1,employee.id,{companyId:company.id,departmentId:department.id,employmentType:'FULL_TIME',startDate:'2026-09-23',isPrimary:true});
  assert.ok(employment?.id);
  await expectPgCode(runtime.startEmployment(p1,employee.id,{companyId:company.id,departmentId:department.id,employmentType:'FULL_TIME',startDate:'2026-09-24',isPrimary:true}),'23505');

  const group=await runtime.createGroup(p1,org.id,{name:'MUR Group',code:`G-${randomUUID().slice(0,8)}`,groupType:'MANUAL'});
  assert.ok(group?.id);
  const member=await runtime.addGroupMember(p1,group.id,{employeeId:employee.id});
  assert.ok(member?.id);
  await expectPgCode(runtime.addGroupMember(p1,group.id,{employeeId:employee.id}),'23505');

  const otherOrg=await runtime.createOrganization(p1,{name:'Other Org',code:`O-${randomUUID().slice(0,8)}`});
  const otherEmployee=await runtime.createEmployee(p1,otherOrg.id,{firstName:'Other',lastName:'Employee'});
  assert.equal(await runtime.addGroupMember(p1,group.id,{employeeId:otherEmployee.id}),null);

  const tree=await runtime.getOrganizationTree(p1,org.id);
  assert.equal(tree?.companies?.[0]?.id,company.id);
  assert.equal(tree?.companies?.[0]?.departments?.[0]?.id,department.id);
  assert.equal((await runtime.listEmployees(p1,org.id)).some((x:any)=>x.id===employee.id),true);
  assert.equal((await runtime.listGroups(p1,org.id)).some((x:any)=>x.id===group.id),true);

  const audits=await db.pool.query(
   'select action,actor_user_id from organization_audit_events where tenant_id=$1 order by occurred_at',
   [tenant1],
  );
  const actions=new Set(audits.rows.map((x:any)=>x.action));
  for(const expected of ['ORGANIZATION_CREATED','COMPANY_CREATED','DEPARTMENT_CREATED','EMPLOYEE_CREATED','EMPLOYMENT_STARTED','GROUP_CREATED','GROUP_MEMBER_ADDED']) assert.equal(actions.has(expected),true);
  assert.equal(audits.rows.every((x:any)=>x.actor_user_id===actor1),true);

  console.log('Organization runtime PostgreSQL qualification PASS');
 } finally { await db.close(); }
}
await main();
