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

The V1 purpose requires the learner to receive an assignment, consume training, resume progress, complete assessment, see result/retake/certificate and consume bounded learning insight. The learner experience issue remains a direct blocker and current `main` web surfaces contain substantial shell/state-contract behavior rather than a fully demonstrated real API/DB flow.

**Required action:** Prioritize #48 after baseline reconciliation and prove `assignment -> learning -> resume -> assessment -> result -> certificate` through real persistence and browser/API qualification.

---

### MUR-002 — Learning Insight exists more strongly in design/eval than runtime product evidence

**Severity:** CRITICAL  
**Type:** Differentiator gap

The product vision differentiates itself from a classic LMS through Learning Objective evidence, weak-area detection and recommendation/repeat. Prompt contracts and golden cases exist, but full runtime mission evidence is not yet the same maturity as assessment/learning foundations.

**Required action:** Implement evidence aggregation, bounded inference, abstention, recommendation mapping and learner/admin projections. Treat as V1 release blocker.

---

### MUR-003 — Top-level V1 scope and Organization module freeze disagree on enterprise integrations

**Severity:** HIGH  
**Type:** Scope/change-control inconsistency

The Organization architecture itself is not a full-HRIS design: it explicitly excludes payroll, compensation, leave/attendance, performance appraisal, recruitment and full HRIS replacement. Its training-targeting boundary is well separated from Training ownership.

The inconsistency is narrower but real: top-level `SCOPE.md` places broad enterprise HR integrations in Later, while the Organization canonical design includes AD/LDAP/HR/ERP-ready integration architecture and Phase 5 implemented bounded import/integration contracts.

**Required action:** Preserve accepted/working integration contracts. Do not remove them merely to make the documents look smaller. Explicitly amend top-level scope/change-control truth: existing bounded contracts are accepted foundation; **further productization/connector ecosystem expansion is deferred** unless required by a concrete V1 deployment.

---

### MUR-004 — Audience bridge exists but is not in the current `main` baseline

**Severity:** HIGH  
**Type:** Integration / baseline gap

Phase 6 #68 is completed on `design/organization-management-canonical-v1`. PR #104 merged into that branch and implements typed audience persistence, deterministic resolution, overlap deduplication, stable fingerprint/snapshot, explicit unlinked Employee -> User handling, preview and idempotent confirm/handoff. The branch is currently ahead of `main`, so the mission-critical bridge exists but is not part of the inspected default product baseline.

**Required action:** Integrate/rebase/qualify the Organization canonical branch against `main` before reimplementing audience functionality. Do not duplicate #68.

---

### MUR-005 — Legacy roadmap looked active beside the canonical backend-first roadmap

**Severity:** HIGH -> MITIGATED IN PR #106  
**Type:** Canonical governance drift

`docs/10-sprints/BACKEND_FIRST_SPRINT_ROADMAP_V1.md` and `docs/18-sprints/SPRINT_ROADMAP_V1.md` described materially different sprint order/meaning. `DESIGN_FREEZE_v1.md` already identified the Backend-First roadmap as canonical, so the ambiguity was documentation governance rather than an unresolved architecture decision.

**Mitigation:** PR #106 marks `docs/18-sprints/SPRINT_ROADMAP_V1.md` as `SUPERSEDED / HISTORICAL BASELINE` and updates `START_HERE.md` to point coding agents to the Backend-First roadmap plus the AEGIS MUR recovery overlay.

**Closure evidence required:** merge PR #106.

---

### MUR-006 — Design Freeze status and implementation history were inconsistent

**Severity:** HIGH -> MITIGATED IN PR #106  
**Type:** Governance drift

Global `DESIGN_FREEZE_v1.md` was still labelled `Design Freeze Candidate` even though implementation proceeded. The Organization-specific freeze document also uses candidate wording while later declaring the design frozen for implementation.

**Mitigation:** PR #106 amends global Design Freeze to `ACTIVE BASELINE — LIMITED REOPEN UNDER AEGIS MUR #105`, declares `main` the release baseline, preserves hard invariants, and limits the reopened scope to mission/governance reconciliation.

**Remaining:** when Organization canonical work is promoted, reconcile the Organization-specific freeze artifact as part of the promotion PR.

---

### MUR-007 — Canonical truth is split across `main` and an unintegrated Organization branch

**Severity:** HIGH  
**Type:** Branch/canonical truth drift

Investigation found `design/organization-management-canonical-v1` ahead of `main` by 34 commits. It contains the Organization intent, architecture, business rules, API contract, VCE index, governance traceability, persistence/domain/API/UI implementation and training-audience work that Epic #56 references. Therefore the earlier apparent “missing documents” are not lost; they live on a separate canonical branch.

**Risk:** `main` says one thing while active/closed issues and the Organization branch say another. Agents starting from the default branch cannot reconstruct the actual project state.

**Required action:** Use `main` as the single V1 release baseline and treat `design/organization-management-canonical-v1` as an integration source. Review the 34-commit delta against MUR, qualify it, then promote accepted work via reviewed PR.

---

### MUR-008 — “Merged” is branch-relative; closure evidence must name the target baseline

**Severity:** HIGH  
**Type:** Evidence governance

PR #99 (Phase 5 import/integrations/audit) and PR #104 (Phase 6 audience integration) are genuinely merged, but their base is `design/organization-management-canonical-v1`, not `main`. Their issue closures are therefore supported by real branch-level implementation evidence, yet they do not prove default-branch product completion.

**Required action:** Mandatory closure tuple becomes:

`issue -> PR -> target branch -> merge commit -> canonical docs -> tests/runtime evidence -> promoted V1 baseline`

A branch-local merge is valid evidence, but V1 completion additionally requires inclusion in the declared release baseline.

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

---

### MUR-013 — Project entry-point documentation was stale

**Severity:** MEDIUM -> MITIGATED IN PR #106  
**Type:** Discoverability / canonical truth

`START_HERE.md` pointed to many directory names from an older documentation layout, making a clean checkout misleading to new agents.

**Mitigation:** PR #106 replaces the stale reading order with current canonical paths, identifies the Backend-First roadmap, the MUR overlay, `main` release baseline and Organization integration source.

**Closure evidence required:** merge PR #106.

## Decision register

| Decision | Status |
|---|---|
| No full rewrite | ACCEPTED |
| Preserve domain-first architecture | ACCEPTED |
| Preserve security/tenant/immutability hard gates | ACCEPTED |
| `main` is the single V1 release baseline | ACCEPTED in MUR proposal |
| Organization canonical branch is an integration source, not a second release baseline | ACCEPTED in MUR proposal |
| Do not duplicate completed Organization audience work | ACCEPTED |
| Preserve already implemented bounded enterprise-integration contracts | ACCEPTED |
| Freeze further HR/ERP/AD ecosystem expansion during recovery | PROPOSED / requires merge acceptance |
| Promote Learner Experience + Learning Insight as mission blockers | PROPOSED / requires merge acceptance |
| Add Mission E2E release gate | PROPOSED / requires implementation |
| Backend-First roadmap is canonical; docs/18 roadmap is historical | RESOLVED in PR #106 pending merge |
| Global Design Freeze gets limited MUR reopen amendment | RESOLVED in PR #106 pending merge |

## Closure rule for findings

A finding may close only with direct evidence. Documentation edits alone can close documentation/governance findings, but implementation findings require executable test/runtime evidence on the declared V1 baseline.
