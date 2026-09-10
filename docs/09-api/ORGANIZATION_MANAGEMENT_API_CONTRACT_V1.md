# Organization Management API Contract — V1

Status: Canonical contract
Date: 2026-09-05
Depends on:
- `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
- `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
- `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
- `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
- `docs/09-api/OPENAPI_BASELINE.md`

## 1. Purpose

Bu belge Organization Management bounded context'i için V1 HTTP API sözleşmesini tanımlar. Amaç; UI, backend, entegrasyon ve test katmanlarının aynı endpoint, payload, hata ve concurrency davranışına göre çalışmasıdır.

## 2. Global API Rules

- Base path: `/api/v1`
- Media type: `application/json`
- Authentication zorunludur.
- `tenant_id` client payload'ından alınmaz; güvenilir auth/session context'inden çözülür.
- Object-level authorization her resource için zorunludur.
- Organization/company/department scope kontrolleri server-side yapılır.
- Mutating endpoint'lerde audit event üretilir.
- Tarihsel entity'ler hard-delete edilmez; lifecycle endpoint'leri kullanılır.
- Idempotency kritik POST işlemlerinde `Idempotency-Key` header ile desteklenir.
- Optimistic concurrency için mutable aggregate response'larında `version` alanı bulunur.
- PATCH/command işlemlerinde `If-Match` veya request body `expectedVersion` kullanılır; stale write `409 VERSION_CONFLICT` döndürür.
- Pagination default 25, max 100 kayıt; cursor tabanlı pagination tercih edilir.

## 3. Standard Response Shapes

### 3.1 Resource envelope

```json
{
  "data": {},
  "meta": {
    "correlationId": "uuid"
  }
}
```

### 3.2 Collection envelope

```json
{
  "data": [],
  "meta": {
    "nextCursor": null,
    "count": 25,
    "correlationId": "uuid"
  }
}
```

### 3.3 Error envelope

```json
{
  "error": {
    "code": "DEPARTMENT_CYCLE",
    "message": "İşlem gerçekleştirilemedi.",
    "details": {},
    "correlationId": "uuid"
  }
}
```

Client'a stack trace, SQL error veya secret veri verilmez.

## 4. Common Error Codes

- `VALIDATION_ERROR` → 400
- `UNAUTHENTICATED` → 401
- `FORBIDDEN` → 403
- `NOT_FOUND` → 404
- `VERSION_CONFLICT` → 409
- `DUPLICATE_CODE` → 409
- `DUPLICATE_ACTIVE_MEMBERSHIP` → 409
- `ACTIVE_PRIMARY_EMPLOYMENT_EXISTS` → 409
- `EMPLOYMENT_DATE_OVERLAP` → 409
- `CROSS_TENANT_REFERENCE` → 422
- `CROSS_ORGANIZATION_REFERENCE` → 422
- `CROSS_COMPANY_DEPARTMENT_REFERENCE` → 422
- `DEPARTMENT_CYCLE` → 422
- `INVALID_LIFECYCLE_TRANSITION` → 422
- `RESOURCE_IN_USE` → 422
- `IDEMPOTENCY_CONFLICT` → 409

## 5. Organization Endpoints

### GET `/organizations`

Amaç: erişilebilir organizasyonları listeler.

Query:
- `status`
- `search`
- `cursor`
- `limit`

### POST `/organizations`

Permission: tenant-level organization administration.

Request:
```json
{
  "name": "ABC Holding",
  "code": "ABC",
  "status": "ACTIVE"
}
```

Rules:
- `code` tenant içinde unique.
- `tenantId` payload kabul edilmez.

Response: `201` Organization resource.

### GET `/organizations/{organizationId}`

### PATCH `/organizations/{organizationId}`

Request örneği:
```json
{
  "name": "ABC Holding A.Ş.",
  "expectedVersion": 4
}
```

### POST `/organizations/{organizationId}/passivate`
### POST `/organizations/{organizationId}/reactivate`

Lifecycle command endpoint'leridir; generic `DELETE` kullanılmaz.

## 6. Company Endpoints

### GET `/organizations/{organizationId}/companies`

Filters:
- `status`
- `search`
- `cursor`
- `limit`

### POST `/organizations/{organizationId}/companies`

Request:
```json
{
  "name": "Kent Konut A.Ş.",
  "legalName": "Kent Konut İnşaat Sanayi ve Ticaret A.Ş.",
  "code": "KENTKONUT",
  "taxNumber": "1234567890"
}
```

Rules:
- organization current tenant'a ait olmalı.
- `code` organization içinde unique.

### GET `/companies/{companyId}`
### PATCH `/companies/{companyId}`
### POST `/companies/{companyId}/passivate`
### POST `/companies/{companyId}/reactivate`

