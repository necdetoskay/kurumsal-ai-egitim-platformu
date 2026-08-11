# Primary User Flows — V1

Status: Canonical for Sprint 00
Related issue: #2

Bu belge V1'in kritik uçtan uca kullanıcı ve domain akışlarını tanımlar. Amaç UI, API, event, persistence, UML sequence ve ULTEF E2E senaryoları için ortak bir kaynak oluşturmaktır.

## Global Flow Rules

- Her akış trusted tenant context içinde çalışır.
- Permission check UI katmanına bırakılmaz; server-side enforce edilir.
- Cross-context mutation doğrudan foreign table write ile yapılmaz.
- Critical side effect'ler idempotent ve auditable olmalıdır.
- AI output domain source-of-truth değildir; explicit commit/approval adımı gerekir.
- Published/versioned historical state sessizce değiştirilmez.
- Retry, timeout ve partial-failure davranışı açıkça ele alınır.

---

## Flow 1 — Training Create -> Review -> Publish

### Actors
- Tenant Admin veya Instructor
- Reviewer
- Publisher permission sahibi actor

### Contexts
- Identity & Access
- Organization
- Training
- Content
- Audit & Operations
- Notification

### Happy Path
1. Author yeni Training oluşturur; state `DRAFT` olur.
2. Training metadata ve Learning Objective'ler tanımlanır.
3. Content context içinde module/content version'ları oluşturulur.
4. Training, ilgili content version referanslarını bağlar.
5. Server-side completeness validation çalışır.
6. Author `IN_REVIEW` transition ister.
7. Reviewer training/content paketini inceler.
8. Reviewer approve eder.
9. Publish permission sahibi actor publish action'ı verir.
10. Training `PUBLISHED` olur ve immutable/reference edilebilir published version oluşur.
11. Audit kaydı yazılır.
12. Notification/Analytics eventual event'leri yayınlanabilir.

### Failure / Retry
- Eksik Learning Objective veya required content -> review/publish reddedilir.
- Reviewer reject -> Training tekrar editable review state/draft akışına döner.
- Concurrent edit -> optimistic concurrency/version conflict.
- Publish retry -> duplicate published version yaratmamalı.

### Key Invariants
- Reviewer permission publish permission değildir.
- Published content material değişirse versioning gerekir.
- Historical assignment/progress eski version referansını korur.

---

## Flow 2 — AI Content Generation -> Validation -> Human Review -> Draft Commit

### Actors
- Tenant Admin / Instructor
- Reviewer

### Contexts
- Content
- Training
- AI Runtime
- Audit & Operations

### Happy Path
1. Authorized actor source content/context seçer.
2. AI Runtime Orchestrator capability ve model tier belirler.
3. PromptVersion + model identity + tenant + request metadata trace edilir.
4. Content Intelligence Agent generation çalıştırır.
5. Structured output/schema validation yapılır.
6. Quality evaluation uygulanır.
7. Çıktı review-required state'e alınır.
8. Reviewer raw output ve source evidence'ı inceler.
9. Reviewer edit/approve eder.
10. Approved final içerik Content context'e yeni draft ContentVersion olarak commit edilir.
11. Raw AI output ve final approved içerik ayrı lineage ile tutulur.

### Failure / Retry
- Provider timeout -> retry/fallback policy.
- Schema invalid -> repair/escalation; domain'e commit yok.
- Safety/quality hard gate fail -> human review öncesi block veya explicit flagged review.
- Duplicate request -> idempotency/correlation ile duplicate domain draft yaratmamalı.

### Key Invariants
- AI result doğrudan published content değildir.
- Model fallback safety gate bypass edemez.
- Reviewer final otoritedir; evaluator değildir.

---

## Flow 3 — Source -> AI Questions -> Quality Evaluation -> Human Review -> Question Bank

### Actors
- Instructor / Tenant Admin
- Reviewer

### Contexts
- Content
- Training
- AI Runtime
- Question Bank
- Audit & Operations

### Happy Path
1. Actor source seçer: training content, text, transcript, document-derived text veya Learning Objective.
2. Question generation parameters verilir: count, difficulty, type, target objective vb.
3. Orchestrator Question Generation capability'yi başlatır.
4. Question Generation Agent structured question set üretir.
5. Schema validation yapılır.
6. Quality Evaluator correctness, ambiguity, grounding, option quality, difficulty, duplicate ve objective alignment kontrolü yapar.
7. Uygun sonuçlar human review queue'ya alınır.
8. Reviewer soru bazında edit/approve/reject eder.
9. Approved final soru Question Bank'te `DRAFT` veya policy'ye göre `APPROVED` lifecycle'a alınır.
10. Source/evidence, prompt/model lineage ve reviewer kararı korunur.

