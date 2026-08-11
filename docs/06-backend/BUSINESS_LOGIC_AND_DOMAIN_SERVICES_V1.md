# Backend Business Logic & Domain Services — V1

Status: Canonical for Sprint 00 backend-first design
Related issue: #13

## 1. Purpose

Bu belge frontend'den bağımsız olarak V1 backend motorunun nasıl çalışacağını tanımlar. Entity/state transition/domain service/application service/transaction/idempotency/failure recovery sınırlarını coding-agent-ready seviyede açıklar.

## 2. Layering Rule

### Domain Layer
Sahip olduğu sorumluluklar:
- Aggregate invariants
- State transition validation
- Deterministic calculations
- Domain policies
- Domain events

Domain layer HTTP, UI, provider SDK veya persistence framework bilmez.

### Application Layer
Sorumluluklar:
- Use-case orchestration
- Authorization coordination
- Aggregate/repository çağrıları
- Transaction boundary
- Idempotency key handling
- Cross-context application contracts
- Outbox/event dispatch coordination

### Infrastructure Layer
Sorumluluklar:
- PostgreSQL repositories
- Redis/cache
- Queue/background jobs
- Object storage
- External mail/AI/provider adapters
- OpenTelemetry/logging adapters

## 3. Core Domain Service Catalog

### TrainingLifecycleService
- createDraft
- submitForReview
- publish
- archive
- createMaterialRevision
- validatePublishReadiness

### LearningObjectiveService
- createObjective
- updateObjective
- retireObjective
- validateTraceability

### AssignmentService
- assignTraining
- cancelFutureAssignment
- resolveAssignmentEligibility
- preventDuplicateActiveAssignment

### LearningProgressService
- recordModuleProgress
- recordVideoProgress
- resolveResumePosition
- evaluateTrainingCompletion

### QuestionLifecycleService
- createDraftQuestion
- submitForReview
- approve
- retire
- createQuestionVersion

### AssessmentLifecycleService
- createAssessment
- publishAssessment
- closeAssessment
- createQuestionSnapshotSet

### AttemptService
- startAttempt
- saveAnswer
- resumeAttempt
- submitAttempt
- expireAttempt
- invalidateAttempt

### ScoringService
- scoreDeterministicAttempt
- resolvePassFail
- produceResult

### RetakeService
- requestRetake
- approveRetake
- rejectRetake
- enforceAttemptLimit

### CertificationEligibilityService
- evaluateEligibility
- issueCertificate
- revokeCertificate

## 4. Training State Machine

`DRAFT -> IN_REVIEW -> PUBLISHED -> ARCHIVED`

Allowed transitions:
- DRAFT -> IN_REVIEW
- IN_REVIEW -> DRAFT (rework)
- IN_REVIEW -> PUBLISHED
- PUBLISHED -> ARCHIVED

Forbidden examples:
- DRAFT -> PUBLISHED without review gate when review is required
- ARCHIVED -> PUBLISHED in-place
- Silent mutation of material published version

Publish preconditions:
- tenant active
- actor authorized
- at least one active module
- required metadata valid
- learning objective coverage valid
- referenced content versions immutable/referenceable
- required human review complete
- publish-readiness validators PASS

## 5. Assignment and Learning State

Assignment states:
`ACTIVE | COMPLETED | CANCELLED | EXPIRED`

Progress is separate from assignment status.

Completion rule concept:
`required modules complete && required assessment policy satisfied -> training completion`

Properties:
- monotonic completion
- idempotent completion event
- server-authoritative calculation
- client progress percentage is input signal, not final truth

## 6. Question Lifecycle

Suggested states:
`DRAFT -> IN_REVIEW -> APPROVED -> RETIRED`

Rules:
- AI output starts as draft candidate
- approved question cannot be materially overwritten if used in assessment history
- material edit produces new version
- answer key never exposed to learner before allowed point

## 7. Assessment State Machine

`DRAFT -> PUBLISHED -> CLOSED -> ARCHIVED`

Publish preconditions:
- valid scoring policy
- valid time/attempt policy
- approved question versions available
- immutable snapshot generated
- tenant and authorization checks pass

## 8. Attempt State Machine

`CREATED -> IN_PROGRESS -> SUBMITTED -> SCORED -> COMPLETED`

Terminal alternatives:
- EXPIRED
- INVALIDATED

Rules:
- attempt is bound to assessment version and question snapshot set
- submit is idempotent
- after SUBMITTED learner mutations are rejected
- time source is server-authoritative
- result remains historically reproducible

## 9. Deterministic Scoring

V1 auto-scoreable question types must be scored without LLM dependency.

Inputs:
- immutable attempt answers
- question snapshot answer keys
- assessment scoring policy version

