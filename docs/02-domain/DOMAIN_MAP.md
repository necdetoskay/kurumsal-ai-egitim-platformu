# Domain Map — Kurumsal AI Eğitim Platformu

Status: Canonical for Sprint 00

## Purpose

Bu belge V1 bounded context sınırlarını, veri sahipliğini ve context'ler arası sözleşmeleri tanımlar. Amaç, modüler monolith içinde bağımsız iş alanları oluşturmak ve ileride gerekirse servis ayrıştırmasına uygun sınırlar bırakmaktır.

## Contexts

1. Identity & Access
2. Organization
3. Training
4. Content
5. Learning
6. Question Bank
7. Assessment
8. Certification
9. AI Runtime
10. Analytics & Learning Insight
11. Notification
12. Audit & Operations

## 1. Identity & Access

Sahip olduğu kavramlar:
- User
- Authentication identity
- Role
- Permission
- UserRole
- Session/security state

Sorumluluklar:
- Kimlik doğrulama
- Yetkilendirme
- Permission checks
- MFA/SSO entegrasyon sınırı
- Kullanıcının aktif/pasif/locked durumu

Sahip OLMADIĞI veriler:
- Eğitim ilerlemesi
- Assessment sonucu
- Organizasyon hiyerarşisi

## 2. Organization

Sahip olduğu kavramlar:
- Tenant
- Organization Unit
- Department
- Group
- Membership
- Tenant settings

Sorumluluklar:
- Tenant isolation bağlamı
- Kullanıcının kurumsal üyeliği
- Grup/departman üyelikleri
- Tenant seviyesinde politika ve ayarlar

Identity ile ilişki:
- User kimliği Identity'ye aittir.
- Tenant membership Organization'a aittir.

## 3. Training

Sahip olduğu kavramlar:
- Training
- Training lifecycle
- Training version metadata
- Learning Objective
- Training publication state

Sorumluluklar:
- Eğitim taslağı ve yaşam döngüsü
- Learning Objective tanımı
- Review/publish/archive kararları
- Hangi Content parçalarının eğitime bağlandığı

Training içerik gövdesinin kendisine sahip değildir; bu Content context'ine aittir.

## 4. Content

Sahip olduğu kavramlar:
- Module
- ContentItem
- ContentVersion
- Source Material
- Video metadata
- Transcript
- Document-derived text
- Content review state

Sorumluluklar:
- Eğitim materyali oluşturma ve versiyonlama
- İçerik kaynaklarını yönetme
- AI Content Intelligence için güvenli kaynak sağlama
- Published training tarafından kullanılan immutable/reference edilebilir content version'ları sağlama

## 5. Learning

Sahip olduğu kavramlar:
- Enrollment / Training Assignment
- Learner progress
- Module progress
- Video progress
- Completion state
- Resume position

Sorumluluklar:
- Eğitimin kullanıcıya atanması
- Kullanıcının kaldığı yerden devam etmesi
- Tamamlama kurallarının değerlendirilmesi
- Zorunlu/opsiyonel eğitim durumu

Learning, Assessment attempt'ını yönetmez.

## 6. Question Bank

Sahip olduğu kavramlar:
- Question
- QuestionVersion
- QuestionOption
- Difficulty
- Tags
- LearningObjective link
- Source/Evidence reference
- Review/approval state

Sorumluluklar:
- Manuel soru oluşturma
- AI soru üretiminin sonuçlarını taslak soru olarak alma
- Soru kalite/review yaşam döngüsü
- Assessment'a kullanılabilir soru sürümü sağlama

Published assessment historical doğruluğu için Question Bank'teki son değişiklikleri doğrudan okumamalıdır; snapshot/version referansı kullanılmalıdır.

## 7. Assessment

Sahip olduğu kavramlar:
- Assessment
- AssessmentQuestionSnapshot
- Assignment
- Attempt
- Answer
- Scoring policy
- Result
- Retake policy/request

Sorumluluklar:
- Assessment yapılandırması
- Güvenli attempt başlatma
- Immutable question snapshot
- Autosave/resume
- Deterministic scoring
- Submit/expire davranışı
- Attempt geçmişi ve retake kuralları

Assessment, sertifika yaşam döngüsüne sahip değildir; sonucu Certification'a sağlar.

## 8. Certification

Sahip olduğu kavramlar:
- CertificateTemplate
- Certificate
- VerificationCode
- Issue/revoke state

Sorumluluklar:
- Uygun completion/result koşulları sağlandığında sertifika üretme
- Sertifika doğrulama
- Kullanıcı sertifika görünümü için veri sağlama

Advanced credentials V1 dışında kalır.

## 9. AI Runtime

Sahip olduğu kavramlar:
- AI Request
- AI Job
- PromptVersion
- Model Registry entry
- Model Tier
- Generation Result
- Automated Evaluation
- Human Review linkage
- Usage/Cost telemetry

