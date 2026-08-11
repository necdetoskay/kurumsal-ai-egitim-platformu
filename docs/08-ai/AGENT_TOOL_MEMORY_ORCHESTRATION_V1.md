# Agent, Tool, Memory & Orchestration Specification — V1

Status: Canonical for Sprint 00 backend-first design
Related issue: #14

## 1. Purpose

Bu belge V1 AI backend'inde logical agent'ların sorumluluklarını, erişebilecekleri tool'ları, memory/context türlerini ve aralarındaki orchestration/handoff kurallarını provider/model bağımsız biçimde tanımlar.

Ana ilke: **Agent bir model değildir; bir capability boundary'dir.**

## 2. Canonical Agent Set

### 2.1 AI Orchestrator
Sorumluluklar:
- capability resolution
- no-LLM / deterministic çözüm kontrolü
- sync vs async execution
- model tier selection policy invocation
- context assembly plan
- tool allowlist seçimi
- human-review requirement
- budget/latency policy
- retry/fallback/escalation
- correlation lineage

Yapmayacakları:
- domain entity'yi kendi başına mutate etmek
- authorization bypass etmek
- raw provider credential kullanmak
- başka agent'ın tool sınırlarını genişletmek

### 2.2 Content Intelligence Agent
Girdiler:
- normalize source sections
- transcript/document-derived text
- approved context metadata
- learning objective hints

Görevler:
- summarization
- topic/concept extraction
- learning objective candidate generation
- sectioning/chunk-level semantic structure
- outline/module candidate generation
- source quality warnings

### 2.3 Question Generation Agent
Görevler:
- source-grounded question generation
- learning objective alignment
- difficulty targeting
- distractor generation
- answer/explanation generation
- evidence anchors

Zorunlu çıktı: versioned structured schema.

### 2.4 Quality Evaluator Agent
Görevler:
- correctness
- grounding
- answerability
- ambiguity
- duplicate/near duplicate
- distractor quality
- difficulty suitability
- instructional alignment
- schema/policy quality signals

Evaluator nihai approver değildir.

### 2.5 Learning Insight Agent
Görevler:
- assessment evidence'i learning objective seviyesinde yorumlamak
- bounded weak-area analysis
- ilgili mevcut içeriği ilişkilendirmek
- explainable recommendation üretmek

V1 sınırı: learner'ın resmi sonucunu, assignment'ını veya curriculum'unu kendi başına değiştirmez.

## 3. Tool Taxonomy

Tool, agent'ın dış dünya/domain capability'sine kontrollü erişim sözleşmesidir. Tool çağrısı doğrudan DB tablo erişimi değildir.

### 3.1 Read Tools
- `source.read_normalized`
- `source.search_sections`
- `training.read_context`
- `learning_objective.read`
- `question.read_candidates`
- `assessment.read_result_evidence`
- `learner.read_allowed_progress_context`

### 3.2 Validation Tools
- `schema.validate`
- `grounding.validate_evidence_anchor`
- `question.check_duplicate`
- `question.check_answer_shape`
- `policy.check_ai_action`
- `content.check_quality_state`

### 3.3 Controlled Write/Handoff Tools
Agent'lar domain entity'ye serbest mutation yapmaz. Write tool'lar yalnız draft/proposal/handoff üretir:
- `ai_output.store_draft`
- `review_queue.enqueue`
- `insight.store_candidate`
- `generation_job.update_status`

Production publish/approve domain application service tarafından human/policy gate sonrasında yapılır.

### 3.4 Runtime Tools
- `model_router.select`
- `prompt_registry.resolve`
- `provider.invoke`
- `usage_meter.record`
- `trace.record`
- `retry_policy.evaluate`

Agent provider'a doğrudan bağlanmaz; AI Runtime Harness kullanır.

## 4. Tool Access Matrix