Outputs:
- raw score
- normalized score
- pass/fail
- scoring breakdown where allowed

Same inputs must produce same output.

## 10. Retake Logic

Policies:
- DISABLED
- AUTO_ALLOWED
- APPROVAL_REQUIRED

Rules:
- retake never edits prior attempt
- approval creates eligibility for a new attempt
- max attempt limit server-side enforced
- authoritative certificate attempt policy is explicit

## 11. Certificate Logic

Eligibility calculation is deterministic and auditable.

Typical rule:
`training completion + required assessment pass -> eligible`

Certificate issue must be idempotent for same eligibility evidence.

Revocation uses state change, not hard delete.

## 12. Application Service Orchestration

Example — publish training:
1. Resolve actor + trusted tenant context
2. Check `training.publish`
3. Load training aggregate
4. Request content-version readiness from Content contract
5. Request review readiness where required
6. Domain service validates publish invariants
7. Commit Training state change in transaction
8. Write audit record/outbox entry
9. Dispatch `training.published` asynchronously

Example — submit attempt:
1. Resolve actor/tenant
2. Load attempt with lock/optimistic concurrency
3. Validate state/time
4. Freeze latest answer set
5. Transition to SUBMITTED
6. Deterministic scoring
7. Persist result + transition SCORED/COMPLETED
8. Write outbox events
9. Async consumers update analytics/certification/notification

## 13. Transaction Boundaries

A single bounded-context invariant should normally commit in one database transaction.

Cross-context distributed transaction is avoided.

Preferred pattern:
- local transaction
- outbox event
- idempotent consumer
- reconciliation if downstream fails

Do not hold database transactions open while calling AI providers, email providers or slow external services.

## 14. Idempotency Matrix

Must be idempotent/retry-safe:
- user invitation request
- training publish command
- assignment creation
- attempt start
- attempt submit
- scoring finalization
- retake approval
- certificate issue
- event consumption
- async AI job completion commit

Idempotency key scope should include tenant + operation + actor/resource context where applicable.

## 15. Concurrency Strategy

Use optimistic concurrency/version column by default for mutable aggregates.

Use stronger locking when duplicate side effect or race can violate critical invariant, e.g.:
- attempt submit
- certificate issuance
- max-attempt enforcement
- publish transition

Conflict returns explicit domain/application error, never silent last-write-wins.

## 16. Failure Recovery Matrix

### Provider/AI failure
- no open DB transaction
- job state remains retryable/failed
- domain data is not partially committed

### Event consumer failure
- event remains/retries
- consumer idempotency prevents duplicate effects
- DLQ/reconciliation after retry budget

### Certificate downstream failure
- eligibility/result remains source truth
- issuance can be replayed safely

### Notification failure
- business transaction remains committed
- notification delivery retries independently

### Analytics failure
- transactional source remains correct
- projection rebuilt/replayed

## 17. Cross-Context Contracts

No direct foreign table mutation.

Examples:
- Assessment asks Learning for eligibility through contract/read model
- Certification consumes assessment/completion facts
- Analytics consumes events/read projections
- AI Runtime returns candidate output; owning domain performs explicit commit

## 18. Audit Requirements

Every critical transition records:
- tenant
- actor/system actor
- action
- aggregate/resource id
- previous/new state where appropriate
- correlation id
- timestamp
- reason/approval metadata where applicable

## 19. Error Taxonomy

Recommended stable categories:
- AUTHENTICATION_REQUIRED
- FORBIDDEN
- TENANT_BOUNDARY_VIOLATION
- NOT_FOUND
- INVALID_STATE_TRANSITION
- VALIDATION_FAILED
- CONFLICT
- IDEMPOTENCY_CONFLICT
- ATTEMPT_EXPIRED
- LIMIT_EXCEEDED
- EXTERNAL_DEPENDENCY_FAILED
- TEMPORARILY_UNAVAILABLE

Transport mapping is API concern; domain does not emit HTTP codes.

## 20. ULTEF Domain Invariant Matrix

Hard-gate tests:
- cross-tenant resource mutation impossible
- published history cannot be silently mutated
- submit attempt is idempotent
- deterministic scoring stable
- learner cannot mutate submitted attempt
- duplicate certificate prevented
- max retake limit cannot be bypassed
- completion is monotonic/idempotent
- failed async consumer does not corrupt source transaction
- AI/provider timeout never leaves partial domain commit

## 21. Coding-Agent Implementation Guidance

Backend implementation order:
1. Domain types/errors/state machines
2. Aggregate invariants
3. Domain services
4. Repository contracts
5. Application services
6. Transaction/idempotency/outbox infrastructure
7. API adapters
8. ULTEF domain/integration tests

UI must not become a dependency for backend correctness tests.
