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

Canonical scope states V1 is not a full HR system and broad enterprise HR integrations are Later. Organization Management expanded into temporal employment, external identities, imports, AD/LDAP and HR/ERP adapter contracts. These capabilities are implemented on the Organization canonical branch, so MUR must rescope rather than pretend the work does not exist.

**Required action:** Preserve working organization/audience/history/audit foundations. Do not remove already useful code merely to reduce scope. Freeze further HR/ERP expansion; treat HR/ERP and broad AD/LDAP ecosystem work as deferred unless a V1 deployment dependency proves otherwise.

---

### MUR-004 — Audience bridge exists but is not in the current `main` baseline

**Severity:** HIGH  
**Type:** Integration / baseline gap

Phase 6 #68 is completed on `design/organization-management-canonical-v1`. PR #104 merged into that branch and implements typed audience persistence, deterministic resolution, overlap deduplication, stable fingerprint/snapshot, explicit unlinked Employee -> User handling, preview and idempotent confirm/handoff. The branch is currently ahead of `main`, so the mission-critical bridge exists but is not part of the inspected default product baseline.

**Required action:** Integrate/rebase/qualify the Organization canonical branch against the chosen V1 baseline before reimplementing audience functionality. Do not duplicate #68.

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

`DESIGN_FREEZE_v1.md` on `main` still identifies itself as `Design Freeze Candidate`, while many implementation sprints have proceeded and the Organization canonical branch contains its own traceability/design-freeze package.

**Required action:** Reconcile Design Freeze status/version only after selecting the baseline branch and canonical roadmap. The freeze statement must identify exactly which commit/document set it freezes.

---

### MUR-007 — Canonical truth is split across `main` and an unintegrated Organization branch

**Severity:** HIGH  
**Type:** Branch/canonical truth drift

Investigation found `design/organization-management-canonical-v1` ahead of `main` by 34 commits. It contains the Organization intent, architecture, business rules, API contract, VCE index, governance traceability, persistence/domain/API/UI implementation and training-audience work that Epic #56 references. Therefore the earlier apparent “missing documents” are not lost; they live on a separate canonical branch.

**Risk:** `main` says one thing while active/closed issues and the Organization branch say another. Agents starting from the default branch cannot reconstruct the actual project state.

**Required action:** Decide whether `design/organization-management-canonical-v1` is to be promoted into the V1 baseline. If yes, integrate it via a reviewed PR/rebase strategy and run full regression/MUR qualification. If no, explicitly mark it experimental/historical and reconcile all issues that treated it as canonical.

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

## Decision register

| Decision | Status |
|---|---|
| No full rewrite | ACCEPTED |
| Preserve domain-first architecture | ACCEPTED |
| Preserve security/tenant/immutability hard gates | ACCEPTED |
| Do not duplicate completed Organization audience work | ACCEPTED |
| Freeze new V1 scope during MUR recovery | ACCEPTED for review branch |
| Rescope further Organization Management expansion to learning-purpose boundary | PROPOSED / requires merge acceptance |
| Defer further HR/ERP adapter ecosystem expansion from V1 | PROPOSED / requires merge acceptance |
| Promote Learner Experience + Learning Insight as mission blockers | PROPOSED / requires merge acceptance |
| Add Mission E2E release gate | PROPOSED / requires implementation |
| Reconcile `main` vs Organization canonical branch | REQUIRED |
| Reconcile roadmap and Design Freeze | REQUIRED |

## Closure rule for findings

A finding may close only with direct evidence. Documentation edits alone can close documentation/governance findings, but implementation findings require executable test/runtime evidence on the declared V1 baseline.
