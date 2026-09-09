# AEGIS MUR — Purpose Traceability Matrix V1

**Status:** Working canonical matrix

## 1. Traceability model

Every active V1 capability should trace through:

`Purpose -> User Problem -> Capability -> Domain/Module -> UI/API -> Evidence/Test -> Mission Outcome`

A capability without a meaningful chain is a scope-drift candidate.

## 2. Mission traceability

| Mission outcome | User/problem | Required capabilities | Current evidence / artifacts | MUR decision |
|---|---|---|---|---|
| Create reliable training faster | Instructor must turn corporate knowledge into usable learning content | Ingestion, EvidenceSegment, Learning Objective, Authoring, AI Runtime, Human Review | Sprint 06/09/10 foundations, authoring packages/UI, prompt/golden assets | COMPLETE integration |
| Publish only controlled content | Institution cannot allow unsupported AI content to become authoritative | provenance, validators, evaluator, reviewer, immutable TrainingVersion | Human-in-the-loop rules and AI hard gates exist | KEEP + prove full flow |
| Assign training to correct people | Admin needs deterministic audience targeting without duplicate learners | Organization/Company/Department/Group/Employee, resolver, snapshot, Assignment | #68 completed through PR #104 on `design/organization-management-canonical-v1`; learning assignment foundation exists | INTEGRATE + qualify on V1 baseline |
| Employee can actually learn | Learner must consume training and resume reliably | learner dashboard, player, progress evidence, resume/retry | Sprint 17 #48 open; `main` screen contracts exist | COMPLETE — blocker |
| Assessment is trustworthy | Learner result must be secure/reproducible | Assessment snapshot, Attempt, immutable submit, scoring, answer-key boundary | assessment package, workflow tests/contracts | KEEP + full UI/API qualification |
| Result becomes learning evidence | Score alone is insufficient; evidence must map to objective | LearningObjective mapping, result evidence, aggregation | objective model and learning evidence foundations exist | COMPLETE — blocker |
| Identify weak areas safely | Learner needs useful insight without unsupported claims | bounded Learning Insight, confidence/evidence, abstention | prompt/golden cases and UI contract exist | COMPLETE — critical differentiator |
| Direct learner to useful next action | Weak area should lead to relevant existing content/repeat | objective-to-content map, recommendation/repeat policy | planned in vision/scope; no complete mission runtime evidence | COMPLETE — critical differentiator |
| Show organizational learning health | Admin needs actionable learning signals, not generic HR KPIs | aggregation by org dimensions, privacy/minimum cohort policy, training/question analytics | admin/analytics concepts exist | COMPLETE after insight |
| Preserve enterprise trust | Institution needs isolation, audit, history, recovery | AuthZ, tenant context, audit, immutable history, idempotency, backup/restore | strong engineering foundations | KEEP; release hard gate |

## 3. GitHub issue alignment

### KEEP / foundation aligned in intent

- #19 Repository & Engineering Foundation
- #21 Identity, Tenant & Authorization Foundation
- #23 Core Training Domain
- #25 Question Bank & Assessment Domain
- #27 Learning Progress & Certification
- #29 Material Ingestion Foundation
- #31 AI Runtime Harness & Model Router
- #33 Agent / Tool / Memory Runtime
- #35 Content Intelligence & Training Authoring
- #37 Question Generation & AI Quality
- #39 Golden Dataset & Model/Prompt Benchmark
- #41 Backend E2E & API Completion
- #43 Production Web Foundation & Role Shells
- #45 Authentication & Session UX
- #46 Instructor Authoring UI
- #47 Question Bank & Assessment UI

MUR does not automatically accept closure based only on issue state. Evidence must be tied to the declared V1 baseline branch/commit.

### COMPLETE / mission-critical work still required

- #48 Learner Experience — **highest product priority after baseline reconciliation**
- #49 Admin & Reviewer Operations — execute reviewer/assignment/learning-analytics slices before generic administration polish
- Learning Objective evidence aggregation — explicit implementation slice required
- Bounded Learning Insight + recommendation/repeat — explicit implementation slice required

### IMPLEMENTED ON ORGANIZATION CANONICAL BRANCH — integrate, do not duplicate

