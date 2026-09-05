# Organization Management VCE Index — V1

Status: Canonical validation index
Branch: `design/organization-management-canonical-v1`
Scope: Organization Management visual contracts and their alignment with canonical Intent, Architecture, Data Model, Business Rules and API Contracts.

## 1. Canonical Sources

All Organization Management VCEs MUST conform to:
- `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
- `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
- `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
- `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
- `docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`
- `docs/12-ui/ORGANIZATION_MANAGEMENT_UI_CONTRACT_V1.md`

A VCE may not introduce domain shortcuts that violate these documents.

## 2. Validation Status

| Module | Canonical VCE | Human Ref | Status | Required Canonical Alignment |
|---|---|---|---|---|
| Company Management | `VCE_OM_COMPANY_002.md` | `VCE-OM-02` | VALIDATED | Company lifecycle, no hard delete after historical use, organization scope |
| Department Management | `VCE_OM_DEPARTMENT_001.md` | `VCE-OM-03` | VALIDATED WITH GUARDS | Recursive tree, same-company parent, cycle prevention, passivation |
| Personnel Management | `VCE_OM_PERSONNEL_001.md` | `VCE-OM-04` | VALIDATED WITH REQUIRED FLOW | Employee and User distinction; assignment changes MUST use Employment change flow, not overwrite company/department/position |
| Groups Management | `VCE_OM_GROUPS_001.md` | `VCE-OM-05` | VALIDATED | MANUAL/DYNAMIC/SYSTEM distinction, multi-company membership, temporal membership removal |
| Position Management | `VCE_OM_POSITION_001.md` | `VCE-OM-06` | VALIDATED WITH LIFECYCLE CHANGE | Position is catalog entity; lifecycle action is Passivate, not hard Delete after use |
| Location Management | — | `VCE-OM-07` | MISSING CONTRACT | Must be created from canonical OM-14 rules |
| Organization Overview | — | `VCE-OM-08` | MISSING CONTRACT | Must be created/reviewed from canonical OM-02 rules |
| First-Run Setup | — | — | MISSING VISUAL/VCE | Required by OM-01 |
| Employee Detail | — | — | MISSING VISUAL/VCE | Required by OM-07; employment history first-class |
| Change Assignment | — | — | MISSING VISUAL/VCE | Required by OM-08; temporal close-and-create flow |
| Group Detail | — | — | MISSING VISUAL/VCE | Required by OM-11 |
| Dynamic Group Builder | — | — | RESERVED / DEFERABLE | Required only when dynamic groups enabled |
| Employee Import | — | — | MISSING VISUAL/VCE | Required by OM-15 |
| Integrations | — | — | MISSING VISUAL/VCE | Required by OM-16 |
| Audit History | — | — | MISSING VISUAL/VCE | Required by OM-17 |
| Training Audience Selector | — | — | MISSING VISUAL/VCE | Shared assignment component, OM-18 |

## 3. Canonical Corrections Applied to Existing Visual Language

The existing approved visual direction remains valid: dark navy sidebar, light content canvas, blue/purple primary actions, KPI cards, dense but readable tables, contextual detail/help panels, responsive admin-first layout.

However the following rules are now binding:

### 3.1 No hard-delete language for historical organization data
UI actions MUST use `Passivate`, `Terminate`, `End assignment`, `Remove from group`, or equivalent lifecycle language where history exists.

### 3.2 Employee placement is not edited in-place
Personnel create/edit screens MAY edit person identity/contact data. Company, department, position, location, manager and employment type changes MUST use `Change assignment` flow backed by Employment history.

### 3.3 Employee and User are visually distinct
Account/login status MUST be shown separately from employee lifecycle status.

### 3.4 Group membership removal preserves history
Manual group membership UI must say `Remove from group`; it may not present membership history as physically deleted.

### 3.5 Organization tree guardrails are visible
Department move/create controls must prevent cross-company parent selection and recursive cycle creation.

### 3.6 Scope is explicit
Company-, department- or organization-scoped management surfaces must make effective scope visible where authorization context matters.

## 4. Required Visual Completion Order

To complete VCE canonicalization, remaining work proceeds in this order:

1. `VCE-OM-07` — Location Management
2. `VCE-OM-08` — Organization Overview
3. OM-01 — First-Run Organization Setup
4. OM-07 — Employee Detail
5. OM-08 — Change Employee Assignment
6. OM-11 — Group Detail
7. OM-15 — Employee Import
8. OM-16 — Integrations
9. OM-17 — Audit History
10. OM-18 — Training Audience Selector

Dynamic Group Builder may be deferred until the feature is enabled, but its route/information architecture remains reserved.

## 5. VCE Approval Rule

A visual becomes canonical only when all are true:
1. visual is approved by product owner,
2. module/screens/VCE identifier are explicitly recorded,
3. matching VCE contract exists in `docs/12-ui/vce/`,
4. contract references canonical domain/API rules,
5. no unresolved conflict with business rules remains,
6. visual asset/reference is preserved in repository or traceable by generation/reference metadata.

## 6. Current VCE Gate

Organization Management VCE stage is **NOT YET COMPLETE**.

Existing VCEs are reusable and mostly aligned, but canonical closure requires the missing screens above and explicit correction of lifecycle/employment semantics before Design Freeze.
