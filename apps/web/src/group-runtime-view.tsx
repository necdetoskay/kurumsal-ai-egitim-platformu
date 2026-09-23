import React,{useEffect,useState} from 'react';
import { GroupDirectoryAdminView,type GroupRow } from './group-directory-admin-ui';
import { bearerHttp } from './runtime-session';
export function GroupRuntimeView(){
 const [state,setState]=useState<'loading'|'ready'|'empty'|'error'|'forbidden'>('loading'); const [groups,setGroups]=useState<GroupRow[]>([]);
 useEffect(()=>{void(async()=>{try{const http=bearerHttp();const orgs:any=await http.get('/api/v1/organizations');const org=orgs.items?.[0];if(!org){setState('empty');return;}const r:any=await http.get(`/api/v1/organizations/${encodeURIComponent(org.id)}/groups`);const next:GroupRow[]=(r.items??[]).map((g:any)=>({id:g.id,name:g.name,type:g.type??'MANUAL',status:g.status??'ACTIVE',memberCount:0}));setGroups(next);setState(next.length?'ready':'empty')}catch(e){setState(e instanceof Error&&e.message==='FORBIDDEN'?'forbidden':'error')}})()},[]);
 return <GroupDirectoryAdminView state={state} groups={groups}/>;
}
