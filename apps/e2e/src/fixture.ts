import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { Pool } from 'pg';

const port=Number(process.env.E2E_IDP_PORT??4100);
const issuer=process.env.E2E_ISSUER??`http://127.0.0.1:${port}/`;
const audience=process.env.E2E_AUDIENCE??'kaep-e2e';
const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl)throw new Error('DATABASE_URL required');

const pool=new Pool({connectionString:databaseUrl});
const {publicKey,privateKey}=await generateKeyPair('RS256',{modulusLength:2048,extractable:true});
const publicJwk:any=await exportJWK(publicKey);
publicJwk.kid='kaep-e2e-key';publicJwk.alg='RS256';publicJwk.use='sig';

const ids={
 tenantId:randomUUID(),otherTenantId:randomUUID(),
 organizationId:randomUUID(),otherOrganizationId:randomUUID(),
 companyId:randomUUID(),departmentId:randomUUID(),groupId:randomUUID(),
 admin:randomUUID(),instructor:randomUUID(),
 learners:[randomUUID(),randomUUID(),randomUUID(),randomUUID(),randomUUID()],
 employees:[randomUUID(),randomUUID(),randomUUID(),randomUUID(),randomUUID()],
};

const subjects={admin:'e2e-admin',instructor:'e2e-instructor',learners:['e2e-learner-1','e2e-learner-2','e2e-learner-3','e2e-learner-4','e2e-learner-5']};

async function sign(sub:string){
 return new SignJWT({tenant_id:ids.tenantId})
  .setProtectedHeader({alg:'RS256',kid:publicJwk.kid})
  .setIssuer(issuer).setAudience(audience).setSubject(sub).setIssuedAt().setExpirationTime('2h').sign(privateKey);
}

