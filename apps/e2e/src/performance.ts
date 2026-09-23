const fixture=await (await fetch('http://127.0.0.1:4100/fixture')).json() as {users:{admin:{token:string};instructor:{token:string}}};
const api='http://127.0.0.1:3001';
const cases=[
 {name:'organizations',path:'/api/v1/organizations',token:fixture.users.admin.token},
 {name:'trainings',path:'/api/v1/trainings',token:fixture.users.instructor.token},
];
const samples:{name:string;ms:number;status:number}[]=[];
for(const c of cases){
 for(let i=0;i<50;i++){
  const start=performance.now();
  const r=await fetch(api+c.path,{headers:{authorization:`Bearer ${c.token}`}});
  samples.push({name:c.name,ms:performance.now()-start,status:r.status});
  await r.arrayBuffer();
 }
}
const failures=samples.filter(x=>x.status<200||x.status>=300);
if(failures.length)throw new Error(`release load baseline had ${failures.length} HTTP failures`);
for(const c of cases){
 const xs=samples.filter(x=>x.name===c.name).map(x=>x.ms).sort((a,b)=>a-b);
 const p50=xs[Math.floor(xs.length*0.50)]??0;
 const p95=xs[Math.min(xs.length-1,Math.ceil(xs.length*0.95)-1)]??0;
 const max=xs[xs.length-1]??0;
 console.log(JSON.stringify({endpoint:c.path,requests:xs.length,p50Ms:Number(p50.toFixed(1)),p95Ms:Number(p95.toFixed(1)),maxMs:Number(max.toFixed(1)),errors:0}));
 if(p95>1000)throw new Error(`${c.path} p95 ${p95.toFixed(1)}ms exceeds 1000ms M8 baseline`);
}
console.log('M8 authenticated API load baseline PASS');
