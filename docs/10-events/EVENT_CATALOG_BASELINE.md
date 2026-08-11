# Event Catalog — V1 Baseline

Status: Canonical for Sprint 00
Related issue: #3

## Event Rules

- Events are versioned integration contracts.
- Event payloads contain tenant/correlation metadata where applicable.
- Consumers are idempotent.
- Transactional state + outbox record are committed atomically where required.
- Events do not expose secrets, answer keys or unnecessary PII.
- Event names describe completed facts, not commands.

## Training / Content

- `training.created.v1`
- `training.submitted_for_review.v1`
- `training.published.v1`
- `training.archived.v1`
- `training.version_created.v1`
- `content.version_created.v1`

Typical consumers: Notification, Analytics, Audit projections.

## Learning

- `learning.assignment_created.v1`
- `learning.progress_updated.v1`
- `learning.training_completed.v1`

Progress-update events may be throttled/coalesced for analytics; completion is a critical idempotent fact.

## Question Bank

- `question.created.v1`
- `question.submitted_for_review.v1`
- `question.approved.v1`
- `question.retired.v1`

## Assessment

- `assessment.published.v1`
- `assessment.closed.v1`
- `assessment.attempt_started.v1`
- `assessment.attempt_submitted.v1`
- `assessment.result_calculated.v1`
- `assessment.retake_requested.v1`
- `assessment.retake_approved.v1`
- `assessment.retake_rejected.v1`

`assessment.result_calculated.v1` consumers may include Certification, Analytics, Notification and Audit.

## Certification

- `certificate.issued.v1`
- `certificate.revoked.v1`

## AI Runtime

- `ai.job.created.v1`
- `ai.generation.completed.v1`
- `ai.generation.failed.v1`
- `ai.evaluation.completed.v1`
- `ai.review.requested.v1`
- `ai.review.approved.v1`
- `ai.review.rejected.v1`

AI events carry prompt/model lineage identifiers and usage references, not provider secrets.

## Organization / Identity

- `organization.membership_changed.v1`
- `identity.user_invited.v1`
- `identity.user_status_changed.v1`
- `identity.role_assignment_changed.v1`

## Notification / Audit

Notification delivery events may include:
- `notification.created.v1`
- `notification.delivered.v1`
- `notification.delivery_failed.v1`

Audit is also persisted as append-only records; not every audit fact needs to become a broad integration event.

## Standard Envelope

Conceptual envelope:

```json
{
  "eventId": "opaque-id",
  "eventType": "assessment.result_calculated.v1",
  "occurredAt": "RFC3339",
  "tenantId": "opaque-tenant-id",
  "correlationId": "opaque-correlation-id",
  "causationId": "optional-id",
  "actor": {"type":"user|system","id":"opaque-id"},
  "payload": {}
}
```

## Compatibility

- Additive optional fields are normally backward-compatible.
- Removing/renaming required fields or changing semantics requires a new event version.
- Consumers must ignore unknown optional fields.

## Delivery Semantics

At-least-once delivery is acceptable with idempotent consumers. Exactly-once claims are avoided unless technically proven and required.

## ULTEF Event Gates

Future event tests must verify:
- schema conformance
- tenant metadata presence
- idempotent consumption
- duplicate delivery safety
- no cross-tenant projection contamination
- version compatibility
- outbox recovery after worker failure