Logical agents:
1. Orchestrator
2. Content Intelligence
3. Question Generation
4. Quality Evaluator
5. Learning Insight

Sorumluluklar:
- Provider bağımsız AI execution
- Model routing
- Prompt versioning
- Structured output validation
- Retry/timeout/fallback
- Cost/usage metering
- AI observability
- ULTEF evaluation adapter

AI Runtime iş domainlerinin source of truth'u değildir. Örneğin generated question doğrudan Question Bank kaydı değildir; açık bir kabul/commit adımı gerekir.

## 10. Analytics & Learning Insight

Sahip olduğu kavramlar:
- Read models
- Aggregated learning metrics
- Weak-area analysis
- Learning insight result

Sorumluluklar:
- Completion analytics
- Assessment analytics
- Question performance
- Training performance
- Learning Objective bazında weak-area tespiti
- İlgili eğitim içeriğine yönlendirme

V1'de source transactional data bu context'e taşınmaz; event/read-model yaklaşımı kullanılır.

## 11. Notification

Sahip olduğu kavramlar:
- Notification
- Notification preference
- Delivery attempt
- Template reference

Sorumluluklar:
- In-app/email gibi kanallara bildirim oluşturmak
- Retry/delivery status
- Kullanıcı notification center

Notification, diğer context'lerin iş kararlarını vermez; onların event/command çıktısını iletir.

## 12. Audit & Operations

Sahip olduğu kavramlar:
- AuditEvent
- Security-relevant event record
- BackgroundJobRun operational view
- Correlation metadata

Sorumluluklar:
- Kritik işlemlerin değişmez audit kaydı
- Operasyonel izlenebilirlik
- Correlation/trace bağlantısı

Audit kayıtları business aggregate yerine geçmez.

# Key Ownership Rules

- User identity -> Identity & Access
- Tenant/group membership -> Organization
- Learning Objective -> Training
- Content body/version -> Content
- Learner progress -> Learning
- Question source of truth -> Question Bank
- Attempt/result source of truth -> Assessment
- Certificate -> Certification
- Prompt/model/generation -> AI Runtime
- Aggregated insight -> Analytics & Learning Insight
- Delivery state -> Notification
- Audit record -> Audit & Operations

# Primary Context Relationships

```text
Identity & Access -----> all protected contexts
Organization ----------> tenant scope for all tenant-owned contexts

Training -------------> Content
Training -------------> Learning Objective
Training -------------> Learning

Question Bank --------> Assessment
Learning -------------> Assessment eligibility/context where required
Assessment -----------> Certification
Assessment -----------> Analytics
Training/Learning ----> Analytics

Content -------------> AI Runtime (source context)
Question Bank <------- AI Runtime (approved generated questions)
Analytics <-----------> AI Runtime (bounded Learning Insight)

All key contexts -----> Notification (events)
All key contexts -----> Audit & Operations (audit/telemetry)
```

# Communication Rules

## Same request / strong consistency

Sadece aynı business invariant içinde gerekiyorsa synchronous application contract kullanılabilir.

Örnekler:
- Attempt başlatırken Assignment uygunluk kontrolü
- Publish sırasında Training completeness validation

## Eventual consistency

Analytics, notifications, audit projections ve ağır AI işleri event-driven/asynchronous olabilir.

Örnek:
- `assessment.result.calculated` -> Certification / Analytics / Notification
- `learning.training.published` -> Notification / Analytics
- `ai.generation.completed` -> Review Queue

# Cross-Context Data Rule

Bir context başka context'in tablosuna doğrudan yazmaz.

Tercih sırası:
1. Application contract
2. Versioned domain/integration event
3. Read-only projection

Foreign table mutation yasaktır.

# Tenant Rule

Tenant-owned bütün context'lerde tenant scope explicit'tir. Cross-context çağrıda tenant context kaybedilemez veya client input'a körü körüne güvenilemez.

# Historical Snapshot Rule

Geçmiş sonuçların sonradan değişmemesi gereken noktalarda snapshot/version kullanılır:

- Published content
- Assessment question set
- Attempt question/options
- Scoring-relevant question data
- Prompt version used for AI generation
- Model/provider metadata used for AI generation

# Contexts Deliberately Not Created in V1

Şimdilik ayrı bounded context yapılmayacak:
- Competency Management
- Career Management
- Gamification
- Social Learning
- AI Tutor
- HRIS

Bu alanlar backlog'tadır ve mevcut domainlere erken taşınmayacaktır.

# Design Freeze Rule

Yeni bir entity mevcut context sınırlarına doğal olarak oturmuyorsa önce domain decision yapılır; kolay olduğu için `shared` veya rastgele bir modüle eklenmez.
