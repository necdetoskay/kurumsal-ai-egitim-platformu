# AEGIS MUR — M0 Canonical Truth Reconciliation Evidence

**Status:** In progress  
**Date:** 2026-09-09

## 1. Baseline discovery

Current default `main` commit inspected during MUR:

- `fb36ad1317d300c4c75dd14c76ac2005100d127c`

Organization-related branches discovered:

- `design/organization-management-v1`
- `design/organization-management-canonical-v1`

## 2. Canonical Organization branch delta

Comparison:

`main...design/organization-management-canonical-v1`

Result at review time:

- status: `ahead`
- ahead by: `34 commits`
- behind by: `0`

The branch contains, among other things:

### Canonical docs
- `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
- `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
- `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
- updated `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
- `docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`
- `docs/12-ui/vce/ORGANIZATION_MANAGEMENT_VCE_INDEX_V1.md`
- `docs/13-governance/ORGANIZATION_MANAGEMENT_TRACEABILITY_AND_DESIGN_FREEZE_V1.md`

### Persistence/domain/API
- organization schema and governance schema
- employee/employment schema
- training audience schema
- `packages/organization-management`
- `packages/organization-management-api`

### Web
- organization admin UI/API
- personnel admin UI/API
- group directory admin UI/API
- training audience related UI/API bindings

## 3. PR evidence

### PR #99 — Phase 5

Title: `feat(om): complete import integrations and audit phase (#67)`

- state: closed
- merged: true
- base: `design/organization-management-canonical-v1`
- head: `feat/om-p5-import-sync-audit`
- merge commit: `2cc3cac529d66b4ae14a24bad4285e89be43f988`

Evidence includes CSV/XLSX import contracts, external identity matching, AD/LDAP + HR/ERP anti-corruption contracts, sync/audit/idempotency behavior.

### PR #104 — Phase 6

Title: `feat(om): complete deterministic training audience integration (#68)`

- state: closed
- merged: true
- base: `design/organization-management-canonical-v1`
- head: `feat/om-p6-training-audience`
- merge commit: `dda60deb483cdd4bdb90417ce0e0927a85b347f7`

Evidence includes typed audience targets, deterministic resolver, deduplication, immutable resolution snapshot/member lineage, stable fingerprint, unlinked employee reporting, preview and idempotent confirmation/handoff contracts.

Issue #68 is closed as completed.

## 4. Corrected MUR conclusion

The Organization implementation is **not missing**. The project has a **split-baseline problem**:

- default `main` does not contain the full Organization canonical line,
- Organization epic/issues were executed and closed against a separate canonical branch,
- therefore a new agent reading only `main` receives an incomplete picture of project reality.

This is a governance/integration problem, not evidence of absent engineering work.

## 5. M0 decision required

Choose exactly one:

### Option A — Promote Organization canonical branch

Preferred if the branch remains the accepted product direction.

Required:
1. review 34-commit delta against current purpose baseline,
2. identify MUR scope-drift pieces that should remain dormant rather than deleted,
3. rebase/integrate against the declared baseline,
4. run root build/typecheck/tests/migrations/runtime qualification,
5. run audience -> Learning Assignment integration qualification,
6. merge through a reviewed promotion PR,
7. update Design Freeze/roadmap baseline.

### Option B — Reject branch as V1 baseline

Only valid if product direction has intentionally changed.

Required:
1. explicitly mark branch/docs historical or experimental,
2. reconcile #56 and closed phase issues,
3. preserve valuable reusable commits deliberately,
4. define replacement Organization/audience implementation.

## 6. MUR recommendation

**Option A — Promote and qualify, with scope freeze.**

Reason:

The branch contains substantial tested domain/API/data/UI work and, critically, already implements the mission-required audience bridge. Rebuilding it would create unnecessary rewrite and violate AEGIS Retrofit/MUR principles. Scope correction should constrain **future expansion**, not destructively remove working foundations unless a concrete risk justifies removal.

## 7. Remaining M0 checklist

- [x] Find Organization canonical source branch.
- [x] Verify #99 merged target branch.
- [x] Verify #104 merged target branch.
- [x] Verify #68 completed.
- [ ] Review canonical branch against MUR Purpose Baseline.
- [ ] Identify hard conflicts with `main` and current project direction.
- [ ] Reconcile the two sprint roadmaps.
- [ ] Reconcile Design Freeze status/version.
- [ ] Define promotion PR and full qualification gates.
- [ ] Declare the single V1 release baseline.