### Failure / Retry
- Grounding yok -> question rejected/flagged.
- Near duplicate -> merge/reject/human decision.
- Invalid structured output -> repair/escalation.
- Reviewer stale generation açarsa superseded warning ve decision block.

### Key Invariants
- AI generated = approved değildir.
- Correct answer learner context'e sızdırılmaz.
- Assessment historical integrity için version/snapshot kullanılır.

---

## Flow 4 — Training Assignment -> Learner Progress -> Completion

### Actors
- Tenant Admin / Instructor
- Learner

### Contexts
- Organization
- Training
- Content
- Learning
- Assessment (gerekirse eligibility/completion dependency)
- Notification
- Audit & Operations

### Happy Path
1. Authorized actor published TrainingVersion için assignment oluşturur.
2. Target learner/group tenant scope içinde doğrulanır.
3. Duplicate aktif assignment policy/idempotency uygulanır.
4. Learner dashboard'da assignment görünür.
5. Learner training player'ı açar.
6. Module/video/content progress server-side kaydedilir.
7. Learner session'dan çıkarsa resume position korunur.
8. Required modules tamamlanır.
9. Training policy assessment pass gerektirmiyorsa completion hesaplanır.
10. Assessment gerekliyse final completion assessment result gelene kadar pending kalır.
11. Completion event idempotent olarak yayınlanır.

### Failure / Retry
- Archived/non-published training version için yeni assignment reddedilir.
- Progress update retry -> geriye gitmeyen monotonik progress.
- Client sahte yüzde gönderirse server-side completion rule bunu tek başına kabul etmez.
- Assignment silinse bile historical progress/result korunur.

### Key Invariants
- Assignment belirli TrainingVersion'a bağlıdır.
- Completion server-side business rule ile belirlenir.

---

## Flow 5 — Assessment Start -> Resume -> Submit -> Score -> Result

### Actors
- Learner

### Contexts
- Identity & Access
- Organization
- Learning
- Assessment
- Question Bank (snapshot kaynağı)
- Audit & Operations
- Notification

### Happy Path
1. Learner assessment'a erişim ister.
2. Server tenant, permission, assignment/eligibility ve availability window kontrolü yapar.
3. Idempotent attempt creation ile yeni Attempt oluşturulur veya mevcut uygun attempt döner.
4. AssessmentVersion ve QuestionVersion'lardan immutable snapshot oluşturulur.
5. Attempt `IN_PROGRESS` olur; server authoritative timer başlatır.
6. Learner answers autosave eder.
7. Session kapanırsa attempt resume edilebilir.
8. Learner submit eder veya policy gereği süre dolunca submit/expire olur.
9. Submit sonrası answers immutable hale gelir.
10. Deterministic scoring çalışır.
11. Result ve pass/fail oluşturulur.
12. Assessment result event'i Certification, Analytics ve Notification tüketicilerine iletilebilir.

### Failure / Retry
- Attempt create request retry -> duplicate attempt yok.
- Autosave transient failure -> visible retry state; local UI state kaybolmamalı.
- Submit retry -> duplicate result/scoring yok.
- Timer client clock değişiminden etkilenmez.
- Assessment closed/eligibility lost -> policy'ye göre start reddedilir; in-progress attempt için explicit rule uygulanır.

### Key Invariants
- Deterministic scoring LLM kullanmaz.
- Submit edilmiş attempt learner tarafından edit edilemez.
- Historical result reproducible/auditable olmalıdır.

---

## Flow 6 — Retake Request -> Decision -> New Attempt

### Actors
- Learner
- Tenant Admin / authorized Instructor

### Contexts
- Assessment
- Notification
- Audit & Operations

### Happy Path
1. Learner result ekranından retake eligibility görür.
2. Policy `automatic` ise yeni attempt hakkı server-side verilir.
3. Policy `approval-required` ise RetakeRequest oluşturulur.
4. Authorized reviewer/admin request'i approve/reject eder.
5. Approve halinde attempt entitlement oluşur.
6. Learner yeni Attempt başlatır.
7. Eski attempts ve results değişmeden korunur.

