# C4 Architecture — V1 Baseline

Status: Canonical for Sprint 00
Related issue: #3

## Context

Primary actors: Tenant Admin, Instructor, Reviewer, Learner, Platform Operator.

External systems (V1 boundary): AI model providers, email delivery provider, object storage, optional enterprise identity provider (SSO boundary).

System of interest: Kurumsal AI Eğitim Platformu.

Core responsibilities:
- tenant-aware identity and organization management
- training/content authoring and publishing
- learning assignments/progress
- question bank and assessments
- certification
- AI runtime harness and human review
- analytics/learning insight
- notification/audit

## Container View

### Web Application
Responsive web UI for admin, instructor, reviewer and learner experiences.

### Application/API
Modular monolith application layer exposing HTTP API and domain/application services.

### Background Worker
Async jobs for notifications, AI work, projections, heavy processing and reconciliation.

### PostgreSQL
Transactional source of truth. Tenant scope explicit. Context ownership respected.

### Redis
Ephemeral cache/queue/coordination only; never authoritative business source of truth.

### Object Storage
Training documents, media and generated artifacts with tenant-safe paths and access control.

### AI Provider Layer
External model providers accessed only through AI Runtime Harness.

### Email Provider
Outbound email delivery; Notification context owns delivery intent/status.

## Component View — Application/API

Bounded-context components:
- Identity & Access
- Organization
- Training
- Content
- Learning
- Question Bank
- Assessment
- Certification
- AI Runtime
- Analytics & Learning Insight
- Notification
- Audit & Operations

Cross-cutting components:
- authorization policy engine
- tenant-context resolver
- transaction/idempotency support
- event outbox/dispatcher
- observability/tracing
- schema/contract validation

## Architecture Rules

1. Modular monolith is the V1 deployment architecture.
2. Bounded contexts have explicit ownership and public application contracts.
3. Direct foreign-context table mutation is forbidden.
4. PostgreSQL is authoritative for transactional state.
5. Redis/cache failure must not corrupt domain truth.
6. External AI providers are isolated behind AI Runtime Harness.
7. Deterministic rules do not use LLMs.
8. Async/event-driven processing is preferred for analytics, notification and heavy AI jobs.
9. Strong consistency is used only where a single invariant requires it.
10. Tenant context must survive HTTP, job, event, cache and AI boundaries.

## Primary Runtime Paths

### Training Publish
Web -> API -> Authorization/Tenant -> Training -> Content validation -> state transition -> Outbox -> Notification/Analytics/Audit.

### Assessment Attempt
Web -> API -> Authorization/Tenant -> Learning eligibility -> Assessment -> immutable question snapshot -> Attempt -> deterministic scoring -> Result -> Outbox -> Certification/Analytics/Notification/Audit.

### AI Question Generation
Web -> API -> AI Runtime -> Model Router -> Provider -> structured validation -> Quality Evaluation -> Human Review -> Question Bank commit.

## Deployment Direction

V1 may deploy web/API/worker as a small number of processes while retaining logical context boundaries. Service extraction is not a V1 goal and must be justified by operational evidence, not aesthetics.