- #56 Organization Management V1 foundation and implementation track
- #67 Phase 5 Import, Integrations & Audit — PR #99 merged to Organization canonical branch
- #68 Phase 6 Training Audience Integration — PR #104 merged to Organization canonical branch
- #100–#103 audience persistence/resolver/preview/qualification children — closed by PR #104

The correct MUR action is not to reopen or rebuild these capabilities. The action is to decide whether the branch belongs in V1, then integrate/rebase and qualify it against the chosen baseline.

### RESCOPE going forward

- Organization Position/Location/Employment-history depth — preserve working requirements justified by targeting, authorization, history or learning analytics; avoid new HR-system expansion.
- CSV/Excel import — useful operational onboarding; already implemented on the Organization branch, but should not drive further V1 scope.
- AD/LDAP/HR/ERP contracts — existing work may remain; further ecosystem expansion is not a V1 priority absent explicit deployment need.

### DEFER unless explicit change promotion occurs

- #18 Multilingual External Source Discovery & YouTube Research
- #7 AI Tutor
- #8 Competency Graph & Skill Gap Analysis
- #9 Adaptive Learning & Personalized Curriculum
- #10 Interoperability, Mobile & Enterprise Integrations
- #11 Gamification, Social Learning & AI Media
- additional HR/ERP integration depth beyond the already implemented contract baseline

## 4. Organization Management purpose mapping

| Organization capability | Purpose served | V1 verdict |
|---|---|---|
| Organization/Company | tenant learning structure and reporting context | KEEP |
| Department | audience targeting + aggregated learning insight | KEEP |
| Employee | identifies learner independent of login account | KEEP |
| Group | flexible learning audience | KEEP |
| Audience resolver/snapshot | deterministic training targeting | KEEP; integrate from canonical branch |
| Employment current assignment/history | determines current placement and preserves historical targeting correctness | KEEP existing; RESCOPE future expansion |
| Position | targeting/reporting attribute where required | KEEP existing / no expansion without purpose proof |
| Location | targeting/reporting attribute where required | KEEP existing / no expansion without purpose proof |
| Import | operational onboarding | KEEP existing / non-blocking for mission recovery |
| Audit | trust and traceability | KEEP |
| AD/LDAP | external identity bootstrap/sync | KEEP existing contracts; future expansion conditional |
| HR/ERP adapters | external HR integration | KEEP existing bounded contracts; DEFER further productization |
| Payroll/recruitment/performance/career | no learning-loop requirement | REMOVE from V1 |

## 5. Mission-level test traceability

The final V1 release gate must include at least these executable scenarios:

### MUR-E2E-001 — Author to learner to insight

1. Register a trusted source.
2. Extract evidence with provenance.
3. Create/approve Learning Objectives.
4. Generate or author evidence-linked training content.
5. Human-review and publish immutable TrainingVersion.
6. Resolve a mixed Organization/Department/Group/Employee audience with deduplication.
7. Create assignments from a stable resolution snapshot.
8. Learner starts training.
9. Learner saves progress and resumes from a new session.
10. Learner starts and submits assessment.
11. Server deterministically scores immutable attempt.
12. Assessment evidence maps back to Learning Objectives.
13. If evidence is sufficient, weak-area insight is produced with confidence/evidence refs.
14. Existing relevant content is recommended for repeat.
15. Certificate is issued only when completion policy is satisfied.
16. Admin sees aggregated learning signal without crossing tenant/privacy boundaries.

### MUR-E2E-002 — Insufficient evidence abstention

A learner with insufficient objective evidence must receive `INSUFFICIENT_EVIDENCE`; no broad competency, HR, career or disciplinary inference may be produced.

### MUR-E2E-003 — Cross-tenant failure

Every source, training, audience target, assignment, attempt, result, certificate and insight cross-tenant substitution attempt must fail closed.

### MUR-E2E-004 — Replay/history integrity

Repeat publish/assignment/submit/score/completion/certificate operations must not create duplicate side effects or rewrite immutable historical evidence.

## 6. Exit condition

The matrix is satisfied only when every CORE and DIFFERENTIATOR row has:

- implementation evidence,
- executable test evidence,
- UI/API path where applicable,
- tenant/security evidence,
- mission outcome evidence,
- inclusion in the declared V1 release baseline.

Documentation-only existence or branch-local completion alone is not sufficient for V1 release qualification.
