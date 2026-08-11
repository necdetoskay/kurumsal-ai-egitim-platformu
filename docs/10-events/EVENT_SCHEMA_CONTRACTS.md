# Event Schema Contracts — V1

Status: Canonical baseline for Sprint 00
Related issue: #3

## Common Envelope

Every integration event must contain:

- `eventId`: globally unique opaque identifier
- `eventType`: versioned event name such as `assessment.result_calculated.v1`
- `occurredAt`: RFC3339 timestamp
- `tenantId`: required for tenant-owned events
- `correlationId`: trace/correlation identifier
- `causationId`: optional preceding command/event identifier
- `actor.type`: `user` or `system`
- `actor.id`: opaque actor id when applicable
- `payload`: event-specific object

## Required Security Rules

- No provider secrets, tokens or credentials.
- No assessment answer key leakage to broad consumers.
- PII minimized to identifiers unless a consumer contract explicitly requires more.
- Tenant-owned events without a valid tenant context are rejected/quarantined.

## Payload Families

### Training Events

`training.published.v1`
Required payload:
- `trainingId`
- `trainingVersionId`
- `publishedAt`

`training.archived.v1`
Required payload:
- `trainingId`
- `trainingVersionId`
- `archivedAt`

### Learning Events

`learning.assignment_created.v1`
Required payload:
- `assignmentId`
- `trainingVersionId`
- `targetType`
- `targetId`
- `dueAt` nullable

`learning.training_completed.v1`
Required payload:
- `assignmentId`
- `learnerId`
- `trainingVersionId`
- `completedAt`

### Assessment Events

`assessment.attempt_started.v1`
Required payload:
- `attemptId`
- `assessmentVersionId`
- `learnerId`
- `startedAt`

`assessment.attempt_submitted.v1`
Required payload:
- `attemptId`
- `assessmentVersionId`
- `learnerId`
- `submittedAt`

`assessment.result_calculated.v1`
Required payload:
- `attemptId`
- `assessmentVersionId`
- `learnerId`
- `resultId`
- `score`
- `passed`
- `calculatedAt`

No answer-key content is required in the integration event.

`assessment.retake_requested.v1`
Required payload:
- `retakeRequestId`
- `assessmentId`
- `learnerId`

`assessment.retake_approved.v1`
Required payload:
- `retakeRequestId`
- `assessmentId`
- `learnerId`
- `approvedBy`

### Certification Events

`certificate.issued.v1`
Required payload:
- `certificateId`
- `learnerId`
- `trainingVersionId`
- `issuedAt`

`certificate.revoked.v1`
Required payload:
- `certificateId`
- `revokedAt`
- `reasonCode`

### AI Events

`ai.generation.completed.v1`
Required payload:
- `aiRequestId`
- `jobId`
- `capability`
- `promptVersionId`
- `modelRegistryEntryId`
- `resultId`
- `usageRecordId`

`ai.generation.failed.v1`
Required payload:
- `aiRequestId`
- `jobId`
- `capability`
- `failureCode`
- `retryable`

`ai.review.requested.v1`
Required payload:
- `reviewId`
- `resultId`
- `capability`

`ai.review.approved.v1`
Required payload:
- `reviewId`
- `reviewerId`
- `approvedAt`
- `finalContentReference`

Raw provider output is not required to be broadcast in event payloads.

## Compatibility Rules

- Adding optional fields is backward-compatible unless semantics change.
- Required field removal/rename or semantic change requires a new event version.
- Consumers must tolerate unknown optional fields.
- Producer and consumer schema versions are observable.

## Delivery and Idempotency

- Delivery model may be at-least-once.
- Consumers deduplicate by `eventId` or domain-specific idempotency key.
- Outbox dispatch retries do not create duplicate business side effects.
- Failed consumers record retry/dead-letter/reconciliation evidence.

## ULTEF Event Contract Gates

- envelope completeness
- event-name/version validation
- required payload validation
- tenant metadata presence
- secret/answer-key leakage checks
- duplicate delivery safety
- cross-tenant projection isolation
- backward compatibility regression
