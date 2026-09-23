import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

type E2EUser={id:string;role:'tenant_admin'|'instructor'|'learner';token:string;expiresAt:string;employeeId?:string};
type Fixture={
 tenantId:string;otherTenantId:string;organizationId:string;otherOrganizationId:string;companyId:string;departmentId:string;groupId:string;
 approvedQuestionVersionIds:string[];
 users:{admin:E2EUser;instructor:E2EUser;learners:E2EUser[]};
};
let fixture:Fixture;
const mission:{trainingId?:string;versionId?:string;objectiveId?:string;assessmentId?:string;resolutionId?:string}={};

async function login(page:Page,user:E2EUser){
 await page.goto('/');
 await page.evaluate(({user,tenantId})=>{
   sessionStorage.clear();
   sessionStorage.setItem('kaep.access_token',user.token);
   sessionStorage.setItem('kaep.session',JSON.stringify({userId:user.id,tenantId,role:user.role,expiresAt:user.expiresAt}));
 },{user,tenantId:fixture.tenantId});
 await page.reload();
}

async function json<T>(response:any):Promise<T>{
 expect(response.ok(),`HTTP ${response.status()} ${await response.text()}`).toBeTruthy();
 return response.json() as Promise<T>;
}

test.describe.serial('AEGIS MUR M7 browser mission',()=>{
 test.beforeAll(async()=>{
   const r=await fetch('http://127.0.0.1:4100/fixture');
   if(!r.ok)throw new Error(`fixture unavailable: ${r.status}`);
   fixture=await r.json() as Fixture;
 });

 test('MUR-E2E-001 Author → Audience → Learner → Assessment → Insight → Certificate → Admin aggregate',async({page,request})=>{
   await login(page,fixture.users.instructor);
   await expect(page.getByTestId('training-status')).toHaveText('NEW');
   await page.getByTestId('training-title').fill('MUR E2E Phishing');
   await page.getByTestId('training-objective').fill('Phishing riskini ayırt eder');
   await page.getByTestId('training-module').fill('Phishing Module');
   await page.getByTestId('training-content').fill('Phishing Defense Content');
   await page.getByTestId('save-training').click();
   await expect(page.getByTestId('training-status')).toHaveText('DRAFT');
   await page.getByTestId('submit-training-review').click();
   await expect(page.getByTestId('training-status')).toHaveText('IN_REVIEW');
   await page.getByTestId('publish-training').click();
   await expect(page.getByTestId('training-status')).toHaveText('PUBLISHED');

   const trainings=await json<{items:Array<{id:string;title:string}>}>(await request.get('/api/v1/trainings',{headers:{authorization:`Bearer ${fixture.users.instructor.token}`}}));
   const training=trainings.items.find(x=>x.title==='MUR E2E Phishing');expect(training).toBeTruthy();mission.trainingId=training!.id;
   const versions=await json<{items:Array<{id:string;version:number}>}>(await request.get(`/api/v1/trainings/${training!.id}/versions`,{headers:{authorization:`Bearer ${fixture.users.instructor.token}`}}));
   expect(versions.items).toHaveLength(1);mission.versionId=versions.items[0]!.id;
   const detail=await json<{objectives:Array<{id:string;statement:string}>}>(await request.get(`/api/v1/trainings/${training!.id}`,{headers:{authorization:`Bearer ${fixture.users.instructor.token}`}}));
   mission.objectiveId=detail.objectives[0]!.id;

   await page.locator('aside a').filter({hasText:'Değerlendirmeler'}).click();
   await expect(page.getByTestId('assessment-authoring-runtime')).toBeVisible();
   await expect(page.getByTestId('assessment-version')).toHaveValue(mission.versionId);
   await page.getByTestId('assessment-pass-percent').fill('60');
   const questionChecks=page.locator('[data-testid^="assessment-question-"]');
   await expect(questionChecks).toHaveCount(3);
   for(let i=0;i<3;i++)await questionChecks.nth(i).check();
   await page.getByTestId('publish-assessment-snapshot').click();
   await expect(page.getByTestId('assessment-published')).toContainText('replay: false');
   const assessments=await json<{items:Array<{id:string}>}>(await request.get(`/api/v1/trainings/${mission.trainingId}/versions/${mission.versionId}/assessments`,{headers:{authorization:`Bearer ${fixture.users.instructor.token}`}}));
   expect(assessments.items).toHaveLength(1);mission.assessmentId=assessments.items[0]!.id;

   await login(page,fixture.users.admin);
   await page.locator('aside a').filter({hasText:'Operasyonlar'}).click();
   await expect(page.getByTestId('audience-runtime')).toBeVisible();
   await expect(page.getByTestId('audience-preview')).toBeEnabled();
   await page.getByTestId('audience-preview').click();
   await expect(page.getByTestId('audience-preview-result')).toContainText('atanabilir öğrenen: 5');
   await page.getByTestId('audience-confirm').click();
   await expect(page.getByTestId('audience-confirm-result')).toContainText('Assignment adayı: 5');
   await page.getByTestId('audience-assign').click();
   await expect(page.getByTestId('audience-assigned')).toContainText('"createdCount": 5');
   const persisted=JSON.parse((await page.getByTestId('audience-assigned').locator('pre').textContent())??'{}') as {resolutionId:string};
   mission.resolutionId=persisted.resolutionId;

   await login(page,fixture.users.learners[0]!);
   await expect(page.getByTestId('learner-training-runtime')).toBeVisible();
   await expect(page.getByTestId('learner-training')).toContainText('MUR E2E Phishing');
   const moduleButton=page.locator('[data-testid^="complete-module-"]').first();
   await moduleButton.click();
   await expect(moduleButton).toBeDisabled();
   await page.reload();
   await expect(page.getByTestId('resume-state')).toContainText('Tamamlanan öğe: 1');

   await page.locator('aside a').filter({hasText:'Değerlendirmeler'}).click();
   await expect(page.getByTestId('learner-assessment-runtime')).toBeVisible();
   await page.locator('[data-testid^="start-assessment-"]').first().click();
   await expect(page.getByTestId('assessment-attempt')).toBeVisible();
   const fieldsets=page.getByTestId('assessment-attempt').locator('fieldset');
   await expect(fieldsets).toHaveCount(3);
   await fieldsets.nth(0).locator('input[type="radio"]').nth(1).check();
   await expect(fieldsets.nth(0).locator('input[type="radio"]').nth(1)).toBeChecked();
   await fieldsets.nth(1).locator('input[type="radio"]').nth(1).check();
   await expect(fieldsets.nth(1).locator('input[type="radio"]').nth(1)).toBeChecked();
   await fieldsets.nth(2).locator('input[type="radio"]').nth(0).check();
   await expect(fieldsets.nth(2).locator('input[type="radio"]').nth(0)).toBeChecked();
   await expect(page.getByTestId('submit-assessment')).toBeEnabled();
   await page.getByTestId('submit-assessment').click();
   await expect(page.getByTestId('assessment-result')).toContainText('Puan: %67');
   await expect(page.getByTestId('assessment-result')).toContainText('Başarılı');

   await page.locator('aside a').filter({hasText:'Öğrenme İçgörüleri'}).click();
   await page.getByTestId('load-insights').click();
   await expect(page.getByTestId('insight-result')).toContainText('BOUNDED_INSIGHT');
   await expect(page.getByTestId('insight-result')).toContainText('Phishing Defense Content');

   await page.locator('aside a').filter({hasText:'Sertifikalarım'}).click();
   await expect(page.locator('[data-testid^="certificate-"]').first()).toContainText('ISSUED');

   await login(page,fixture.users.admin);
   await page.locator('aside a').filter({hasText:'Analitik'}).click();
   await expect(page.getByTestId('admin-analytics-runtime')).toBeVisible();
   await page.getByTestId('load-admin-analytics').click();
   await expect(page.getByTestId('analytics-result')).toContainText('AGGREGATED');
   await expect(page.getByTestId('analytics-result')).toContainText('Atanan: 5');
   await expect(page.getByTestId('analytics-result')).toContainText('tamamlanan: 1');
 });

 test('MUR-E2E-002 insufficient-evidence abstention',async({page})=>{
   await login(page,fixture.users.learners[1]!);
   await page.locator('aside a').filter({hasText:'Öğrenme İçgörüleri'}).click();
   await page.getByTestId('load-insights').click();
   await expect(page.getByTestId('insight-result')).toContainText('INSUFFICIENT_EVIDENCE');
   await expect(page.getByTestId('insight-result')).toContainText('sistem yorum üretmedi');
 });

 test('MUR-E2E-003 cross-tenant substitution fails closed',async({request})=>{
   const auth={authorization:`Bearer ${fixture.users.admin.token}`};
   const analytics=await request.get(`/api/v1/admin/learning-analytics?scopeType=ORGANIZATION&scopeId=${fixture.otherOrganizationId}`,{headers:auth});
   expect(analytics.status()).toBe(404);
   const audience=await request.post('/api/v1/training-audiences/preview',{headers:{...auth,'content-type':'application/json'},data:{
     organizationId:fixture.organizationId,trainingId:mission.trainingId,trainingVersionId:mission.versionId,
     targets:[{type:'ORGANIZATION',id:fixture.otherOrganizationId}],
   }});
   expect(audience.status()).toBe(403);
   expect(await audience.json()).toMatchObject({code:'CROSS_TENANT_REFERENCE'});
 });

 test('MUR-E2E-004 replay/idempotency and immutable history integrity',async({page,request})=>{
   expect(mission.trainingId&&mission.versionId&&mission.resolutionId&&mission.objectiveId&&mission.assessmentId).toBeTruthy();
   const adminAuth={authorization:`Bearer ${fixture.users.admin.token}`};
   const preview=await json<any>(await request.post('/api/v1/training-audiences/preview',{headers:{...adminAuth,'content-type':'application/json'},data:{
     organizationId:fixture.organizationId,trainingId:mission.trainingId,trainingVersionId:mission.versionId,targets:[{type:'ORGANIZATION',id:fixture.organizationId}],
   }}));
   const confirm=await json<any>(await request.post('/api/v1/training-audiences/confirm',{headers:{...adminAuth,'content-type':'application/json'},data:{
     organizationId:fixture.organizationId,trainingId:mission.trainingId,trainingVersionId:mission.versionId,targets:[{type:'ORGANIZATION',id:fixture.organizationId}],
     resolutionFingerprint:preview.fingerprint,idempotencyKey:`ui-confirm-${mission.trainingId}-${mission.versionId}-ORGANIZATION-${fixture.organizationId}`,
   }}));
   expect(confirm.resolutionId).toBe(mission.resolutionId);
   const replayAssignment=await request.post(`/api/v1/training-audiences/${mission.resolutionId}/assignments`,{headers:{...adminAuth,'content-type':'application/json'},data:{
     trainingId:mission.trainingId,trainingVersionId:mission.versionId,resolutionFingerprint:preview.fingerprint,idempotencyKey:`ui-assign-${mission.resolutionId}`,
   }});
   expect(replayAssignment.status()).toBe(200);
   expect(await replayAssignment.json()).toMatchObject({replayed:true,result:{createdCount:5,reusedCount:0}});

   const instructorAuth={authorization:`Bearer ${fixture.users.instructor.token}`};
   const assessmentReplay=await json<any>(await request.post(`/api/v1/trainings/${mission.trainingId}/versions/${mission.versionId}/assessments`,{
     headers:{...instructorAuth,'content-type':'application/json','idempotency-key':`ui-assessment-${mission.versionId}`},
     data:{passPercent:60,questions:fixture.approvedQuestionVersionIds.map(questionVersionId=>({questionVersionId,objectiveId:mission.objectiveId,points:1}))},
   }));
   expect(assessmentReplay.replayed).toBe(true);expect(assessmentReplay.id).toBe(mission.assessmentId);

   const published=await json<any>(await request.get(`/api/v1/trainings/${mission.trainingId}`,{headers:instructorAuth}));
   const illegal=await request.patch(`/api/v1/trainings/${mission.trainingId}`,{headers:{...instructorAuth,'content-type':'application/json'},data:{
     title:'MUTATION MUST FAIL',revision:published.revision,objectives:[{id:mission.objectiveId,statement:'mutated'}],modules:[{title:'mutated',contents:[{title:'mutated content',type:'TEXT',objectiveIds:[mission.objectiveId]}]}],
   }});
   expect(illegal.status()).toBe(409);

   await login(page,fixture.users.learners[0]!);
   await expect(page.getByTestId('learner-training')).toContainText('MUR E2E Phishing');
   await expect(page.getByTestId('learner-training')).toContainText('Phishing Defense Content');
   await page.reload();
   await expect(page.getByTestId('learner-training')).toContainText('MUR E2E Phishing');
   await expect(page.getByTestId('resume-state')).toContainText('Tamamlanan öğe: 1');
 });
 test('MUR-E2E-005 security boundary regression',async({request})=>{
   const spoof=await request.get('/api/v1/organizations',{headers:{'x-kaep-tenant-id':fixture.tenantId,'x-kaep-user-id':fixture.users.admin.id,'x-kaep-role':'tenant_admin'}});
   expect(spoof.status()).toBe(401);
   const invalid=await request.get('/api/v1/organizations',{headers:{authorization:'Bearer invalid-token'}});
   expect(invalid.status()).toBe(401);
   const override=await request.post('/api/v1/training-audiences/preview',{headers:{authorization:`Bearer ${fixture.users.admin.token}`,'content-type':'application/json'},data:{tenantId:fixture.otherTenantId,organizationId:fixture.organizationId,trainingId:mission.trainingId,trainingVersionId:mission.versionId,targets:[{type:'ORGANIZATION',id:fixture.organizationId}]}});
   expect(override.status()).toBe(400);
   expect(await override.json()).toMatchObject({code:'CLIENT_IDENTITY_OVERRIDE_FORBIDDEN'});
 });

});
