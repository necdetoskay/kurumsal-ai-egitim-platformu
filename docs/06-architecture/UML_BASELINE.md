# UML Baseline — V1

Status: Canonical for Sprint 00
Related issue: #3

## Class/Domain Relationships

- Tenant 1..* Membership
- User 1..* Membership
- Training 1..* TrainingVersion
- TrainingVersion 1..* LearningObjective
- TrainingVersion 1..* Module/Content references
- TrainingAssignment -> learner + TrainingVersion
- Question -> 1..* QuestionVersion
- QuestionVersion *..* LearningObjective
- Assessment -> 1..* AssessmentVersion
- AssessmentVersion -> immutable Question snapshots/version refs
- Attempt -> AssessmentVersion + Learner
- Attempt -> 1..* Answer
- Result -> Attempt
- Certificate -> Learner + TrainingVersion + eligibility evidence
- AIRequest -> PromptVersion + ModelRegistryEntry + tenant/actor trace
- LearningInsight -> Learner + LearningObjective + evidence/confidence

## State Machines

### Training
`DRAFT -> IN_REVIEW -> PUBLISHED -> ARCHIVED`

Material published changes require a new version rather than silent mutation.

### Question
`DRAFT -> APPROVED -> RETIRED` (retired is allowed for lifecycle management; historical snapshots remain valid).

### Assessment
`DRAFT -> PUBLISHED -> CLOSED -> ARCHIVED`

### Attempt
`CREATED -> IN_PROGRESS -> SUBMITTED -> SCORED -> COMPLETED`

Exceptional terminal states: `EXPIRED`, `INVALIDATED` under policy.

### Retake Request
`REQUESTED -> APPROVED | REJECTED | CANCELLED`

Approved retake creates a new Attempt; prior Attempt is immutable.

### Certificate
`ISSUED -> REVOKED`

## Sequence Baselines

### Publish Training
1. Actor requests publish.
2. Authorization and tenant checks.
3. Training validates lifecycle.
4. Content validates referenced immutable versions/completeness.
5. Learning Objective validity checked.
6. Human-review requirement checked.
7. Training state changes to PUBLISHED.
8. Audit/outbox created atomically.
9. Notifications/analytics consume events asynchronously.

### Assessment Submit
1. Learner submits in-progress Attempt.
2. Server validates ownership, tenant, time and state.
3. Attempt transitions to SUBMITTED.
4. Deterministic scorer evaluates supported questions.
5. Result is persisted and Attempt becomes SCORED/COMPLETED.
6. Result event emitted through outbox.
7. Certification eligibility, analytics and notification react idempotently.

### AI Question Generation
1. Authorized author supplies source/objectives/options.
2. AI Runtime creates traceable AIRequest.
3. Router resolves tier/model.
4. Provider result is schema validated.
5. Quality Evaluator creates independent evaluation signals.
6. Invalid/low-quality output follows repair/escalation policy.
7. Human Reviewer edits/approves/rejects.
8. Approved final form is committed to Question Bank as domain content; raw AI output remains separate evidence.

## UML Invariants

- Cross-context associations are identifiers/contracts, not foreign aggregate mutation rights.
- Historical attempts/results reference immutable versions/snapshots.
- Tenant context exists on all tenant-owned aggregates.
- AI entities never become domain truth without explicit domain commit.