const client=await pool.connect();
try{
 await client.query('begin');
 await client.query('insert into tenants(id,name,slug) values($1,$2,$3),($4,$5,$6)',[ids.tenantId,'KAEP E2E Tenant',`e2e-${randomUUID()}`,ids.otherTenantId,'KAEP E2E Other',`e2e-${randomUUID()}`]);
 await client.query(`insert into users(id,external_subject,display_name,email,is_active) values
  ($1,$2,'E2E Admin',$3,true),($4,$5,'E2E Instructor',$6,true),
  ($7,$8,'E2E Learner 1',$9,true),($10,$11,'E2E Learner 2',$12,true),($13,$14,'E2E Learner 3',$15,true),
  ($16,$17,'E2E Learner 4',$18,true),($19,$20,'E2E Learner 5',$21,true)`,[
   ids.admin,subjects.admin,`admin-${randomUUID()}@example.invalid`,
   ids.instructor,subjects.instructor,`instructor-${randomUUID()}@example.invalid`,
   ids.learners[0],subjects.learners[0],`learner1-${randomUUID()}@example.invalid`,
   ids.learners[1],subjects.learners[1],`learner2-${randomUUID()}@example.invalid`,
   ids.learners[2],subjects.learners[2],`learner3-${randomUUID()}@example.invalid`,
   ids.learners[3],subjects.learners[3],`learner4-${randomUUID()}@example.invalid`,
   ids.learners[4],subjects.learners[4],`learner5-${randomUUID()}@example.invalid`,
  ]);

 const allUsers=[ids.admin,ids.instructor,...ids.learners];
 const membershipIds=allUsers.map(()=>randomUUID());
 for(let i=0;i<allUsers.length;i++){
  await client.query("insert into memberships(id,tenant_id,user_id,status) values($1,$2,$3,'active')",[membershipIds[i],ids.tenantId,allUsers[i]]);
 }

 const permissions=[
  'organization.read','organization.manage','user.read','training.read','training.create','training.edit','training.submit_review','training.publish',
  'assignment.create','assignment.manage','learning.consume','learning.progress.self','question.read','assessment.read','assessment.create','assessment.edit','assessment.publish',
  'assessment.attempt.self','assessment.result.self','retake.request.self','certificate.self','analytics.self','analytics.organization'
 ];
 for(const code of permissions)await client.query('insert into permissions(code,description) values($1,$2) on conflict(code) do nothing',[code,`E2E ${code}`]);

 const roleIds={admin:randomUUID(),instructor:randomUUID(),learner:randomUUID()};
 await client.query(`insert into roles(id,tenant_id,code,name,is_system) values
   ($1,$4,'tenant_admin','Tenant Admin',true),($2,$4,'instructor','Instructor',true),($3,$4,'learner','Learner',true)`,
   [roleIds.admin,roleIds.instructor,roleIds.learner,ids.tenantId]);
 const adminPerms=permissions;
 const instructorPerms=['organization.read','training.read','training.create','training.edit','training.submit_review','training.publish','assignment.create','assignment.manage','question.read','assessment.read','assessment.create','assessment.edit','assessment.publish','analytics.self'];
 const learnerPerms=['organization.read','training.read','learning.consume','learning.progress.self','assessment.read','assessment.attempt.self','assessment.result.self','retake.request.self','certificate.self','analytics.self'];
 for(const [roleId,perms] of [[roleIds.admin,adminPerms],[roleIds.instructor,instructorPerms],[roleIds.learner,learnerPerms]] as const){
  for(const permission of perms)await client.query('insert into role_permissions(role_id,permission_code) values($1,$2)',[roleId,permission]);
 }
 await client.query('insert into user_roles(membership_id,role_id) values($1,$2),($3,$4)',[membershipIds[0],roleIds.admin,membershipIds[1],roleIds.instructor]);
 for(let i=2;i<membershipIds.length;i++)await client.query('insert into user_roles(membership_id,role_id) values($1,$2)',[membershipIds[i],roleIds.learner]);

 await client.query("insert into organizations(id,tenant_id,name,code,default_locale,timezone) values($1,$2,'E2E Organization','E2E','tr-TR','Europe/Istanbul'),($3,$4,'Foreign Organization','FOREIGN','tr-TR','Europe/Istanbul')",[ids.organizationId,ids.tenantId,ids.otherOrganizationId,ids.otherTenantId]);
 await client.query("insert into companies(id,tenant_id,organization_id,name,code) values($1,$2,$3,'E2E Company','E2EC')",[ids.companyId,ids.tenantId,ids.organizationId]);
 await client.query("insert into departments(id,tenant_id,company_id,name,code) values($1,$2,$3,'E2E Department','E2ED')",[ids.departmentId,ids.tenantId,ids.companyId]);
 await client.query("insert into groups(id,tenant_id,organization_id,name,code,type) values($1,$2,$3,'E2E Group','E2EG','MANUAL')",[ids.groupId,ids.tenantId,ids.organizationId]);

 for(let i=0;i<ids.learners.length;i++){
  const employmentId=randomUUID();
  await client.query("insert into employees(id,tenant_id,organization_id,employee_no,first_name,last_name,status) values($1,$2,$3,$4,$5,'Learner','ACTIVE')",[ids.employees[i],ids.tenantId,ids.organizationId,`E2E-${i+1}`,`E2E ${i+1}`]);
  await client.query("insert into employments(id,tenant_id,employee_id,company_id,department_id,employment_type,start_date,is_primary,status) values($1,$2,$3,$4,$5,'FULL_TIME','2026-01-01',true,'ACTIVE')",[employmentId,ids.tenantId,ids.employees[i],ids.companyId,ids.departmentId]);
  await client.query('insert into employee_user_links(tenant_id,employee_id,user_id,created_by_user_id) values($1,$2,$3,$4)',[ids.tenantId,ids.employees[i],ids.learners[i],ids.admin]);
  await client.query("insert into group_memberships(tenant_id,group_id,employee_id,source) values($1,$2,$3,'MANUAL')",[ids.tenantId,ids.groupId,ids.employees[i]]);
 }

 const approvedQuestionVersionIds:string[]=[];
 for(let i=0;i<3;i++){
  const questionId=randomUUID(),questionVersionId=randomUUID();approvedQuestionVersionIds.push(questionVersionId);
  await client.query("insert into questions(id,tenant_id,status) values($1,$2,'APPROVED')",[questionId,ids.tenantId]);
  await client.query('insert into question_versions(id,tenant_id,question_id,version,prompt,options_json,correct_option_index) values($1,$2,$3,1,$4,$5::jsonb,1)',[
   questionVersionId,ids.tenantId,questionId,`E2E Question ${i+1}: doğru seçeneği işaretleyin`,JSON.stringify(['Yanlış seçenek','Doğru seçenek'])
  ]);
 }
 await client.query('commit');

 const expiresAt=new Date(Date.now()+2*60*60*1000).toISOString();
 const fixture={
  issuer,audience,tenantId:ids.tenantId,otherTenantId:ids.otherTenantId,organizationId:ids.organizationId,otherOrganizationId:ids.otherOrganizationId,
  companyId:ids.companyId,departmentId:ids.departmentId,groupId:ids.groupId,approvedQuestionVersionIds,
  users:{
   admin:{id:ids.admin,role:'tenant_admin',token:await sign(subjects.admin),expiresAt},
   instructor:{id:ids.instructor,role:'instructor',token:await sign(subjects.instructor),expiresAt},
   learners:await Promise.all(ids.learners.map(async(id,index)=>({id,role:'learner',token:await sign(subjects.learners[index]!),expiresAt,employeeId:ids.employees[index]}))),
  },
 };

 const server=createServer((req,res)=>{
  if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({status:'ok'}));return;}
  if(req.url==='/jwks'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({keys:[publicJwk]}));return;}
  if(req.url==='/fixture'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(fixture));return;}
  res.writeHead(404);res.end();
 });
 server.listen(port,'127.0.0.1',()=>process.stdout.write(`E2E fixture ready on ${issuer}\n`));
 const shutdown=async()=>{server.close();await pool.end();process.exit(0);};
 process.on('SIGTERM',()=>void shutdown());process.on('SIGINT',()=>void shutdown());
} catch(error){
 await client.query('rollback').catch(()=>{});
 await pool.end();
 throw error;
} finally {
 client.release();
}
