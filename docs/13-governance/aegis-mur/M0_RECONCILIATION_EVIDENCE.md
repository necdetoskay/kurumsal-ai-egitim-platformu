# AEGIS MUR — M0 Canonical Truth Reconciliation Evidence

**Status:** CLOSED — reconciled on 2026-09-23  
**Release baseline:** `main`  
**Promotion baseline:** `d0716d4cbd8284d7f5970608ad4cdbb19fc9eb76`  
**Active execution tracker:** #114

## Reconciled truth

The earlier split-baseline condition is resolved. The accepted Organization canonical line and the M1 Organization audience -> Learning Assignment bridge were promoted to `main`. The old statement that Organization exists only on `design/organization-management-canonical-v1` is historical evidence, not current execution truth.

Accepted evidence retained from the earlier reconciliation:
- PR #99 completed Organization import/integration/audit work.
- PR #104 completed deterministic training audience work.
- PR #113 qualified the real PostgreSQL audience -> assignment persistence boundary.
- Promotion PR #107 established the canonical V1 + M1 learning bridge on `main`.

## Current baseline findings

Exact inspection of the promotion baseline shows:
- Organization domain/API/data/web contracts are present.
- Audience -> assignment workflow and PostgreSQL persistence integration are present.
- Production Fastify composition currently exposes readiness endpoints but does not yet register the mission API surface.
- The web shell still contains demo session/data composition and therefore is not production mission evidence.
- Browser mission E2E is not yet a release gate.

These are tracked under #114 and are repaired in M1/M7 rather than misclassified as missing Organization implementation.

## Canonical execution decision

There is exactly one V1 release/integration baseline: `main`.

Execution order during recovery is:
`docs/13-governance/aegis-mur/RECOVERY_ROADMAP_V1.md`

The backend-first roadmap remains architectural/history context, but MUR recovery ordering governs remaining V1 work until the mission release gate is green.

## M0 exit gate

- [x] One declared V1 integration/release baseline: `main`.
- [x] One active MUR execution tracker: #114.
- [x] Organization promotion decision recorded and executed.
- [x] Organization/M1 evidence chain retained.
- [x] Split-baseline language reconciled.
- [x] Remaining runtime gaps moved into the debt register rather than hidden by subsystem test success.

M0 is closed. Proceed to M1 runtime composition and Organization -> Learning mission qualification.
