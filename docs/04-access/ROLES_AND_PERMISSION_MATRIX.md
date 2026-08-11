# Roles & Permission Matrix — V1

Status: Canonical for V1 design freeze
Related issue: #1

## 1. Authorization Principles

- Authorization server-side enforce edilir; UI gizleme güvenlik kontrolü değildir.
- Varsayılan politika `deny`'dır. Açıkça verilmemiş permission reddedilir.
- Her tenant-owned resource tenant boundary içinde değerlendirilir.
- Client tarafından gönderilen `tenant_id` authorization kaynağı değildir.
- Role yalnız kaba yetki grubudur; gerçek karar `actor + tenant + permission + resource state/ownership` üzerinden verilir.
- Kritik privileged işlemler audit edilir.
- Cross-tenant erişim yalnız açık platform-level permission ile mümkündür.
- AI agent/model hiçbir zaman kullanıcı authorization'ını genişletemez.

## 2. Canonical V1 Roles

### Platform Operator
Platform altyapısını ve gerektiğinde tenant operasyonlarını yöneten yüksek ayrıcalıklı sistem rolüdür. Normal kurum kullanıcısı değildir.

V1'de kullanım alanı minimum tutulur ve tüm cross-tenant işlemler audit edilir.

### Tenant Admin
Kendi kurumu içinde kullanıcı, organizasyon, roller, eğitim operasyonları ve raporlama üzerinde geniş yetkiye sahiptir.

### Training Manager / Instructor
Eğitim, içerik, Learning Objective, Question Bank ve Assessment hazırlama süreçlerini yürütür. Tenant-wide kullanıcı/role yönetimi yapamaz.

### Reviewer
Human-in-the-Loop kontrol rolüdür. AI-generated veya review-required eğitim/soru içeriğini approve/reject/edit edebilir. Yönetimsel kullanıcı yetkisi taşımaz.

### Learner
Kendisine atanmış eğitimleri tüketir, progress oluşturur, assessment attempt başlatır/devam eder, kendi sonuç ve sertifikalarını görür.

## 3. Permission Vocabulary

V1 permission'ları domain action olarak ifade edilir:

- `organization.read`
- `organization.manage`
- `user.read`
- `user.invite`
- `user.manage`
- `role.assign`
- `training.read`
- `training.create`
- `training.edit`
- `training.submit_review`
- `training.review`
- `training.publish`
- `training.archive`
- `assignment.create`
- `assignment.manage`
- `learning.consume`
- `learning.progress.self`
- `question.read`
- `question.create`
- `question.edit`
- `question.review`
- `assessment.read`
- `assessment.create`
- `assessment.edit`
- `assessment.publish`
- `assessment.attempt.self`
- `assessment.result.self`
- `assessment.result.read`
- `retake.request.self`
- `retake.review`
- `certificate.self`
- `certificate.read`
- `certificate.manage`
- `ai.generate`
- `ai.review`
- `ai.operations.read`
- `analytics.self`
- `analytics.organization`
- `audit.read`
- `platform.tenant_support`

Permission isimleri implementasyon sırasında API/policy constants ile version-controlled hale getirilecektir.

## 4. High-Level Matrix

Legend: `A` allowed, `C` conditional/resource-scoped, `-` denied by default.

| Capability | Platform Operator | Tenant Admin | Instructor | Reviewer | Learner |
|---|---:|---:|---:|---:|---:|
| Cross-tenant platform support | C | - | - | - | - |
| Organization read | C | A | C | C | C |
| Organization manage | - | A | - | - | - |
| User list/read | C | A | C | C | - |
| Invite/manage users | - | A | - | - | - |
| Assign tenant roles | - | A | - | - | - |
| Create/edit training | - | A | A | C | - |
| Submit training for review | - | A | A | - | - |
| Review training | - | C | - | A | - |
| Publish/archive training | - | A | C | - | - |
| Create/manage assignments | - | A | A | - | - |
| Consume assigned training | - | C | C | C | A |
| Write own learning progress | - | C | C | C | A |
| Create/edit Question Bank items | - | A | A | C | - |
| Review/approve questions | - | C | - | A | - |
| Create/edit assessment | - | A | A | C | - |
| Publish/close assessment | - | A | C | - | - |
| Start/resume own attempt | - | C | C | C | A |
| Read own results | - | C | C | C | A |
| Read organization results | - | A | C | C | - |
| Request own retake | - | C | C | C | A |
| Approve/reject retake | - | A | C | - | - |
| View own certificates | - | C | C | C | A |
| Manage/revoke certificate | - | A | C | - | - |
| Request AI generation | - | A | A | C | - |
| Human-review AI output | - | C | C | A | - |
| View AI operational metrics | C | A | C | - | - |
| View own learning analytics | - | C | C | C | A |
| View organization analytics | C | A | C | C | - |
| Read audit log | C | A | - | - | - |

`C` hiçbir zaman otomatik allow anlamına gelmez; tenant, resource, ownership ve state policy kontrolü gerekir.

## 5. Resource and State Constraints

### Training
- Instructor yalnız tenant scope içindeki eğitimleri yönetebilir.
- `PUBLISHED` içeriğin material edit'i versioning rule'a tabidir.
- Reviewer review yapabilir ancak publish yetkisi otomatik olarak kazanmaz.
- Publish ayrı permission'dır; create/edit yetkisi publish anlamına gelmez.

