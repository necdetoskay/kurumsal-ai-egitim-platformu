import type { DatabaseClient } from '@kaep/db';

export type OrgPrincipal = { tenantId: string; userId: string };

export function createOrganizationRuntime(database: DatabaseClient) {
  const q = database.pool.query.bind(database.pool);
  return {
    async listOrganizations(p: OrgPrincipal) {
      return (await q('select * from organizations where tenant_id=$1 order by name',[p.tenantId])).rows;
    },
    async createOrganization(p: OrgPrincipal, input: any) {
      const r=await q(`insert into organizations(tenant_id,name,code,sector,default_locale,timezone,description)
        values($1,$2,$3,$4,$5,$6,$7) returning *`,[p.tenantId,input.name,input.code,input.sector??null,input.defaultLocale??'tr-TR',input.timezone??'Europe/Istanbul',input.description??null]);
      return r.rows[0];
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
      const r=await q(`insert into companies(tenant_id,organization_id,name,legal_name,code,tax_number,email,phone,website)
        select $1,id,$3,$4,$5,$6,$7,$8,$9 from organizations where tenant_id=$1 and id=$2 returning *`,
        [p.tenantId,organizationId,input.name,input.legalName??null,input.code,input.taxNumber??null,input.email??null,input.phone??null,input.website??null]);
      return r.rows[0]??null;
    },
    async createDepartment(p: OrgPrincipal, companyId:string, input:any) {
      const r=await q(`insert into departments(tenant_id,company_id,parent_department_id,name,code,description,sort_order)
        select $1,id,$3,$4,$5,$6,$7 from companies where tenant_id=$1 and id=$2 returning *`,
        [p.tenantId,companyId,input.parentDepartmentId??null,input.name,input.code,input.description??null,input.sortOrder??0]);
      return r.rows[0]??null;
    },
    async createEmployee(p: OrgPrincipal, organizationId:string, input:any) {
      const r=await q(`insert into employees(tenant_id,organization_id,employee_no,first_name,last_name,email,phone,hire_date)
        select $1,id,$3,$4,$5,$6,$7,$8 from organizations where tenant_id=$1 and id=$2 returning *`,
        [p.tenantId,organizationId,input.employeeNo??null,input.firstName,input.lastName,input.email??null,input.phone??null,input.hireDate??null]);
      return r.rows[0]??null;
    },
    async startEmployment(p: OrgPrincipal, employeeId:string, input:any) {
      const r=await q(`insert into employments(tenant_id,employee_id,company_id,department_id,position_id,location_id,manager_employment_id,employment_type,start_date,is_primary)
        select $1,e.id,$3,$4,$5,$6,$7,$8,$9,$10 from employees e where e.tenant_id=$1 and e.id=$2 returning *`,
        [p.tenantId,employeeId,input.companyId,input.departmentId??null,input.positionId??null,input.locationId??null,input.managerEmploymentId??null,input.employmentType,input.startDate,input.isPrimary??true]);
      return r.rows[0]??null;
    },
    async createGroup(p: OrgPrincipal, organizationId:string, input:any) {
      const r=await q(`insert into groups(tenant_id,organization_id,name,code,type,description)
        select $1,id,$3,$4,$5,$6 from organizations where tenant_id=$1 and id=$2 returning *`,
        [p.tenantId,organizationId,input.name,input.code,input.groupType??'MANUAL',input.description??null]);
      return r.rows[0]??null;
    },
    async addGroupMember(p: OrgPrincipal, groupId:string, input:any) {
      const r=await q(`insert into group_memberships(tenant_id,group_id,employee_id,source,valid_from)
        select $1,g.id,e.id,'MANUAL',$4 from groups g join employees e on e.tenant_id=g.tenant_id and e.id=$3
        where g.tenant_id=$1 and g.id=$2 and g.organization_id=e.organization_id returning *`,
        [p.tenantId,groupId,input.employeeId,input.validFrom??new Date().toISOString()]);
      return r.rows[0]??null;
    },
  };
}
