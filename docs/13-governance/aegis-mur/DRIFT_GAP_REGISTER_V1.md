# AEGIS MUR — Drift & Gap Register V1

**Status:** Active review register

## Severity model

- **CRITICAL** — V1 mission cannot be truthfully completed/released.
- **HIGH** — strong risk of wrong product direction, false completion or broken governance.
- **MEDIUM** — material inefficiency, ambiguity or maintainability risk.
- **LOW** — cleanup/clarity issue with limited mission impact.

## Findings

### MUR-001 — Learner mission flow is not yet product-complete

**Severity:** CRITICAL  
**Type:** Mission gap

The V1 purpose requires the learner to receive an assignment, consume training, resume progress, complete assessment, see result/retake/certificate and consume bounded learning insight. The learner experience issue remains a direct blocker and current web surfaces contain substantial shell/state-contract behavior rather than a fully demonstrated real API/DB flow.

**Required action:** Prioritize #48 and prove `assignment -> learning -> resume -> assessment -> result -> certificate` through real persistence and browser/API qualification.

---

### MUR-002 — Learning Insight exists more strongly in design/eval than runtime product evidence

**Severity:** CRITICAL  
**Type:** Differentiator gap

The product vision differentiates itself from a classic LMS through Learning Objective evidence, weak-area detection and recommendation/repeat. Prompt contracts and golden cases exist, but full runtime mission evidence is not yet the same maturity as assessment/learning foundations.

**Required action:** Implement evidence aggregation, bounded inference, abstention, recommendation mapping and learner/admin projections. Treat as V1 release blocker.

---

### MUR-003 — Organization Management has expanded beyond its V1 purpose boundary

**Severity:** HIGH  
**Type:** Scope drift

Canonical scope states V1 is not a full HR system and broad enterprise HR integrations are Later. Organization Management later expanded into temporal employment, external identities, imports, AD/LDAP and HR/ERP adapter contracts.

**Required action:** Keep the organization model required for learning targeting, authorization, history and analytics. Rescope Position/Location/employment depth. Move HR/ERP integration to deferred scope. AD/LDAP is conditional on target deployment need rather than default V1 blocker.

---

### MUR-004 — Mission-critical audience bridge was sequenced after adjacent organization work

**Severity:** HIGH  
**Type:** Priority inversion

Training audience resolution is the direct bridge from Organization Management to the learning product, yet import/integration/audit work can be completed before the learner mission is closed.

**Required action:** Make audience resolver + stable assignment snapshot a higher product priority than additional enterprise integrations.

---

### MUR-005 — Multiple roadmap baselines describe incompatible sprint numbering/order

**Severity:** HIGH  
**Type:** Canonical governance drift

`docs/10-sprints/BACKEND_FIRST_SPRINT_ROADMAP_V1.md` and `docs/18-sprints/SPRINT_ROADMAP_V1.md` describe materially different sprint order/meaning. Both appear authoritative enough to guide implementation.

**Risk:** Coding agents and maintainers can choose different “canonical” next steps.

**Required action:** Select one canonical V1 execution roadmap; mark the other superseded/historical or explicitly subordinate it. The MUR Recovery Roadmap should govern immediate realignment until reconciliation is merged.

---

### MUR-006 — Design Freeze status and implementation history are inconsistent

**Severity:** HIGH  
**Type:** Governance drift

`DESIGN_FREEZE_v1.md` still identifies itself as `Design Freeze Candidate`, while many implementation sprints have proceeded and Organization Management refers to design-frozen canonical sources.

**Required action:** Reconcile Design Freeze status/version after MUR. Do not claim a frozen baseline when canonical source set is incomplete or conflicting.

---

### MUR-007 — Organization epic references canonical documents not present on current main

**Severity:** HIGH  
**Type:** Traceability gap

Epic #56 references intent, architecture, business rules, API, VCE index and governance/design-freeze documents that are not all visible in the current `main` tree.

**Risk:** Issue closure can reference non-existent canonical sources.

**Required action:** Locate the actual accepted branch/PR or restore the documents before further canonical closure. If they never landed, downgrade closure evidence and requalify affected phases.

---

### MUR-008 — Issue “completed” state is not sufficient proof of main/runtime completion

**Severity:** HIGH  
**Type:** Evidence governance

Some Organization Management phases have been closed while the currently inspected `main` baseline does not expose corresponding full implementation/docs. This does not prove the work is absent—it proves the closure evidence chain must be reconciled.

**Required action:** Establish mandatory closure tuple:

`issue -> PR -> merged commit -> canonical docs -> tests -> runtime evidence -> main verification`

No item is MUR-complete from issue state alone.

---

### MUR-009 — Technical gates are stronger than mission-success gates

**Severity:** HIGH  
**Type:** Product validation gap

ULTEF, tenant isolation, deterministic scoring, AI hard gates and other technical controls are strong. However there is no single release gate demonstrating the complete product mission from source to insight/recommendation.

**Required action:** Add `MUR-E2E-001..004` mission scenarios as mandatory release qualification.

---

### MUR-010 — Organization KPI/UI can drift toward generic HR administration

**Severity:** MEDIUM  
**Type:** Product surface drift

Company/personnel/group dashboards include generic inventory-style KPI surfaces. They are operationally useful but can pull design effort away from training targeting and learning outcomes.

**Required action:** For V1, prioritize KPIs connected to training audience, assignment coverage, completion, overdue status, weak areas and learning evidence. Generic HR metrics remain secondary.

---

### MUR-011 — Product KPI thresholds are not yet empirically established

**Severity:** MEDIUM  
**Type:** Measurement gap

Mission metrics can be named, but acceptable thresholds should not be invented without representative data.

**Required action:** Instrument first; derive promotion thresholds from qualification/UAT runs and record them with dataset/environment version.

---

### MUR-012 — Current implementation may contain “demo-safe” UI behavior mistaken for production completion

**Severity:** MEDIUM  
**Type:** Characterization risk

Role switching, demo sessions and state selectors are useful for UI qualification, but production completion requires backend-authenticated data and server-authoritative state transitions.

**Required action:** Keep demo/characterization surfaces only where clearly marked; production E2E must use real auth/session/API/persistence.

## Decision register

| Decision | Status |
|---|---|
| No full rewrite | ACCEPTED |
| Preserve domain-first architecture | ACCEPTED |
| Preserve security/tenant/immutability hard gates | ACCEPTED |
| Freeze new V1 scope during MUR recovery | ACCEPTED for review branch |
| Rescope Organization Management to learning-purpose boundary | PROPOSED / requires merge acceptance |
| Defer HR/ERP adapter ecosystem from V1 | PROPOSED / requires merge acceptance |
| Promote Learner Experience + Learning Insight as mission blockers | PROPOSED / requires merge acceptance |
| Add Mission E2E release gate | PROPOSED / requires implementation |
| Reconcile roadmap and Design Freeze | REQUIRED |

## Closure rule for findings

A finding may close only with direct evidence. Documentation edits alone can close documentation/governance findings, but implementation findings require executable test/runtime evidence.
