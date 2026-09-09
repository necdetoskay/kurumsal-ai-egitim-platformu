# AEGIS MUR — Capability Census V1

**Status:** Review baseline  
**Decision vocabulary:** KEEP | COMPLETE | RESCOPE | DEFER | REMOVE

## 1. Core learning product

| Capability | Importance | MUR decision | Reason |
|---|---|---|---|
| Training aggregate/versioning | CORE | KEEP | Published learning artifact and history boundary |
| Learning Objective | CORE / DIFFERENTIATOR | COMPLETE | Central trace from content to question/result/insight; must be end-to-end |
| Module/content authoring | CORE | KEEP | Required to create learning experience |
| Source/evidence lineage | CORE ENABLER | KEEP | Grounded AI and auditability depend on it |
| Human review/publish | CORE | KEEP | Critical AI content cannot self-publish |
| Assignment | CORE | COMPLETE | Must connect training to resolved learner audience |
| Progress/resume | CORE | COMPLETE | Learner mission flow requires real persistence/retry-safe behavior |
| Assessment | CORE | KEEP | Produces learning evidence; deterministic and secure |
| Question Bank | CORE | KEEP | Supports manual and AI-assisted assessment authoring |
| Result/retake | CORE | COMPLETE | Must close learner flow and preserve attempt history |
| Certification | SUPPORTING CORE | COMPLETE | Final product output when policy permits |
| Learning Insight / weak-area | DIFFERENTIATOR | COMPLETE — BLOCKER | Product vision depends on learning evidence becoming actionable insight |
| Recommendation/repeat | DIFFERENTIATOR | COMPLETE — BLOCKER | Must close continuous learning loop |
| Organization learning analytics | DIFFERENTIATOR | COMPLETE after learner/insight | Aggregates learning signals into action; not generic HR analytics |

## 2. AI and content intelligence

| Capability | Importance | MUR decision | Reason |
|---|---|---|---|
| AI Runtime Harness | ENABLER | KEEP | Provider independence, structured output, safety, cost and traceability |
| Model Registry / Router | ENABLER | KEEP | Qualified replaceable model strategy |
| Prompt Registry/versioning | ENABLER | KEEP | Reproducibility/regression |
| Content Intelligence | CORE ENABLER | COMPLETE | Must feed real authoring with evidence |
| AI Question Generation | CORE ENABLER | COMPLETE | Strong value when integrated into reviewable Question Bank workflow |
| Quality Evaluator | CORE ENABLER | COMPLETE | Hard-gate AI quality path |
| Golden Dataset / Benchmark | ENABLER | KEEP | Quality/cost promotion evidence |
| Agent runtime/tool boundary | ENABLER | KEEP | Controlled AI composition; not itself a product goal |
| General-purpose AI Tutor | ADJACENT/FUTURE | DEFER | Not required for V1 mission loop |
| Autonomous publishing | NON-GOAL | REMOVE from active V1 | Contradicts human-control invariant |
| AI avatar/video/voice | FUTURE | DEFER | No V1 mission dependency |

## 3. Organization / identity

| Capability | Importance | MUR decision | Reason |
|---|---|---|---|
| Tenant isolation | HARD ENABLER | KEEP | Required for enterprise safety |
| User/auth/session | HARD ENABLER | COMPLETE | Must be real, server-authoritative, not demo-only |
| Organization | ENABLER | KEEP | Root learning audience/reporting context |
| Company | ENABLER | KEEP | Multi-company tenant targeting/context |
| Department | ENABLER | KEEP | Core training targeting and aggregated learning insight |
| Employee != User | ENABLER | KEEP | Employee can exist separately from login account |
| Group | ENABLER | KEEP | Cross-org/manual learning audience targeting |
| Training audience resolver | CORE ENABLER | COMPLETE — BLOCKER | Connects organization model to learning mission |
| Temporal assignment/employment history | ADJACENT ENABLER | RESCOPE | Preserve only level required for correct targeting/history/audit |
| Position | ADJACENT | RESCOPE | Keep if used by targeting/reporting/rules; avoid HR catalog expansion |
| Location | ADJACENT | RESCOPE | Keep if used by targeting/reporting/rules; otherwise Later |
| Organization audit | HARD ENABLER | KEEP | Critical mutations need evidence |
| CSV/Excel employee import | ADJACENT | RESCOPE | Useful onboarding capability; should not block learner mission unless required by target customer |
| AD/LDAP sync | ADJACENT | DEFER by default | Valuable enterprise integration but not V1 mission prerequisite |
| HR/ERP adapter ecosystem | FUTURE | DEFER | Explicitly outside V1 enterprise-integration scope unless promoted by change control |
| Organization as HR system-of-record | NON-GOAL | REMOVE from active V1 | Conflicts with Scope: V1 is not full HRIS |

