import React, { useEffect, useState } from 'react';
import { OrganizationAdminApi } from './organization-admin-api';
import { OrganizationAdminView, type CompanySummary, type DepartmentTreeNode, type OrganizationSummary } from './organization-admin-ui';
import { bearerHttp } from './runtime-session';

type RawOrg={id:string;name:string;code:string;status:'ACTIVE'|'PASSIVE'};
type RawCompany=RawOrg & {departments?:RawDepartment[]};
type RawDepartment={id:string;name:string;code:string;status:'ACTIVE'|'PASSIVE';company_id?:string;companyId?:string;parent_department_id?:string|null;parentDepartmentId?:string|null};

function roots(company:RawCompany):DepartmentTreeNode[]{
 const ds=company.departments??[]; const build=(parent:string|null):DepartmentTreeNode[]=>ds.filter(d=>(d.parentDepartmentId??d.parent_department_id??null)===parent).map(d=>({id:d.id,name:d.name,code:d.code,status:d.status,companyId:d.companyId??d.company_id??company.id,children:build(d.id)}));
 return build(null);
}
export function OrganizationRuntimeView(){
 const [state,setState]=useState<'loading'|'ready'|'empty'|'error'|'forbidden'>('loading');
 const [organization,setOrganization]=useState<OrganizationSummary>();
 const [companies,setCompanies]=useState<CompanySummary[]>([]);
 const [departments,setDepartments]=useState<Record<string,DepartmentTreeNode[]>>({});
 useEffect(()=>{ void (async()=>{try{
   const api=new OrganizationAdminApi(bearerHttp());
   const listed:any=await api.listOrganizations(); const first:RawOrg|undefined=listed.items?.[0];
   if(!first){setState('empty');return;}
   const tree:any=await api.getOrganizationTree(first.id); const cs:RawCompany[]=tree.companies??[];
   const dep:Record<string,DepartmentTreeNode[]>={}; cs.forEach(c=>{dep[c.id]=roots(c)});
   setOrganization({id:first.id,name:first.name,code:first.code,status:first.status,companyCount:cs.length,departmentCount:cs.reduce((n,c)=>n+(c.departments?.length??0),0),employeeCount:0});
   setCompanies(cs.map(c=>({id:c.id,name:c.name,code:c.code,status:c.status,departmentCount:c.departments?.length??0,employeeCount:0}))); setDepartments(dep); setState('ready');
 }catch(e){setState(e instanceof Error&&e.message==='FORBIDDEN'?'forbidden':'error')}})();},[]);
 return <OrganizationAdminView state={state} organization={organization} companies={companies} departmentsByCompany={departments}/>;
}
