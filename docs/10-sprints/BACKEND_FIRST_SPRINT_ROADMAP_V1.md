# Backend-First Sprint Roadmap — V1

Status: Canonical for Design Freeze
Related issue: #6

## Goal

V1 implementasyon sırasını backend-first olacak şekilde kesinleştirmek. Frontend implementasyonu, domain/runtime/API contract'ları ve kritik E2E akışları stabil hale geldikten sonra başlar.

## Sprint Order

### Sprint 01 — Repository & Engineering Foundation
- monorepo/app/package structure
- configuration/env strategy
- PostgreSQL/Redis baseline
- migration framework
- logging/telemetry baseline
- test harness + ULTEF integration
- CI workflow baseline

Exit gate: build/lint/unit smoke, DB connectivity, migration smoke, ULTEF foundation profile PASS.

### Sprint 02 — Identity, Tenant & Authorization Foundation
- tenant model
- users/memberships/roles
- permission policy engine
- object-level authorization
- tenant-context resolution
- audit skeleton

Hard gates: tenant isolation, privilege escalation, IDOR/BOLA.

### Sprint 03 — Core Training Domain
- Training aggregate
- versioning/status transitions
- Learning Objective model
- content/module structure
- domain services/application services
- outbox/idempotency hooks

Exit gate: domain invariant + DB integration profile PASS.

### Sprint 04 — Question Bank & Assessment Domain
- question lifecycle/versioning
- assessment composition
- attempt/answer/submit/scoring
- snapshot integrity
- retake workflow

Hard gates: assessment integrity, immutable submitted attempt, answer-key protection.

### Sprint 05 — Learning Progress & Certification
- assignments
- progress/completion
- result linkage
- certificate eligibility/issue/revoke
- learning evidence model

### Sprint 06 — Material Ingestion Foundation
- SourceAsset/ExtractionRun/EvidenceSegment
- D0 native extraction
- D1 OCR/transcription abstraction
- quality states
- provenance/versioning
- indexing boundary

Hard gates: provenance, low-quality promotion prevention, untrusted-content isolation.

### Sprint 07 — AI Runtime Harness & Model Router
- capability registry
- provider/model adapters
- routing policy
- cost/latency telemetry
- prompt registry/versioning
- structured output validation
- fallback/escalation framework

### Sprint 08 — Agent / Tool / Memory Runtime
- orchestrator
- agent registry
- tool registry and policy enforcement
- context builder
- execution memory
- derived memory policy
- handoff contracts

Hard gates: tool boundary, tenant/data isolation, memory source-of-truth invariants.

### Sprint 09 — Content Intelligence & Training Authoring
- source-to-objective analysis
- outline/module composition
- evidence-aware content generation
- authoring orchestration
- publish-readiness baseline

### Sprint 10 — Question Generation & Quality Evaluation
- question generator
- deterministic validators
- evaluator
- grounding/ambiguity/duplicate checks
- bounded repair/retry
- human review queue

### Sprint 11 — Golden Dataset & Model/Prompt Benchmark
- executable golden dataset harness
- baseline candidate models/prompts
- runtime thresholds derived from benchmark
- promotion report
- regression corpus

Hard gates: safety/grounding/structured output + project thresholds.

### Sprint 12 — API Contract Completion & Backend E2E
- OpenAPI endpoint implementation completion
- contract tests
- event/outbox consumer tests
- critical user-flow API E2E
- failure/retry/reconciliation scenarios

Exit condition: backend is feature-complete enough for UI implementation.

### Sprint 13 — External Source Discovery Foundation
- optional V1 if #18 promoted
- search/query planner abstraction
- multilingual source discovery
- YouTube metadata/transcript integration
- source-quality/provenance pipeline

If not promoted to V1, contracts remain extension-ready and implementation is deferred.

### Sprint 14 — Frontend Application Shell & Auth UX
Frontend implementation begins only after Sprint 12 exit gate.

### Sprint 15 — Admin / Instructor / Reviewer UI
- role-aware navigation
- training/authoring/review workflows
- source/material operations
- assessment/question management

### Sprint 16 — Learner UI
- assigned trainings
- learning consumption/progress
- assessment/retake
- results/certificates/insights

### Sprint 17 — Full E2E, Accessibility & UX Stabilization
- browser E2E
- accessibility
- critical visual states
- API/UI integration regression

### Sprint 18 — Release Qualification
- security regression
- tenant-isolation suite
- performance baseline
- AI qualification regression
- migration/backup/restore validation
- operational readiness

## Backend-First Freeze Rule

Frontend business behavior must not become an alternative source-of-truth. UI consumes backend contracts and does not duplicate critical business invariants client-side.

## Issue Rule

Each implementation sprint is decomposed into session-independent GitHub issues. Every issue references canonical docs, acceptance criteria, applicable ULTEF profile and hard gates. `STD-TEST-001` applies to closure.

## Change Control

After Design Freeze, changes to core domain invariants, agent/tool/memory boundaries, ingestion provenance, assessment integrity or AI hard gates require explicit change issue/ADR and affected sprint requalification.