import React,{useEffect,useState} from 'react';
import { PersonnelAdminView,type PersonnelRow } from './personnel-admin-ui';
import { bearerHttp } from './runtime-session';
export function PersonnelRuntimeView(){
 const [state,setState]=useState<'loading'|'ready'|'empty'|'error'|'forbidden'>('loading'); const [rows,setRows]=useState<PersonnelRow[]>([]);
 useEffect(()=>{void(async()=>{try{
  const http=bearerHttp(); const orgs:any=await http.get('/api/v1/organizations'); const org=orgs.items?.[0]; if(!org){setState('empty');return;}
  const result:any=await http.get(`/api/v1/organizations/${encodeURIComponent(org.id)}/employees`);
  const next:PersonnelRow[]=(result.items??[]).map((e:any)=>({id:e.id,fullName:[e.first_name??e.firstName,e.last_name??e.lastName].filter(Boolean).join(' '),employeeNo:e.employee_no??e.employeeNo,email:e.email,status:e.status??'ACTIVE',accountState:'NOT_LINKED'}));
  setRows(next);setState(next.length?'ready':'empty');
 }catch(e){setState(e instanceof Error&&e.message==='FORBIDDEN'?'forbidden':'error')}})()},[]);
 return <PersonnelAdminView state={state} employees={rows}/>;
}