| Tool family | Orchestrator | Content Intelligence | Question Generation | Quality Evaluator | Learning Insight |
|---|---:|---:|---:|---:|---:|
| Runtime routing | A | - | - | - | - |
| Prompt/model invoke via harness | C | A | A | A | A |
| Source read/search | C | A | A | A | C |
| Training/objective read | C | A | A | A | A |
| Assessment evidence read | - | - | - | C | A |
| Validation tools | C | A | A | A | A |
| Draft output storage | C | A | A | A | A |
| Human review enqueue | A | C | C | C | C |
| Production domain mutation | - | - | - | - | - |

`C` = capability/policy dependent.

## 5. Memory Taxonomy

### M0 — Request Context
Tek request/run boyunca yaşayan transient context.
Örnek: actor, tenant, capability, correlation id, budget, locale.

### M1 — Execution Scratchpad
Bir generation job içindeki ara structured state. Persistent olabilir ama domain gerçeği değildir.
Örnek: candidate outline, partial evaluation scores, retry reason.

### M2 — Retrieval Context
Source-of-truth materyalden türetilmiş arama/index temsili.
Örnek: chunks, embeddings, lexical index, section metadata.

Kural: retrieval result = evidence candidate; source-of-truth değildir.

### M3 — Domain Memory
Gerçek persistent business fact'leri ilgili bounded context saklar.
Örnek: TrainingVersion, LearningObjective, AssessmentResult, Certificate.

Bu katman "AI memory" değildir; en yüksek doğruluk kaynağıdır.

### M4 — Derived AI Memory
Açıkça tanımlı, auditable, yeniden üretilebilir AI-derived persistent record.
Örnek: weak-area candidate, content quality annotation.

Kurallar:
- lineage içerir
- tenant-scoped'dur
- confidence/evidence içerir
- domain fact gibi kullanılmaz
- stale/recompute policy'si vardır

### M5 — Conversation/Interaction Memory
V1 backend core için varsayılan kapalıdır. Gelecekte AI Tutor gibi özelliklerde ayrı policy gerektirir.

## 6. Memory Read Priority

`Domain Source of Truth -> Approved Source Material -> Derived Index/Retrieval -> Derived AI Memory -> Execution Context`

Alt katman üst katmanla çelişirse üst katman kazanır.

Conversation memory hiçbir zaman domain truth'u override edemez.

## 7. Memory Write Policy

Her persistent AI-derived write için en az:
- tenant_id
- record type
- source/evidence ids
- source versions
- prompt version
- model/provider identity
- generation/evaluation run ids
- confidence/quality metadata
- created_at
- expiry/recompute policy varsa metadata

zorunlu olmalıdır.

PII veya hassas veri yalnız capability için gerekliyse context'e dahil edilir; minimum necessary principle uygulanır.

## 8. Context Builder

Context Builder agent değildir; deterministic application/runtime component'tir.

Görevleri:
1. trusted tenant/actor context çözmek
2. capability contract'ını okumak
3. allowed data sources belirlemek
4. token/context budget uygulamak
5. retrieval yapmak gerekiyorsa tenant-scoped query çalıştırmak
6. evidence anchors korumak
7. prompt input contract üretmek

Context Builder authorization yapmaz; mevcut authorization decision'ı uygular.

## 9. Handoff Contract

Agent-to-agent serbest doğal dil sohbeti yerine versioned handoff envelope kullanılır.

Minimum envelope:

```json
{
  "handoffVersion": "1.0",
  "tenantId": "...",
  "correlationId": "...",
  "parentRunId": "...",
  "fromCapability": "content-intelligence",
  "toCapability": "question-generation",
  "inputSchemaVersion": "...",
  "payloadRef": "...",
  "evidenceRefs": ["..."],
  "policyContextRef": "..."
}
```

Large payload mümkün olduğunda inline taşınmaz; immutable/versioned reference kullanılır.

## 10. Canonical Orchestration Patterns

### Pattern A — Single Capability
`Request -> Orchestrator -> Context Builder -> Agent -> Validators -> Draft Result`

### Pattern B — Generation + Evaluation
`Request -> Generator -> Deterministic Validation -> Quality Evaluator -> Human Review Queue`

### Pattern C — Content to Question
`Processed Source -> Content Intelligence -> approved/usable structure -> Question Generation -> validation -> evaluator -> human review`