Passivation mevcut historical employment/assignment kayıtlarını silmez veya yeniden yazarak değiştirmez.

## 7. Department Endpoints

### GET `/companies/{companyId}/departments`

Query:
- `parentId`
- `status`
- `search`
- `tree=true|false`

`tree=true` projection hiyerarşik read model döndürebilir.

### POST `/companies/{companyId}/departments`

Request:
```json
{
  "name": "Bilgi İşlem Müdürlüğü",
  "code": "BIM",
  "parentDepartmentId": null,
  "sortOrder": 10
}
```

### GET `/departments/{departmentId}`
### PATCH `/departments/{departmentId}`

### POST `/departments/{departmentId}/move`

Request:
```json
{
  "newParentDepartmentId": "uuid-or-null",
  "expectedVersion": 3
}
```

Rules:
- new parent aynı company ve tenant içinde olmalı.
- self-parent ve descendant-parent yasak.
- cycle oluşursa `DEPARTMENT_CYCLE`.

### POST `/departments/{departmentId}/passivate`
### POST `/departments/{departmentId}/reactivate`

Passivation sırasında aktif child/employee etkisi business rule'a göre validate edilir; client cascade davranışı varsayamaz.

## 8. Position Endpoints

### GET `/organizations/{organizationId}/positions`
### POST `/organizations/{organizationId}/positions`
### GET `/positions/{positionId}`
### PATCH `/positions/{positionId}`
### POST `/positions/{positionId}/passivate`
### POST `/positions/{positionId}/reactivate`

Create request:
```json
{
  "name": "Bilgi İşlem Müdürü",
  "code": "BIM",
  "level": 2,
  "isManagerial": true
}
```

## 9. Location Endpoints

### GET `/organizations/{organizationId}/locations`
### POST `/organizations/{organizationId}/locations`
### GET `/locations/{locationId}`
### PATCH `/locations/{locationId}`
### POST `/locations/{locationId}/passivate`
### POST `/locations/{locationId}/reactivate`

Create request:
```json
{
  "companyId": "uuid-or-null",
  "name": "Genel Müdürlük",
  "code": "LOC-GM",
  "locationType": "OFFICE",
  "city": "Kocaeli",
  "district": "İzmit",
  "address": "Karabaş Mah. ..."
}
```

## 10. Employee Endpoints

### GET `/organizations/{organizationId}/employees`

Filters:
- `status`
- `companyId`
- `departmentId`
- `positionId`
- `groupId`
- `locationId`
- `search`
- `cursor`
- `limit`

Bu endpoint current placement projection kullanabilir; historical placement gerektiğinde employment endpoint'i çağrılır.

### POST `/organizations/{organizationId}/employees`

Request:
```json
{
  "employeeNo": "12345",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "email": "ahmet@example.com",
  "phone": "+90...",
  "hireDate": "2026-01-15"
}
```

Employee create tek başına company/department placement yaratmak zorunda değildir.

### GET `/employees/{employeeId}`
### PATCH `/employees/{employeeId}`
### POST `/employees/{employeeId}/terminate`
### POST `/employees/{employeeId}/reactivate`

Terminate request:
```json
{
  "terminationDate": "2026-09-05",
  "reason": "OPTIONAL_TEXT",
  "expectedVersion": 7
}
```

Employee termination historical completion/certificate/audit kayıtlarını etkilemez.

## 11. Employment Endpoints

### GET `/employees/{employeeId}/employments`

Chronological placement history.

### POST `/employees/{employeeId}/employments`

Yeni employment başlatır.

Request:
```json
{
  "companyId": "uuid",
  "departmentId": "uuid-or-null",
  "positionId": "uuid-or-null",
  "locationId": "uuid-or-null",
  "managerEmploymentId": "uuid-or-null",
  "employmentType": "FULL_TIME",
  "startDate": "2026-09-01",
  "isPrimary": true
}
```

Rules:
- cross-scope FK yasak.
- overlapping active primary employment yasak.

### POST `/employments/{employmentId}/end`

Request:
```json
{
  "endDate": "2026-08-31",
  "expectedVersion": 2
}
```

### POST `/employees/{employeeId}/transfer`

Old employment'ı kapatıp new employment yaratmayı atomik command olarak yapar.

Request:
```json
{
  "fromEmploymentId": "uuid",
  "newPlacement": {
    "companyId": "uuid",
    "departmentId": "uuid",
    "positionId": "uuid",
    "locationId": "uuid-or-null",
    "managerEmploymentId": "uuid-or-null"
  },
  "effectiveDate": "2026-09-01",
  "expectedEmploymentVersion": 5
}
```

Response: `200` new employment + closed previous employment summary.

## 12. Group Endpoints