### Question Bank
- Question author kendi draft sorusunu düzenleyebilir.
- Approved/used question material değişiklikleri version/snapshot bütünlüğünü korumalıdır.
- Reviewer approval verir; doğru cevabı assessment sırasında learner'a açamaz.

### Assessment
- Learner yalnız kendisine yetkili/atanmış assessment için attempt başlatabilir.
- Instructor'ın authoring yetkisi learner attempt/result mutation yetkisi vermez.
- Submit edilmiş attempt learner tarafından değiştirilemez.
- Result override V1 normal rol matrisi dışında privileged/audited operasyon olarak ele alınır.

### Learning
- Learner yalnız kendi progress'ini yazabilir.
- Başka learner adına progress yazma normal UI/API rolü değildir.
- Completion server-side business rules ile hesaplanır; permission completion kuralını bypass edemez.

### Certification
- Learner yalnız kendi certificate'larını görüntüler.
- Certificate issue normalde eligibility workflow tarafından yapılır; kullanıcı manuel olarak kendine certificate veremez.
- Revoke privileged ve audited'dir.

### AI
- `ai.generate` yalnız capability çağrısını başlatma yetkisidir; domain publish yetkisi değildir.
- AI-generated critical content review gate'i atlayamaz.
- Model Router, provider veya agent actor'un resource permission'larını değiştiremez.
- AI trace içindeki hassas tenant verisine erişim ayrıca operational permission gerektirir.

## 6. Separation of Duties

V1'de mutlak four-eyes enforcement her resource için zorunlu değildir; ancak mimari bunu destekler.

Önerilen yüksek-risk akış:

`Author -> AI/Automated Validation -> Reviewer -> Publisher`

Aynı kullanıcının birden fazla rol taşıması mümkün olabilir; fakat audit trail gerçek actor ve action'ı kaydeder. Gelecekte kurum policy'si author ile reviewer'ın farklı kişiler olmasını zorunlu kılabilir.

## 7. Tenant Boundary

Authorization sırası konsept olarak:

1. Actor authentication
2. Trusted tenant context resolution
3. Platform-level exception check gerekiyorsa explicit policy
4. Permission check
5. Resource tenant ownership check
6. Resource ownership/state constraint
7. Business invariant check
8. Action + audit

Cross-tenant resource identifier bilinmesi erişim hakkı sağlamaz. `404` vs `403` bilgi sızıntısı davranışı API security policy ile standardize edilir.

## 8. Background Jobs and System Actors

Async worker/system actor işlemleri kullanıcı permission'ını taklit ederek kontrolsüz çalışmaz.

Her job:
- tenant context taşır,
- initiating actor/correlation bilgisi taşıyabilir,
- sadece tanımlı service capability ile çalışır,
- idempotent ve auditable kritik side effect üretir.

## 9. API and UI Rules

- UI permission-aware navigation sunabilir fakat tek güvenlik katmanı değildir.
- API endpoint'leri permission policy ile korunur.
- Object-level authorization her resource read/write işleminde uygulanır.
- Bulk operations her item/tenant boundary için güvenli semantics kullanır.
- Export/report endpoints data-scope policy uygular.

## 10. ULTEF Authorization Gates

En az aşağıdaki test sınıfları gereklidir:

### Positive
- Tenant Admin kendi tenant'ında kullanıcı yönetebilir.
- Instructor eğitim oluşturabilir.
- Reviewer review-required soruyu approve/reject edebilir.
- Learner kendi assignment/progress/attempt/result/certificate verisine erişebilir.

### Negative
- Learner başka learner sonucunu okuyamaz.
- Instructor role atayamaz.
- Reviewer kullanıcı yönetemez.
- Create/edit permission publish yetkisi sağlamaz.
- Learner assessment answer key'e submit öncesi erişemez.

### Tenant Isolation
- Tenant A actor Tenant B resource ID ile read yapamaz.
- Tenant A actor Tenant B resource ID ile mutation yapamaz.
- Search/list/export sonuçlarında cross-tenant leakage olmaz.
- Cache key collision cross-tenant veri döndürmez.
- Background job yanlış tenant context ile side effect üretemez.
- AI trace/context başka tenant verisi içermez.

### Privilege Escalation
- Client role/tenant claim manipulation başarısız olur.
- IDOR/BOLA senaryoları reddedilir.
- Hidden UI action doğrudan API çağrısı ile bypass edilemez.
- Stale/revoked permission session policy'sine uygun şekilde etkisiz hale gelir.

## 11. Open Questions Deferred to Implementation ADR

Aşağıdakiler rol modelini değiştirmeden implementation ADR ile kesinleştirilebilir:

- RBAC library/framework seçimi
- Permission storage biçimi
- Session/token claim cache stratejisi
- PostgreSQL RLS'nin defense-in-depth olarak kullanılıp kullanılmayacağı
- Platform Operator erişiminde break-glass workflow gereksinimi

Bu kararlar V1 authorization invariant'larını gevşetemez.

## 12. Definition of Done

Bu belge için tamamlanma kriterleri:

- V1 canonical roller tanımlı.
- Permission vocabulary tanımlı.
- High-level role matrix tanımlı.
- Resource/state constraint'leri tanımlı.
- Tenant boundary açık.
- AI authorization boundary açık.
- Background job/system actor kuralları açık.
- ULTEF positive/negative/isolation/escalation test sınıfları tanımlı.

Bu noktadan sonra daha ayrıntılı endpoint-level permission mapping OpenAPI validation sırasında bu belgeye göre üretilecektir.
