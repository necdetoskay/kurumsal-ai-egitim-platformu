# PostgreSQL Schema & Index Baseline — V1

Status: Canonical for Sprint 00
Related issue: #3

## Goals

- Tenant isolation by default
- Bounded-context ownership
- Historical integrity via version/snapshot
- Deterministic scoring and auditability
- Idempotent critical workflows
- Efficient list/search paths without premature over-indexing

## Core Tables by Context

### Identity & Access
- users
- roles
- permissions
- user_roles
- sessions/security_state

### Organization
- tenants
- organization_units
- departments
- groups
- memberships
- tenant_settings

### Training
- trainings
- training_versions
- learning_objectives
- training_version_objectives
- training_publication_history

### Content
- modules
- content_items
- content_versions
- source_materials
- video_metadata
- transcripts

### Learning
- training_assignments
- learner_progress
- module_progress
- video_progress
- completion_records

### Question Bank
- questions
- question_versions
- question_options
- question_tags
- question_learning_objectives
- question_evidence_refs
- question_reviews

### Assessment
- assessments
- assessment_versions
- assessment_question_snapshots
- attempts
- answers
- results
- retake_policies
- retake_requests

### Certification
- certificate_templates
- certificates
- certificate_revocations

### AI Runtime
- ai_requests
- ai_jobs
- prompt_versions
- model_registry
- ai_generation_results
- ai_evaluations
- ai_human_reviews
- ai_usage_records

### Analytics / Notification / Audit
- learning_insight_results
- analytics_projection checkpoints/read-model tables
- notifications
- notification_delivery_attempts
- audit_events
- outbox_events
- background_job_runs

## Tenant Column Rule

Tenant-owned tables carry `tenant_id` explicitly unless ownership is provably derivable and the access layer still enforces tenant scope. Client-provided tenant IDs are not authoritative.

Recommended key pattern:
- UUID/ULID style opaque primary IDs
- tenant-scoped unique constraints where semantics are tenant-local

Examples:
- unique `(tenant_id, normalized_email)` for tenant-local identity if chosen by auth model
- unique `(tenant_id, training_slug)`
- unique `(tenant_id, idempotency_key, operation_type)` where used

## Versioning / Snapshot Rules

Immutable or append-oriented rows are required for:
- training_versions after publish
- content_versions referenced by published training
- question_versions used by assessments
- assessment_versions
- assessment_question_snapshots
- submitted answers/attempt result evidence
- prompt version/model identity used by AI generation

## Critical Constraints

- attempt belongs to one learner, assessment_version and tenant
- submitted/completed attempt cannot be edited by normal workflow
- certificate eligibility key prevents accidental duplicate issuance
- outbox event has unique event/idempotency identifier
- retake approval creates a new attempt rather than mutating prior attempt
- question snapshot stores scoring-relevant material needed to reproduce result

## Index Strategy

### Mandatory
- PK indexes
- FK/support indexes for high-use joins
- tenant-first indexes on common tenant-scoped queries
- unique indexes for idempotency and natural business constraints

### Likely composite indexes
- training_assignments `(tenant_id, learner_id, status, due_at)`
- learner_progress `(tenant_id, learner_id, training_version_id)` unique/current
- questions `(tenant_id, status, updated_at)`
- assessments `(tenant_id, status, updated_at)`
- attempts `(tenant_id, learner_id, assessment_version_id, state)`
- results `(tenant_id, learner_id, created_at)`
- notifications `(tenant_id, recipient_user_id, read_at, created_at desc)`
- audit_events `(tenant_id, occurred_at desc)` plus actor/resource lookup indexes
- ai_requests `(tenant_id, capability, created_at desc)`

### Text/search
Start with PostgreSQL-native search/index options where adequate. External search is not a V1 architectural requirement.

### JSONB
Use only for truly flexible metadata/provider payloads; domain-critical searchable fields remain typed columns. Add GIN indexes only for proven query paths.

## Soft Delete / Lifecycle

Do not use generic soft-delete everywhere. Prefer explicit lifecycle states (`ARCHIVED`, `REVOKED`, `RETIRED`) when business meaning exists. Hard delete is restricted where historical/audit integrity is required.

## Transaction / Outbox

State transition and corresponding outbox/audit record should be persisted atomically where required. Consumers must be idempotent.

## RLS Decision

PostgreSQL Row Level Security is an optional defense-in-depth implementation decision to be resolved by ADR. It does not replace application-layer tenant authorization and tests.

## Performance Rule

Index additions require a real query/use-case justification. ULTEF/performance evidence should drive later index tuning rather than speculative indexing.