## 4. UI / operational surfaces

| Capability | Importance | MUR decision | Reason |
|---|---|---|---|
| Responsive role shell | ENABLER | KEEP | Shared product surface |
| Instructor authoring UI | CORE | COMPLETE | Real API/persistence connection required |
| Question/assessment UI | CORE | COMPLETE | Must support real lifecycle and review |
| Learner dashboard/training player | CORE | COMPLETE — BLOCKER | Current primary mission gap |
| Learner assessment/result/retake UI | CORE | COMPLETE — BLOCKER | Must close real learner flow |
| Learner insight UI | DIFFERENTIATOR | COMPLETE — BLOCKER | Must show evidence-bounded insight |
| Reviewer UI | CORE ENABLER | COMPLETE | Human-control pipeline needs real review decisions |
| Admin assignment/audience UI | CORE ENABLER | COMPLETE | Needs preview/dedup/confirm semantics |
| Generic Organization KPI dashboards | ADJACENT | RESCOPE | Only metrics serving learning operations should be V1 priority |
| AI operations/cost UI | ENABLER | COMPLETE after mission flow | Useful operations surface, not earlier than core learner path |

## 5. Platform engineering

| Capability | Importance | MUR decision | Reason |
|---|---|---|---|
| PostgreSQL persistence/migrations | HARD ENABLER | KEEP | Domain truth and history |
| Redis/job support | ENABLER | KEEP where used | Operational dependency, not product goal |
| Idempotency/outbox/replay safety | HARD ENABLER | KEEP | Prevent duplicate critical effects |
| Security/tenant negative tests | HARD ENABLER | KEEP | Release blocker |
| Observability/correlation | ENABLER | KEEP | Required for production diagnostics |
| Backup/restore/migration qualification | HARD ENABLER | COMPLETE before release | Production readiness |
| Performance/load baseline | ENABLER | COMPLETE before release | Release readiness |
| ULTEF technical gates | ENABLER | KEEP | Strong engineering evidence, but cannot substitute mission acceptance |
| Mission-level E2E gate | CORE GOVERNANCE | ADD/COMPLETE — BLOCKER | Missing bridge between technical correctness and product success |

## 6. Active priority order from census

1. Restore canonical governance truth and eliminate roadmap/document drift.
2. Close training audience -> assignment boundary.
3. Complete learner training consumption + progress/resume.
4. Complete learner assessment/result/retake/certificate flow.
5. Implement Learning Objective evidence aggregation.
6. Implement bounded Learning Insight + recommendation/repeat.
7. Implement organization learning analytics from validated learning evidence.
8. Run one real mission E2E qualification scenario.
9. Only after the above, reconsider deferred enterprise integrations and adjacent Organization Management expansion.

## 7. Default freeze during MUR recovery

Until the Mission E2E gate is green, no new V1 scope should be added in:

- HR/ERP integration,
- generalized AD/LDAP ecosystem work,
- full HR lifecycle features,
- AI Tutor,
- gamification/social learning,
- native mobile,
- AI media,
- broad competency/career management.

Exceptions require explicit Purpose Gate evidence and a Design Freeze change decision.
