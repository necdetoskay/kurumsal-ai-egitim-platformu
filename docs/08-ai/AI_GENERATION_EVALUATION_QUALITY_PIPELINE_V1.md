# AI Generation, Evaluation & Quality Control Pipeline — V1

Status: Canonical backend design
Related issue: #16

## 1. Goal
AI çıktısını doğrudan domain'e yazmak yerine ölçülebilir, izlenebilir ve gerektiğinde reddedilebilir bir qualification pipeline üzerinden geçirmek.

## 2. Canonical Flow
`Request -> Context Build -> Generation -> Schema Validation -> Deterministic Validation -> Evidence/Grounding Check -> Quality Evaluation -> Decision -> Human Review if required -> Domain Commit`

## 3. Generation Record
Her generation şu lineage'ı taşır:
- tenant_id
- capability
- request/correlation id
- actor
- prompt id/version
- model/provider/version
- routing tier
- input evidence ids
- tool calls
- raw output
- parsed structured output
- token/latency/cost
- retry/fallback lineage
- evaluator version/result
- human review result if any

## 4. State Machine
`CREATED -> CONTEXT_READY -> GENERATED -> VALIDATED -> EVALUATED -> {APPROVED|REVIEW_REQUIRED|REPAIR_REQUIRED|REJECTED} -> COMMITTED`

Terminal failure states may include `FAILED`, `CANCELLED`, `POLICY_BLOCKED`.

## 5. Validation Layers
### V0 Transport/Provider
Timeout, auth, rate limit, malformed provider response.
### V1 Schema
Required JSON/schema contract. Invalid output cannot proceed.
### V2 Deterministic Business Validation
Enumerations, answer cardinality, required evidence refs, lengths, forbidden fields, objective ids, tenant/resource validity.
### V3 Grounding/Evidence
Claims/questions must be supportable by approved evidence where capability requires grounding.
### V4 Quality Evaluation
Correctness, ambiguity, instructional alignment, difficulty, option quality, completeness, language quality, duplicate risk.
### V5 Human Review
Required for critical content or uncertain/low-confidence results according to policy.

## 6. Generator / Evaluator Separation
Generator output is never self-approved solely by the same generation result.
Evaluation uses independent rubric and preferably independent model/family or deterministic evidence where practical.
Evaluator provides a quality signal, not authorization or domain ownership.

## 7. Quality Decision
Each capability defines:
- hard gates
- weighted/soft metrics
- minimum thresholds
- escalation rules

A hard-gate failure cannot be compensated by high average score.

Typical hard gates:
- schema validity
- safety/policy
- evidence support when required
- tenant isolation
- answer-key consistency
- forbidden hallucinated citations

## 8. Question Generation Rubric
Example dimensions:
- source correctness
- answer correctness
- distractor plausibility
- ambiguity
- objective alignment
- requested difficulty
- language clarity
- duplicate/near-duplicate
- explanation quality
- evidence locator validity

## 9. Content Intelligence Rubric
- source fidelity
- concept coverage
- omission risk
- unsupported claims
- outline coherence
- audience/level appropriateness
- language quality
- evidence traceability

## 10. Learning Insight Rubric
- evidence sufficiency
- objective mapping validity
- overgeneralization risk
- confidence calibration
- recommendation relevance
- explainability

Single-question evidence cannot justify broad competency claims.

## 11. Deterministic Validators
Use code instead of LLM whenever possible:
- JSON/schema validation
- enum/cardinality
- duplicate exact/hash
- objective/resource existence
- evidence-id integrity
- answer consistency
- score calculations
- threshold comparison
- prohibited metadata leakage

Semantic duplicate/ambiguity may combine embeddings/rules/evaluator.

## 12. Repair & Retry
Repair is bounded.

`invalid -> repair attempt -> revalidate`

Rules:
- no unbounded loops
- retry reason recorded
- model/prompt changes recorded
- deterministic failure should not trigger pointless LLM retries
- repeated quality failure escalates or rejects
- fallback model does not bypass gates

## 13. Human Review Contract
Reviewer receives:
- final candidate
- raw generation optionally
- evidence/source locators
- automated validation findings
- evaluator scores/reasons
- model/prompt lineage
- warnings

Reviewer may approve, edit+approve, request regeneration, or reject.
Final approved artifact is stored separately from raw model output.

## 14. Cost & Latency Governance
Each capability has target budgets.
Routing considers:
- no-LLM/deterministic path first
- cheapest qualified model tier
- batchability
- caching where safe
- selective escalation

Quality hard gates are not weakened to meet cost.

## 15. Golden Dataset & Qualification
Every production prompt/model combination is evaluated against versioned datasets according to global STD-AI-001/002 and ULTEF profiles.

Dataset categories include:
- normal
- edge
- hard
- ambiguous
- negative/no-answer
- multilingual
- adversarial/prompt-injection
- historical regressions

Holdout data is protected from prompt tuning where practical.

## 16. Model/Prompt Promotion
Candidate promotion requires comparison to current baseline on:
- hard-gate pass rate
- task quality metrics
- regressions
- latency
- cost
- structured-output reliability

Cheaper or newer model alone is not sufficient.
Rollback target/version must be known.

## 17. Production Feedback Loop
`Production failure/poor review -> triage -> anonymized/redacted regression case -> dataset version -> benchmark -> fix/prompt/model candidate -> qualification -> promotion`

Not every user disagreement becomes ground truth; cases require review/classification.

## 18. Telemetry
Track per capability/model/prompt version:
- request volume
- success/failure
- schema failure
- repair rate
- evaluator distribution
- human approval/edit/reject rate
- evidence failure
- latency p50/p95
- token usage/cost
- fallback rate
- regression incidents

## 19. Security
- source content remains untrusted input
- prompt injection cannot grant tools/permissions
- secrets are not exposed in model context
- tenant data is isolated in context/evaluation/telemetry
- logs use redaction policy

## 20. ULTEF AI Qualification Profile
Required test classes:
- schema compliance
- deterministic validators
- grounding/evidence
- ambiguity/duplicate
- objective alignment
- multilingual quality
- adversarial/prompt injection
- retry/repair bounds
- model fallback behavior
- human-review handoff
- prompt/model lineage
- cost/latency telemetry
- regression corpus

Hard gates:
- safety/security
- tenant isolation
- schema/contract
- required grounding/evidence
- critical business invariants

## 21. Definition of Done
Generation, validation, evaluation, human review, lineage, cost, promotion and regression feedback are defined independently of a specific model/provider; no AI output becomes domain truth merely because generation succeeded.