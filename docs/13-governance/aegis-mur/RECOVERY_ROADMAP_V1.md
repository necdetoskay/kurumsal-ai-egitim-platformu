# AEGIS MUR — V1 Mission Recovery Roadmap

**Status:** Proposed canonical recovery sequence

## Objective

Restore execution order around the product's fundamental learning mission without rewriting working foundations.

The recovery roadmap is intentionally narrower than the full backlog. Its goal is to get V1 from strong components to one demonstrably complete mission loop.

## Phase M0 — Canonical Truth Reconciliation

### Goal
Establish one trusted execution baseline before new feature expansion.

### Evidence already established

- `main` is not the only branch containing accepted project work.
- `design/organization-management-canonical-v1` is ahead of `main` and contains Organization canonical docs and implementation.
- PR #99 (Phase 5) and PR #104 (Phase 6) are merged to that branch, not to `main`.
- Therefore Organization work must be integrated/qualified, not reimplemented.

### Remaining work
- decide the promoted V1 baseline strategy for `main` vs `design/organization-management-canonical-v1`,
- reconcile `DESIGN_FREEZE_v1.md` status/version,
- select one canonical V1 roadmap and mark the conflicting roadmap historical/subordinate,
- map critical closed issues to PR -> target branch -> merge commit -> test/runtime evidence,
- verify the Organization branch against current root build/test/migration/runtime gates before promotion,
- record any incompatibility introduced by the 34-commit branch delta.

### Exit gate
- exactly one declared V1 integration/release baseline,
- exactly one active execution roadmap,
- no active canonical epic references unresolved docs,
- Organization branch promotion/rejection decision recorded,
- issue -> PR -> target branch -> merge commit -> tests/runtime evidence chain available for critical completed work.

## Phase M1 — Promote & Qualify Organization-to-Learning Bridge

### Goal
Bring the already implemented Organization audience capability into the declared V1 baseline and prove it connects to Learning Assignment correctly.

### Existing implementation evidence

Phase 6 #68 / PR #104 already provides:
- typed Organization / Company / Department / Group / Employee audience targets,
- exactly-one-target persistence constraint,
- deterministic resolver,
- overlap deduplication,
- explicit unlinked Employee -> User handling,
- stable resolution fingerprint/snapshot lineage,
- preview counts,
- side-effect-free preview,
- idempotent confirm/handoff contract,
- cross-tenant/cross-organization fail-closed behavior,
- API/web qualification tests.

### Work
- integrate/rebase the Organization canonical branch into the chosen V1 baseline,
- resolve root-package/API/web conflicts without weakening Organization invariants,
- bind assignment handoff to the actual Learning Assignment application boundary,
- run DB migration qualification against representative baseline data,
- run mixed-target, replay, tenant and historical snapshot tests,
- remove any duplicate implementation created outside the canonical branch.

### Explicit non-goals
- new HR/ERP adapters,
- generalized HR workflow expansion,
- additional Organization dashboard polish not required by audience selection,
- rebuilding #68 from scratch.

### Exit gate
A real published training can be assigned through the integrated Organization audience resolver and produce one deterministic learner assignment set with stable historical evidence on the declared V1 baseline.

## Phase M2 — Learner Core Experience

### Goal
Make the employee-facing learning journey real and production-backed.

### Work
- assigned training list/detail,
- training player/content reader,
- module/video progress persistence,
- retry-safe progress writes,
- resume across session/device where supported by V1 contract,
- due/mandatory state,
- completion evaluation from server-side evidence.

### Related work
- #48
- #27 foundations

### Exit gate
A learner can start, leave, authenticate again and resume an assigned training without losing authoritative progress.

## Phase M3 — Learner Assessment, Result, Retake, Certificate

### Goal
Close the measurable learning transaction.

### Work
- eligibility/start,
- server-authoritative attempt state,
- autosave/resume,
- immutable submit,
- deterministic scoring,
- pass/fail result,
- retake request/decision/new attempt with prior-history preservation,
- certificate issue/revoke projection.

