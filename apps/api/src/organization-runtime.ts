import type { DatabaseClient } from '@kaep/db';

export type OrgPrincipal = { tenantId: string; userId: string };

type Query = (sql: string, params?: readonly unknown[]) => Promise<any>;

export function createOrganizationRuntime(database: DatabaseClient) {
  const q: Query = (sql, params=[]) => database.pool.query(sql, [...params]);

  async function audited<T extends { id?: string } | null>(
    p: OrgPrincipal,
    action: string,
    entityType: string,
    scopeType: string,
    scopeId: string | null,
    work: (query: Query) => Promise<T>,
  ): Promise<T> {
    const client = await database.pool.connect();
    const cq: Query = (sql, params=[]) => client.query(sql, [...params]);
    try {
      await client.query('begin');
      const result = await work(cq);
      if (result) {
        await client.query(
          `insert into organization_audit_events
             (tenant_id, actor_user_id, action, entity_type, entity_id, scope_type, scope_id, after_json)
           values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
          [p.tenantId,p.userId,action,entityType,result.id??null,scopeType,scopeId,JSON.stringify(result)],
        );
      }
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    async listOrganizations(p: OrgPrincipal) {
      return (await q('select * from organizations where tenant_id=$1 order by name',[p.tenantId])).rows;
    },
    async createOrganization(p: OrgPrincipal, input: any) {
      return audited(p,'ORGANIZATION_CREATED','ORGANIZATION','TENANT',null,async query=>{
        const r=await query(`insert into organizations(tenant_id,name,code,sector,default_locale,timezone,description)
          values($1,$2,$3,$4,$5,$6,$7) returning *`,[p.tenantId,input.name,input.code,input.sector??null,input.defaultLocale??'tr-TR',input.timezone??'Europe/Istanbul',input.description??null]);
        return r.rows[0];
      });
    },
    async getOrganizationTree(p: OrgPrincipal, organizationId:string) {
      const org=(await q('select * from organizations where tenant_id=$1 and id=$2',[p.tenantId,organizationId])).rows[0];
      if(!org) return null;
      const companies=(await q('select * from companies where tenant_id=$1 and organization_id=$2 order by name',[p.tenantId,organizationId])).rows;
      const departments=(await q(`select d.* from departments d join companies c on c.tenant_id=d.tenant_id and c.id=d.company_id where d.tenant_id=$1 and c.organization_id=$2 order by d.sort_order,d.name`,[p.tenantId,organizationId])).rows;
      return { ...org, companies: companies.map((company:any)=>({...company,departments:departments.filter((d:any)=>d.company_id===company.id)})) };
    },
    async listEmployees(p: OrgPrincipal, organizationId:string) {
      return (await q('select * from employees where tenant_id=$1 and organization_id=$2 order by last_name,first_name',[p.tenantId,organizationId])).rows;
    },
    async listGroups(p: OrgPrincipal, organizationId:string) {
      return (await q('select * from groups where tenant_id=$1 and organization_id=$2 order by name',[p.tenantId,organizationId])).rows;
    },
    async createCompany(p: OrgPrincipal, organizationId:string, input:any) {
      return audited(p,'COMPANY_CREATED','COMPANY','ORGANIZATION',organizationId,async query=>{
        const r=await query(`insert into companies(tenant_id,organization_id,name,legal_name,code,tax_number,email,phone,website)
          select $1,id,$3,$4,$5,$6,$7,$8,$9 from organizations where tenant_id=$1 and id=$2 returning *`,
          [p.tenantId,organizationId,input.name,input.legalName??null,input.code,input.taxNumber??null,input.email??null,input.phone??null,input.website??null]);
        return r.rows[0]??null;
      });
    },
    async createDepartment(p: OrgPrincipal, companyId:string, input:any) {
      return audited(p,'DEPARTMENT_CREATED','DEPARTMENT','COMPANY',companyId,async query=>{
        const r=await query(`insert into departments(tenant_id,company_id,parent_department_id,name,code,description,sort_order)
          select $1,id,$3,$4,$5,$6,$7 from companies where tenant_id=$1 and id=$2 returning *`,
          [p.tenantId,companyId,input.parentDepartmentId??null,input.name,input.code,input.description??null,input.sortOrder??0]);
        return r.rows[0]??null;
      });
    },
    async createEmployee(p: OrgPrincipal, organizationId:string, input:any) {
      return audited(p,'EMPLOYEE_CREATED','EMPLOYEE','ORGANIZATION',organizationId,async query=>{
        const r=await query(`insert into employees(tenant_id,organization_id,employee_no,first_name,last_name,email,phone,hire_date)
          select $1,id,$3,$4,$5,$6,$7,$8 from organizations where tenant_id=$1 and id=$2 returning *`,
          [p.tenantId,organizationId,input.employeeNo??null,input.firstName,input.lastName,input.email??null,input.phone??null,input.hireDate??null]);
        return r.rows[0]??null;
      });
    },
    async startEmployment(p: OrgPrincipal, employeeId:string, input:any) {
      return audited(p,'EMPLOYMENT_STARTED','EMPLOYMENT','EMPLOYEE',employeeId,async query=>{
        const r=await query(`insert into employments(tenant_id,employee_id,company_id,department_id,position_id,location_id,manager_employment_id,employment_type,start_date,is_primary)
          select $1,e.id,$3,$4,$5,$6,$7,$8,$9,$10 from employees e where e.tenant_id=$1 and e.id=$2 returning *`,
          [p.tenantId,employeeId,input.companyId,input.departmentId??null,input.positionId??null,input.locationId??null,input.managerEmploymentId??null,input.employmentType,input.startDate,input.isPrimary??true]);
        return r.rows[0]??null;
      });
    },
    async createGroup(p: OrgPrincipal, organizationId:string, input:any) {
      return audited(p,'GROUP_CREATED','GROUP','ORGANIZATION',organizationId,async query=>{
        const r=await query(`insert into groups(tenant_id,organization_id,name,code,type,description)
          select $1,id,$3,$4,$5,$6 from organizations where tenant_id=$1 and id=$2 returning *`,
          [p.tenantId,organizationId,input.name,input.code,input.groupType??'MANUAL',input.description??null]);
        return r.rows[0]??null;
      });
    },
    async addGroupMember(p: OrgPrincipal, groupId:string, input:any) {
      return audited(p,'GROUP_MEMBER_ADDED','GROUP_MEMBERSHIP','GROUP',groupId,async query=>{
        const r=await query(`insert into group_memberships(tenant_id,group_id,employee_id,source,valid_from)
          select $1,g.id,e.id,'MANUAL',$4 from groups g join employees e on e.tenant_id=g.tenant_id and e.id=$3
          where g.tenant_id=$1 and g.id=$2 and g.organization_id=e.organization_id returning *`,
          [p.tenantId,groupId,input.employeeId,input.validFrom??new Date().toISOString()]);
        return r.rows[0]??null;
      });
    },
  };
}
