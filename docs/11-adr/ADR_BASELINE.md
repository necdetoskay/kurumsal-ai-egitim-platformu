# ADR Baseline — V1

Status: Canonical index for Sprint 00
Related issue: #3

Bu belge mevcut kanonik kararlardan çıkarılan ADR kayıtlarını ve implementasyon öncesi açık ADR backlog'unu tanımlar.

## Accepted Decisions

### ADR-001 — V1 Modular Monolith
Decision: V1 tek deployable/modüler monolith yönünde ilerler; bounded context sınırları kod ve contract seviyesinde korunur.
Rationale: operasyonel sadelik, hızlı delivery, 20/80 yaklaşımı.
Consequence: service extraction ancak gerçek ölçek/operasyon ihtiyacı ile yapılır.

### ADR-002 — PostgreSQL Transactional Source of Truth
Decision: transactional domain state PostgreSQL'de tutulur.
Consequence: Redis/cache authoritative değildir.

### ADR-003 — Explicit Tenant Isolation
Decision: tenant context veri, authorization, cache, job, event ve AI trace katmanlarında explicit korunur.
Consequence: client `tenant_id` tek başına trusted source değildir.

### ADR-004 — Version/Snapshot Historical Integrity
Decision: published content, assessment question sets, attempts/results ve AI lineage gibi tarihsel doğruluğu etkileyen veriler version/snapshot ile korunur.

### ADR-005 — Deterministic Rules Before LLM
Decision: scoring, authorization, schema validation ve deterministik business rule'lar LLM'e bırakılmaz.

### ADR-006 — Provider-independent AI Runtime Harness
Decision: domain/application code doğrudan provider-specific model çağırmaz; Model Router/Registry/Prompt Registry üzerinden çalışır.

### ADR-007 — Human-in-the-Loop for Critical AI Content
Decision: kritik AI-generated training/assessment content automated validation + quality evaluation + human review olmadan production publish olamaz.

### ADR-008 — Event Outbox + Idempotent Consumers
Decision: transaction ile integration event gerektiren kritik akışlarda outbox yaklaşımı; consumers at-least-once teslimata karşı idempotent tasarlanır.

### ADR-009 — Learning Objective as First-Class Domain Concept
Decision: Learning Objective training-content-question-result-insight traceability zincirinin merkezidir.

### ADR-010 — ULTEF-gated Issue Completion
Decision: applicable ULTEF qualification PASS olmadan issue completed kapatılmaz; global standard `STD-TEST-001` referans alınır.

## ADR Backlog — Must Resolve Before/Within Relevant Sprint

### ADR-B01 — Authentication / Identity implementation
Questions:
- auth library/provider
- local vs external identity boundary
- MFA/SSO sequencing

Target: Sprint 02.

### ADR-B02 — RBAC implementation and permission persistence
Questions:
- policy framework
- permission storage
- session/token claim strategy

Target: Sprint 02.

### ADR-B03 — PostgreSQL RLS
Question: defense-in-depth olarak RLS kullanılacak mı, hangi tenant-owned tabloları kapsayacak?
Target: Sprint 02/data implementation.

### ADR-B04 — Async job/queue technology
Question: Redis-backed queue vs DB-backed/outbox-driven worker choices.
Target: Sprint 01/03.

### ADR-B05 — Object storage provider/interface
Target: Content implementation sprint.

### ADR-B06 — API implementation style
Question: REST framework/router/schema generation mechanism; machine-readable OpenAPI source strategy.
Target: Sprint 01.

### ADR-B07 — AI provider initial set
Decision criteria: capability, Turkish quality, structured output, cost, latency, availability and ULTEF benchmark.
Target: Sprint 03 and AI capability sprints.

### ADR-B08 — Model routing policy implementation
Question: configuration storage, fallback rules, budget enforcement and runtime override governance.
Target: Sprint 03.

### ADR-B09 — Search strategy
Question: PostgreSQL native search sufficient mi; external search requires evidence.
Target: content/question scale evidence.

### ADR-B10 — Observability stack
Question: structured logging, tracing, metrics and AI telemetry implementation choices.
Target: Sprint 01/03.

## ADR Rule

Architecture-significant technology selection veya invariant değişikliği doğrudan kod içinde gizli karar olarak bırakılmaz. ADR eklenir/güncellenir ve ilgili issue/PR bunu referanslar.

Global olarak tekrar kullanılabilir ADR biçim/işleyiş standardı gelecekte `engineering-standards` repository'sinde kanonikleştirilecektir; bu repo project-specific kararları tutar.