### Exit gate
Real UI + API + DB flow proves no answer-key leakage, no duplicate submit/score/certificate side effects and no mutation of prior attempts.

## Phase M4 — Learning Objective Evidence Layer

### Goal
Convert assessment results into objective-level evidence rather than isolated scores.

### Work
- verify every scored item can trace to QuestionVersion and Learning Objective where policy requires,
- produce normalized per-objective evidence records,
- preserve assessment/version lineage,
- define evidence sufficiency contract,
- separate raw result from derived insight,
- prohibit HR/performance inference.

### Exit gate
The system can explain which immutable evidence supports an objective-level observation.

## Phase M5 — Bounded Learning Insight & Recommendation

### Goal
Deliver the product differentiator safely.

### Work
- weak-area calculation/inference,
- confidence/evidence projection,
- insufficient-evidence abstention,
- strength signal only when supported,
- objective -> relevant existing content mapping,
- recommendation/repeat action,
- model/prompt/schema lineage when AI is used,
- deterministic rules before optional model interpretation.

### Exit gate
Golden + runtime cases prove:
- sufficient evidence -> bounded insight,
- sparse evidence -> abstain,
- prohibited HR/career inference -> reject/omit,
- recommendation points only to valid existing content.

## Phase M6 — Organization Learning Analytics

### Goal
Turn validated individual learning evidence into privacy-safe organizational action.

### Work
- aggregate by allowed Organization/Company/Department/Group dimensions,
- training completion/performance,
- objective weak-area prevalence,
- question quality/performance signals,
- evidence sufficiency visibility,
- privacy/minimum-cohort rule where appropriate,
- no conversion of learning signals into unsupported employee-performance scoring.

### Exit gate
Admin can answer: “Which learning objectives/trainings need attention?” rather than only “How many employees exist?”

## Phase M7 — Mission E2E Qualification

### Goal
Prove V1's actual promise.

### Mandatory scenarios
- `MUR-E2E-001` Author -> Audience -> Learner -> Assessment -> Insight -> Recommendation -> Certificate -> Admin aggregate
- `MUR-E2E-002` Insufficient-evidence abstention
- `MUR-E2E-003` Cross-tenant substitution failures
- `MUR-E2E-004` Replay/idempotency/history integrity

### Qualification dimensions
- functional,
- DB/migration,
- API contract,
- browser E2E,
- authz/tenant isolation,
- AI golden/regression,
- cost/latency,
- observability/correlation,
- backup/restore where state is release-critical.

### Exit gate
All hard gates green and the product-owner mission scenario can be demonstrated without mock state or manual DB intervention.

## Phase M8 — V1 Release Hardening

### Goal
Only after mission completion, finish release readiness.

### Work
- performance/load baseline,
- security regression,
- migration forward/rollback strategy,
- backup/restore drill,
- operational runbooks,
- known limitations,
- production-like deployment/UAT,
- numeric mission KPI thresholds based on observed qualification data.

## Deferred queue during recovery

The following remain frozen unless a critical deployment dependency is demonstrated:

- further HR/ERP adapter ecosystem expansion,
- broad AD/LDAP productization beyond already implemented contracts,
- AI Tutor,
- competency/career platform,
- adaptive curriculum,
- native mobile,
- SCORM/xAPI ecosystem,
- gamification/social learning,
- AI media/voice/avatar.

## Work selection rule

At any point during MUR recovery choose the next issue by this order:

1. Does it unblock the next mission phase?
2. Does it close a CRITICAL/HIGH MUR finding?
3. Is it required by security/data integrity/release safety?
4. Otherwise, defer it behind mission completion.

## Definition of recovered V1

V1 is recovered when the platform can demonstrably execute:

`trusted source -> controlled authoring -> publish -> deterministic audience -> assignment -> learning/resume -> assessment -> result -> objective evidence -> bounded insight -> recommendation/repeat -> certificate -> organization learning action`

with tenant isolation, evidence lineage, immutable history and human-controlled AI preserved end-to-end.