### GET `/organizations/{organizationId}/groups`
### POST `/organizations/{organizationId}/groups`
### GET `/groups/{groupId}`
### PATCH `/groups/{groupId}`
### POST `/groups/{groupId}/passivate`
### POST `/groups/{groupId}/reactivate`

Create request:
```json
{
  "name": "Yöneticiler",
  "description": "Tüm yönetici seviyeleri",
  "groupType": "MANUAL"
}
```

`SYSTEM` group create yalnızca sistem/privileged internal operation ile yapılabilir.

## 13. Group Membership Endpoints

### GET `/groups/{groupId}/members`

Query:
- `activeOnly=true|false`
- `sourceType`
- `cursor`
- `limit`

### POST `/groups/{groupId}/members`

Manual membership ekler.

Request:
```json
{
  "employeeId": "uuid",
  "validFrom": "2026-09-05T12:00:00Z"
}
```

Duplicate active membership → `DUPLICATE_ACTIVE_MEMBERSHIP`.

### POST `/groups/{groupId}/members:bulk-add`

Idempotency-Key required.

Request:
```json
{
  "employeeIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

Response her employee için status döndürür; default davranış transaction mode `ALL_OR_NOTHING` olarak tanımlanır. Gelecekte explicit partial mode eklenebilir.

### POST `/groups/{groupId}/members/{employeeId}/remove`

Hard delete yapmaz; active membership'in `validUntil` alanını kapatır.

Request:
```json
{
  "effectiveAt": "2026-09-05T12:00:00Z"
}
```

## 14. Dynamic Group Rule Endpoints

### GET `/groups/{groupId}/rules`
### PUT `/groups/{groupId}/rules`

Sadece `groupType=DYNAMIC` için geçerlidir.

Request:
```json
{
  "expectedRuleVersion": 2,
  "rules": [
    {
      "field": "position.isManagerial",
      "operator": "EQ",
      "value": true,
      "logicalOperator": "AND",
      "sortOrder": 10
    }
  ]
}
```

Rule set tek versiyon olarak atomik değiştirilir; yarım rule update yapılmaz.

### POST `/groups/{groupId}/evaluate`

Privileged preview endpoint. Üyeliği değiştirmez; eşleşecek employee projection'ını önizler.

### POST `/groups/{groupId}/reconcile`

Rule evaluation sonucu üyelikleri RULE source olarak ekler/kapatır. Idempotency-Key required.

## 15. Organization Tree Read Model

### GET `/organizations/{organizationId}/tree`

UI için optimized read projection.

Response örneği:
```json
{
  "data": {
    "organization": {"id":"...","name":"ABC Holding"},
    "companies": [
      {
        "id":"...",
        "name":"Kent Konut A.Ş.",
        "departments": []
      }
    ]
  },
  "meta": {
    "generatedAt":"2026-09-05T12:00:00Z",
    "correlationId":"uuid"
  }
}
```

Bu projection command aggregate değildir; write işlemleri ilgili resource endpoint'lerinden yapılır.

## 16. Scoped Role Assignment Endpoints

Identity/Access bounded context ile integration boundary'dir.

### GET `/users/{userId}/organization-role-assignments`
### POST `/users/{userId}/organization-role-assignments`
### DELETE `/users/{userId}/organization-role-assignments/{assignmentId}`

Create request:
```json
{
  "roleId": "uuid",
  "scopeType": "COMPANY",
  "companyId": "uuid",
  "organizationId": null,
  "departmentId": null
}
```

Exactly one scope target business rule'a uygun olmalıdır.

## 17. External Identity / Import Endpoints

### GET `/employees/{employeeId}/external-identities`
### POST `/employees/{employeeId}/external-identities`
### DELETE `/employees/{employeeId}/external-identities/{identityId}`

### POST `/organization-imports`

CSV/HR/LDAP import job başlatır; büyük veri işlemleri synchronous CRUD request içinde çalıştırılmaz.

Request örneği:
```json
{
  "organizationId":"uuid",
  "sourceType":"CSV",
  "mode":"UPSERT",
  "dryRun":true
}
```

### GET `/organization-imports/{jobId}`
### POST `/organization-imports/{jobId}/commit`

Dry-run diff görülmeden destructive/large import commit edilmemesi önerilen V1 davranışıdır.

## 18. Training Audience Resolution Contract

Assignment bounded context bu API üzerinden typed target doğrulaması yapabilir.

### POST `/organization-audiences/resolve`

Request:
```json
{
  "targets": [
    {"type":"COMPANY","companyId":"uuid"},
    {"type":"GROUP","groupId":"uuid"},
    {"type":"EMPLOYEE","employeeId":"uuid"}
  ],
  "asOf":"2026-09-05T12:00:00Z"
}
```

Response:
```json
{
  "data": {
    "employeeIds":["uuid-1","uuid-2"],
    "resolvedCount":2,
    "deduplicated":true,
    "resolutionFingerprint":"sha256:..."
  }
}
```

Rules:
- target'lar same tenant/authorized organization scope içinde olmalıdır.
- duplicate employee tek kez sonuçlanır.
- `asOf` temporal membership/employment resolution için kullanılır.
- assignment sistemi historical snapshot/fingerprint saklar; sonraki org değişiklikleri eski assignment evidence'ını yeniden yazmaz.

## 19. Audit Query Contract

### GET `/audit/events`

Organization Management için filtreler:
- `organizationId`
- `companyId`
- `entityType`
- `entityId`
- `actorUserId`
- `action`
- `from`
- `to`
- `cursor`

Audit event immutable read model'dir.

## 20. Resource Schema Baseline

Tüm mutable resources minimum şu ortak alanları taşır:

```json
{
  "id":"uuid",
  "status":"ACTIVE",
  "version":1,
  "createdAt":"2026-09-05T12:00:00Z",
  "updatedAt":"2026-09-05T12:00:00Z"
}
```

Nested resource representation client'ın başka aggregate'i inline mutate etmesine izin vermez.

## 21. HTTP Status Baseline

- `200` successful read/update/command
- `201` resource created
- `202` async import/reconciliation job accepted
- `204` successful no-content operation
- `400` malformed/validation
- `401` authentication missing/invalid
- `403` permission/scope denied
- `404` resource not found in visible scope
- `409` duplicate/version/idempotency conflict
- `422` valid JSON but domain invariant violation
- `429` rate limit
- `500` unexpected internal failure with safe envelope

Cross-tenant resource existence leak edilmemesi için bazı forbidden object lookups `404` olarak maskelenebilir.

## 22. Idempotency Rules

Idempotency required for:
- employee transfer
- bulk group membership add
- dynamic group reconcile
- import commit
- future bulk assignment target expansion commands

Same `Idempotency-Key` + same normalized request → same semantic result.
Same key + different payload → `IDEMPOTENCY_CONFLICT`.

## 23. Concurrency Rules

Optimistic concurrency required for:
- organization/company/department updates
- department move
- employee mutable profile update
- employment end/transfer
- group update
- dynamic rule replacement
- position/location update

Stale version silently overwrite edilmez.

## 24. Authorization Matrix Baseline

API implementation permissions role isimlerine hard-code edilmemelidir; capability/permission mapping kullanılmalıdır.

Minimum capabilities:
- `organization.read`
- `organization.manage`
- `company.read`
- `company.manage`
- `department.read`
- `department.manage`
- `employee.read`
- `employee.manage`
- `employment.manage`
- `group.read`
- `group.manage`
- `group.membership.manage`
- `position.manage`
- `location.manage`
- `organization.import.manage`
- `organization.audit.read`

Scope her capability değerlendirmesinin ikinci boyutudur.

## 25. Contract Test Requirements

Minimum contract tests:
- tenant id spoof payload ignored/rejected
- cross-tenant identifiers inaccessible
- cross-company department relation rejected
- department cycle rejected
- duplicate company/department/position code rejected
- stale version returns 409
- duplicate idempotency payload behaves deterministically
- overlapping primary employment rejected
- employee transfer atomicity
- duplicate active group membership rejected
- membership removal preserves historical row semantics
- dynamic rule replacement version conflict
- audience resolution deduplicates employee ids
- audience resolution respects historical `asOf`
- passivation does not rewrite historical training/completion evidence
- permission + scope matrix negative cases
- audit event emitted for successful mutation

## 26. Machine-readable OpenAPI Follow-up

`docs/09-api/openapi.yaml` mevcut platform baseline'ıdır. Organization Management endpoint'leri implementation başlamadan önce bu kanonik sözleşmeden machine-readable OpenAPI 3.1 şemalarına aktarılmalıdır.

Bu belge ile machine-readable OpenAPI çelişirse Organization Management için bu canonical V1 contract düzeltilmeden implementation merge edilmemelidir.

## 27. Non-negotiable Contract Decisions

1. Client `tenant_id` seçemez.
2. Hard-delete Organization Management normal API yüzeyinde yoktur.
3. Transfer history overwrite ile yapılmaz.
4. Department move cycle yaratamaz.
5. Generic unenforced `targetType + targetId` persistence davranışı API'de kanonik model değildir.
6. Group membership tarihçesi korunur.
7. Employee ve User aynı resource değildir.
8. Read projections write aggregate gibi mutate edilmez.
9. Stale writes fail closed.
10. Critical retryable commands idempotent olmalıdır.