### Pattern D — Learning Insight
`Assessment Result + Objective Evidence -> deterministic aggregation -> Learning Insight Agent -> confidence/evidence validation -> candidate insight`

## 11. Sync vs Async

Sync tercih edilir:
- kısa bounded read/analysis
- low latency ve low token work
- UI'nin immediate response beklediği küçük görevler

Async zorunlu/tercih edilir:
- large document processing
- batch generation
- multi-step evaluation
- expensive tier escalation
- retryable provider work
- long-running indexing

Async job state en az:
`QUEUED -> RUNNING -> VALIDATING -> EVALUATING -> REVIEW_REQUIRED/COMPLETED/FAILED`

## 12. Retry / Repair / Fallback

Sıra:
1. deterministic validation failure classification
2. safe schema repair mümkünse bounded repair
3. same-model retry yalnız transient/format failure için
4. fallback model/tier policy
5. human review/escalation
6. terminal failure + evidence

Aynı invalid prompt/output'u sınırsız retry etmek yasaktır.

## 13. Human Review Handoff

Human review'e gönderilen artifact en az:
- generated output
- evidence anchors
- deterministic validation results
- evaluator scores/findings
- prompt/model lineage
- warnings
- suggested edits varsa ayrı field

Reviewer'ın final edit'i raw AI output'tan ayrı saklanır.

## 14. Security & Tenant Isolation

- Her tool tenant-aware service boundary kullanır.
- Tool argument içindeki tenant id tek başına güvenilir değildir.
- Cross-tenant retrieval/index lookup hard-fail'dir.
- Agent prompt'unda tenantlar arası context mixing yasaktır.
- Sensitive logs redact edilir.
- Provider'a gönderilecek data policy ile sınırlandırılır.
- Prompt injection kaynak materyalde untrusted content olarak ele alınır.

## 15. Observability & Lineage

Her AI run:
- correlation_id
- job/run id
- actor/tenant reference
- capability
- prompt version
- model/provider
- input source versions
- tool calls
- retry/fallback sequence
- token/cost/latency
- validation/evaluation result
- human review outcome

ile izlenebilir olmalıdır.

## 16. Capability-to-Tier Baseline

- Orchestrator routing: Tier 0/1 deterministic-first
- Content Intelligence: Tier 1-2, complex escalation Tier 3
- Question Generation: Tier 2, escalation Tier 3
- Quality Evaluation: Tier 2-3, benchmark/judge Tier 4 when explicitly allowed
- Learning Insight: Tier 1-2, complex evidence synthesis Tier 3

Tier model identity değildir; router registry'den eligible model seçer.

## 17. ULTEF Agent/Tool/Memory Test Matrix

Hard gates:
- no unauthorized tool access
- no production domain mutation by agent
- no cross-tenant retrieval/memory leakage
- structured handoff schema compliance
- lineage completeness
- domain truth precedence

Required scenarios:
1. Orchestrator deterministic çözümü LLM'e göndermiyor.
2. Disallowed tool çağrısı reddediliyor.
3. Question Generator source/evidence olmadan grounded iddia üretemiyor.
4. Evaluator production approval veremiyor.
5. Derived memory stale olduğunda recompute/ignore policy uygulanıyor.
6. Cross-tenant vector/search result dönmüyor.
7. Retry limit sonrası terminal failure oluşuyor.
8. Fallback lineage kaydediliyor.
9. Human review artifact tüm evidence'i taşıyor.
10. Conversation memory domain fact'i override edemiyor.

## 18. Definition of Done

- 5 logical agent ayrıntılı tanımlı.
- Tool taxonomy ve access matrix açık.
- Memory taxonomy/read/write policy açık.
- Context Builder sorumluluğu açık.
- Handoff envelope tanımlı.
- Sync/async orchestration patterns tanımlı.
- Retry/fallback/human review kuralları tanımlı.
- Security/tenant/observability invariant'ları açık.
- ULTEF hard gate ve scenario matrisi tanımlı.