### Failure / Retry
- Maximum attempt limiti aşıldı -> block.
- Duplicate retake request -> idempotent/active request reuse.
- Approval sonrası duplicate attempt create -> idempotent attempt semantics.

### Key Invariants
- Retake eski attempt'ı mutate etmez.
- Certificate eligibility hangi attempt/result'ın authoritative olduğunu policy ile hesaplar.

---

## Flow 7 — Completion + Assessment Pass -> Certificate

### Actors
- System workflow
- Learner
- Authorized certificate manager (revoke gibi privileged durumlar)

### Contexts
- Learning
- Assessment
- Certification
- Notification
- Audit & Operations

### Happy Path
1. Learning completion evidence available olur.
2. Required Assessment pass evidence available olur.
3. Certification eligibility policy evaluate edilir.
4. Eligible ise Certificate idempotent olarak issue edilir.
5. Certificate training/version/result evidence ile bağlanır.
6. Verification identifier oluşturulur.
7. Learner notification alır ve kendi certificate'ını görüntüler.

### Failure / Retry
- Aynı event birden fazla gelirse duplicate certificate yok.
- Eligibility henüz complete değilse pending/no-op.
- Certificate revoke gerekiyorsa state transition + audit; hard-delete yok.

### Key Invariants
- Learner kendine manuel certificate veremez.
- Archived training geçmiş certificate'ı geçersiz kılmaz.

---

## Flow 8 — Assessment Result -> Learning Objective -> Weak Area -> Relevant Content

### Actors
- Learner
- Tenant Admin / Instructor / Reviewer (organization analytics scope ile)

### Contexts
- Assessment
- Training
- Content
- Analytics & Learning Insight
- AI Runtime (bounded capability gerektiğinde)

### Happy Path
1. Assessment result + question/objective mappings analytics pipeline'a gelir.
2. Objective bazlı evidence aggregate edilir.
3. Minimum evidence/threshold kuralları uygulanır.
4. Weak-area score/confidence hesaplanır.
5. İlgili Learning Objective'e bağlı training/content parçaları bulunur.
6. Learner'a zayıf alan ve ilgili içerik yönlendirmesi gösterilir.
7. Organization-level analytics permission sahibi actor aggregate görünüm görebilir.

### Failure / Retry
- Yetersiz evidence -> insight üretilmez veya low-confidence olarak gösterilir.
- Tek sorudan geniş competency sonucu çıkarılmaz.
- Event replay -> duplicate aggregate side effect olmamalı.
- AI Runtime kullanılıyorsa model output deterministic evidence'ı override edemez.

### Key Invariants
- V1 Learning Insight HR performance/career/disiplin kararı üretmez.
- Insight confidence/evidence korunur.

---

# Cross-Flow Event Candidates

Aşağıdaki event adları illustrative'dir; Event Catalog validation sırasında kanonikleştirilecektir:

- `training.review.submitted`
- `training.published`
- `ai.generation.completed`
- `ai.review.completed`
- `question.approved`
- `learning.assignment.created`
- `learning.progress.updated`
- `learning.training.completed`
- `assessment.attempt.started`
- `assessment.attempt.submitted`
- `assessment.result.calculated`
- `assessment.retake.requested`
- `assessment.retake.approved`
- `certificate.issued`
- `certificate.revoked`
- `learning.insight.updated`

# E2E / ULTEF Flow Coverage Requirement

Implementation başladığında her kanonik flow için en az:

- 1 happy-path E2E
- 1 authorization/tenant-negative senaryo
- 1 retry/idempotency veya failure senaryosu
- historical version/snapshot integrity gereken flow'larda regression senaryosu

olmalıdır.

AI flow'larında ayrıca structured output, human-review gate ve lineage doğrulaması zorunludur.

# Definition of Done

Bu belge tamamlanmış sayılırsa:

- V1'in 8 kritik uçtan uca flow'u tanımlıdır.
- Actor, context, happy path, failure/retry ve invariant'lar açıktır.
- Domain ownership kurallarıyla çelişmez.
- Permission matrix ve tenant isolation kurallarını bypass etmez.
- AI human-review policy korunur.
- Version/snapshot ve idempotency gereksinimleri görünürdür.
- Gelecekteki OpenAPI, Event Catalog, UML sequence ve ULTEF E2E çalışmaları için izlenebilir temel sağlar.
