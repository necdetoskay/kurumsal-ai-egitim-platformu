# Organization Management VCE Index — V1

Status: CANONICAL / VCE GATE COMPLETE
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

## 2. Canonical VCE Inventory

| Module | Canonical Contract | Human Ref | Status |
|---|---|---|---|
| Company Management | `VCE_OM_COMPANY_002.md` | `VCE-OM-02` | VALIDATED |
| Department Management | `VCE_OM_DEPARTMENT_001.md` | `VCE-OM-03` | VALIDATED WITH GUARDS |
| Personnel Management | `VCE_OM_PERSONNEL_001.md` | `VCE-OM-04` | VALIDATED WITH EMPLOYMENT FLOW |
| Groups Management | `VCE_OM_GROUPS_001.md` | `VCE-OM-05` | VALIDATED |
| Position Management | `VCE_OM_POSITION_001.md` | `VCE-OM-06` | VALIDATED WITH LIFECYCLE RULES |
| Location Management | `VCE_OM_LOCATION_001.md` | `VCE-OM-07` | APPROVED |
| Organization Overview | `VCE_OM_OVERVIEW_001.md` | `VCE-OM-08` | APPROVED |
| First-Run Organization Setup | `VCE_OM_FIRST_RUN_SETUP_001.md` | `VCE-OM-09` | APPROVED |
| Employee Detail | `VCE_OM_EMPLOYEE_DETAIL_001.md` | `VCE-OM-10` | APPROVED |
| Change Assignment / Employment Transfer | `VCE_OM_EMPLOYMENT_TRANSFER_001.md` | `VCE-OM-11` | APPROVED |
| Group Detail | `VCE_OM_GROUP_DETAIL_001.md` | `VCE-OM-12` | APPROVED |
| Employee Import | `VCE_OM_EMPLOYEE_IMPORT_001.md` | `VCE-OM-13` | APPROVED |
| Integrations | `VCE_OM_INTEGRATIONS_001.md` | `VCE-OM-14` | APPROVED |
| Audit History | `VCE_OM_AUDIT_HISTORY_001.md` | `VCE-OM-15` | APPROVED |
| Training Audience Selector | `VCE_OM_TRAINING_AUDIENCE_001.md` | `VCE-OM-16` | APPROVED |
| Dynamic Group Builder | reserved by UI contract | — | DEFERRED / FEATURE-GATED |

## 3. Binding UI Rules

### 3.1 No hard delete for historical organization data
UI actions use lifecycle verbs such as `Passivate`, `Terminate`, `End assignment`, and `Remove from group`.

### 3.2 Employee placement is never overwritten in place
Company, department, position, location, manager and employment-type changes use the canonical Employment Transfer flow.

### 3.3 Employee and User remain distinct
Employee lifecycle and application-account/login state are displayed separately.

### 3.4 Group membership is temporal
Removing an employee from a group closes the active membership interval; history remains queryable.

### 3.5 Department hierarchy is guarded
Cross-company parent assignment and recursive cycles are invalid.

### 3.6 Authorization scope is visible and enforced
Organization/company/department scope is not inferred from client-provided identifiers alone.

### 3.7 Training audience overlap is deduplicated
Audience selection reports unique learner count and overlap before confirmation.

## 4. Visual References

Approved visual reference filenames:
- `VCE-OM-07-Lokasyon-Yonetimi.png`
- `VCE-OM-08-Organizasyon-Genel-Bakis.png`
- `VCE-OM-09-First-Run-Organization-Setup.png`
- `VCE-OM-10-Personel-Detayi.png`
- `VCE-OM-11-Atama-Degisikligi.png`
- `VCE-OM-12-Grup-Detayi.png`
- `VCE-OM-13-Personel-Ice-Aktarma.png`
- `VCE-OM-14-Entegrasyonlar.png`
- `VCE-OM-15-Denetim-Gecmisi.png`
- `VCE-OM-16-Training-Audience-Selector.png`

Earlier approved visual references for Company, Department, Personnel, Groups and Position remain valid where they do not conflict with the canonical rules above.

## 5. Deferred Item

Dynamic Group Builder is intentionally deferred from the V1 visual gate. The domain and API reserve dynamic groups and rule evaluation; enabling the interactive rule builder requires a separate VCE review before implementation.

This deferral does not block Organization Management V1 because Groups Management and Group Detail already expose the dynamic/system/manual distinction and read-only rule visibility needed by the current scope.

## 6. VCE Gate Result

Organization Management V1 mandatory VCE coverage is **COMPLETE**.

No unresolved mandatory UI/domain conflict remains.

Next canonical gate:
`Traceability Matrix -> Design Freeze -> Epic / Phase / Issue decomposition`.
