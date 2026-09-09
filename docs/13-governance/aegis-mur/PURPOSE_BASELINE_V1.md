# AEGIS MUR — Purpose Baseline V1

**Status:** Canonical review baseline  
**Derived from:** `VISION.md`, `SCOPE.md`, primary flows, current implementation and product-owner direction

## 1. Fundamental purpose

Kurumsal AI Eğitim Platformu'nun amacı yalnız eğitim atamak, tamamlanma yüzdesi göstermek veya sınav puanı üretmek değildir.

Temel amaç:

> Kurumsal bilgiyi güvenilir eğitim deneyimine dönüştürmek; çalışanın gerçekten öğrenip öğrenmediğini kanıtlarla ölçmek; öğrenme boşluklarını Learning Objective seviyesinde belirlemek ve bunları kullanıcıya ve kuruma eyleme dönüşebilir biçimde geri beslemek.

## 2. Core problem

Klasik LMS yaklaşımı çoğunlukla operasyonel kayıt üretir:

- eğitim atandı mı,
- eğitim tamamlandı mı,
- sınav puanı nedir,
- sertifika üretildi mi.

Bu ürünün çözmek istediği daha önemli problem:

- çalışan hangi kavramı gerçekten öğrendi,
- nerede zorlandı,
- hangi eğitim içeriği yetersiz,
- hangi sorular kalitesiz veya yanlış hizalanmış,
- hangi öğrenme hedefi yeniden çalışılmalı,
- ekip/departman/kurum düzeyinde hangi ortak öğrenme boşlukları oluşuyor,
- hangi aksiyonun alınması gerektiği güvenilir evidence ile açıklanabiliyor mu.

## 3. Primary users

### Learner

İhtiyaç:
- atanmış eğitimi kolayca tüketmek,
- kaldığı yerden devam etmek,
- değerlendirilmek,
- yalnız puan değil anlaşılır weak-area ve tekrar önerisi görmek,
- geçmiş ve sertifika durumunu güvenli biçimde görmek.

### Instructor / Training Manager

İhtiyaç:
- kaynaklardan hızlı ama kontrollü eğitim oluşturmak,
- Learning Objective tanımlamak,
- AI ile içerik/soru üretimini evidence ve human-review altında kullanmak,
- yayın öncesi kaliteyi görmek,
- sonuçlardan eğitimi iyileştirmek.

### Reviewer

İhtiyaç:
- AI/human-generated kritik eğitim ve assessment içeriğini evidence, kalite sinyali ve değişiklik geçmişiyle incelemek,
- approve/reject/changes-requested kararını auditable biçimde vermek.

### Tenant Admin / Organization Training Owner

İhtiyaç:
- kullanıcı ve öğrenme hedef kitlesini yönetmek,
- doğru gruba doğru eğitimi atamak,
- zorunlu eğitim durumunu izlemek,
- bireysel gizliliği ve tenant boundary'yi koruyarak organizasyon öğrenme durumunu görmek.

## 4. Mission loop

`Source / Corporate Knowledge`
→ `Training Authoring`
→ `AI Assistance + Validation`
→ `Human Review`
→ `Publish`
→ `Audience Resolution / Assignment`
→ `Learning + Resume`
→ `Assessment`
→ `Deterministic Result`
→ `Learning Objective Evidence`
→ `Weak Area / Insight`
→ `Recommendation / Repeat`
→ `Organization Learning Insight`
→ `Training Improvement`

Bu döngü ürünün ana omurgasıdır.

## 5. Expected business outcomes

V1'in iş sonucuna dönüşen hedefleri:

1. Eğitim hazırlama süresini AI ile azaltırken doğruluk/evidence/human-control çizgisini korumak.
2. Eğitimi doğru organizasyon hedef kitlesine deterministik ve audit edilebilir şekilde atamak.
3. Çalışanın eğitim tüketim ve assessment yolculuğunu kesintisiz tamamlayabilmesini sağlamak.
4. Tamamlama ve puanın ötesinde Learning Objective bazlı öğrenme evidence üretmek.
5. Yeterli kanıt olduğunda weak-area ve ilgili içerik önerisi sunmak; yetersiz kanıtta iddia üretmemek.
6. Eğitim yöneticisinin hangi eğitim/hedef/sorunun iyileştirilmesi gerektiğini görebilmesini sağlamak.

## 6. V1 product success measures

Teknik test gate'leri ürün başarısının yerine geçmez. V1 release gate en az aşağıdaki mission KPI'larıyla desteklenmelidir:

### Flow completion
- `authoring_to_publish_success_rate`
- `assignment_to_training_start_rate`
- `training_resume_success_rate`
- `assessment_completion_success_rate`
- `mission_e2e_success_rate`

### Learning evidence
- `objective_evidence_coverage_rate`
- `assessment_items_with_objective_mapping_rate`
- `insight_eligible_learners_rate`
- `insufficient_evidence_correct_abstention_rate`

### AI quality
- `grounded_authoring_acceptance_rate`
- `question_hard_gate_pass_rate`
- `human_review_rejection_rate`
- model/prompt cost, latency and regression metrics

### Operational integrity
- cross-tenant leakage: **0 tolerated**
- learner answer-key exposure: **0 tolerated**
- duplicate critical side effects: **0 tolerated**
- published-version mutation: **0 tolerated**

Numeric promotion thresholds should be derived from qualification data rather than invented before representative V1 runs.

## 7. Hard constraints

- Multi-tenancy and tenant isolation are foundational.
- Server is authoritative for permissions, assessment state, scoring and completion.
- Learning Objective remains first-class and traceable.
- Critical AI output cannot self-publish.
- Source/evidence provenance must be preserved.
- Insufficient evidence must fail safely rather than create broad learning/HR claims.
- AI provider/model choice must remain replaceable and qualified.
- V1 is responsive web-first.
- Existing historical/published learning evidence must not be destructively rewritten.

## 8. Explicit non-goals for V1

- full HRIS,
- payroll,
- recruitment,
- performance/career management,
- full competency platform,
- HR/ERP system-of-record replacement,
- general-purpose AI Tutor,
- autonomous curriculum/publishing,
- native mobile,
- gamification/social/community engine,
- AI avatar/video/voice ecosystem,
- broad enterprise integration ecosystem unless required to close the mission loop.

## 9. Organization Management boundary

Organization Management V1 exists to answer:

> “Eğitimi kime atıyoruz ve öğrenme sonuçlarını hangi güvenli organizasyon bağlamında yorumluyoruz?”

Therefore V1 needs enough organization data to support:

- Organization / Company / Department,
- Employee identity distinct from login User,
- Groups,
- learning target resolution,
- minimal position/location/context only where needed for targeting, authorization or reporting,
- safe lifecycle/history where assignment/audit correctness requires it.

It does **not** automatically justify becoming the organization's HR master system.

## 10. Purpose gate

Every new epic or major capability must include:

- purpose served,
- target user/problem,
- expected business/learning outcome,
- criticality (`CORE | DIFFERENTIATOR | ENABLER | ADJACENT`),
- why it belongs in V1 rather than Later,
- mission KPI or acceptance scenario impacted,
- explicit non-goal boundary.

Without this evidence the default decision is **DEFER**.
