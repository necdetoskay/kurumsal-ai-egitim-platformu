import type { SessionState } from './auth';

export function sessionFromRuntime(): SessionState {
  const token=sessionStorage.getItem('kaep.access_token');
  const raw=sessionStorage.getItem('kaep.session');
  if(!token||!raw) return {status:'unauthenticated'};
  try {
    const parsed=JSON.parse(raw) as {userId:string;tenantId:string;role:'tenant_admin'|'instructor'|'reviewer'|'learner';expiresAt:string};
    if(!parsed.userId||!parsed.tenantId||!parsed.role) return {status:'unauthenticated'};
    if(Date.parse(parsed.expiresAt)<=Date.now()) return {status:'expired'};
    return {status:'authenticated',...parsed};
  } catch { return {status:'unauthenticated'}; }
}
export function bearerHttp(){
  const request=async<T>(path:string,init:RequestInit={})=>{
    const token=sessionStorage.getItem('kaep.access_token');
    if(!token) throw new Error('SESSION_REQUIRED');
    const response=await fetch(path,{...init,headers:{'content-type':'application/json',authorization:`Bearer ${token}`,...(init.headers??{})}});
    if(response.status===401) throw new Error('SESSION_EXPIRED');
    if(response.status===403) throw new Error('FORBIDDEN');
    if(!response.ok) throw new Error(`HTTP_${response.status}`);
    return response.json() as Promise<T>;
  };
  return {request,get:<T>(path:string)=>request<T>(path),post:<T>(path:string,body?:unknown)=>request<T>(path,{method:'POST',body:body===undefined?undefined:JSON.stringify(body)}),put:<T>(path:string,body:unknown)=>request<T>(path,{method:'PUT',body:JSON.stringify(body)}),patch:<T>(path:string,body:unknown)=>request<T>(path,{method:'PATCH',body:JSON.stringify(body)}),delete:<T>(path:string)=>request<T>(path,{method:'DELETE'})};
}
