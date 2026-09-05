# Organization Management — Traceability Matrix & Design Freeze V1

Status: DESIGN FREEZE CANDIDATE
Branch: `design/organization-management-canonical-v1`

## 1. Purpose

This document closes the canonical design chain for Organization Management V1 and provides implementation traceability from product intent through architecture, data, business rules, API contracts and VCEs.

Implementation work may begin only from this frozen baseline unless a later approved change explicitly reopens the affected layer.

## 2. Canonical Chain

1. Intent — `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
2. Architecture — `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
3. Domain/Data — `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
4. Business Rules — `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
5. API Contract — `docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`
6. UI Contract — `docs/12-ui/ORGANIZATION_MANAGEMENT_UI_CONTRACT_V1.md`
7. VCE Index — `docs/12-ui/vce/ORGANIZATION_MANAGEMENT_VCE_INDEX_V1.md`

## 3. Traceability Matrix

| Capability | Intent | Architecture / Domain | API / Rule | VCE |
|---|---|---|---|---|
| Organization root | tenant != organization | organizations | organization endpoints + lifecycle | VCE-OM-08, VCE-OM-09 |
| Multi-company | required | companies | company CRUD/passivation | VCE-OM-02 |
| Department hierarchy | recursive same-company tree | departments.parent_department_id | cycle/cross-company guards | VCE-OM-03 |
| Employee identity | employee != user | employees | employee CRUD/account separation | VCE-OM-04, VCE-OM-10 |
| Employment history | employee != employment | employments | close-and-create transfer | VCE-OM-10, VCE-OM-11 |
| Position catalog | separate entity | positions | scoped catalog lifecycle | VCE-OM-06 |
| Locations | separate entity | locations | scoped lifecycle | VCE-OM-07 |
| Groups | cross-cutting audience | groups | MANUAL/DYNAMIC/SYSTEM | VCE-OM-05, VCE-OM-12 |
| Temporal membership | history preserved | group_memberships | valid_until close semantics | VCE-OM-12 |
| Dynamic group rules | reserved | dynamic_group_rules | evaluate/reconcile | feature-gated; builder deferred |
| External identity/import | AD/LDAP/CSV/HR/ERP ready | employee_external_identities / sync jobs | validation, conflict handling, idempotency | VCE-OM-13, VCE-OM-14 |
| Scoped authorization | scoped administration | user_role_assignments | object-level + scope checks | all admin VCEs |
| Audit | mandatory | audit events | actor/entity/scope/before-after | VCE-OM-15 |
| Training audience targeting | ORG/COMPANY/DEPARTMENT/GROUP/EMPLOYEE | training_assignment_audiences | resolve, dedup, snapshot | VCE-OM-16 |

## 4. Frozen Non-Negotiable Decisions

- Tenant and Organization are distinct concepts.
- Employee and User are distinct concepts.
- Employee and Employment are distinct concepts.
- Current placement is derived from Employment; it is not stored as mutable company/department fields on Employee.
- Employment changes preserve history using temporal close-and-create behavior.
- Department hierarchy cannot cross companies and cannot form cycles.
- Group membership history is preserved; removal closes membership validity.
- Historical organization data is passivated/closed rather than hard deleted.
- Training audience overlap is deduplicated by employee identity.
- Historical assignment/completion evidence is not rewritten by later organization changes.
- Tenant and authorization scope are resolved from trusted server context.
- Imports and integrations may not silently overwrite canonical history.
- Audit evidence is mandatory for critical mutations.

## 5. Deferred Without Blocking V1

The following item is explicitly deferred and does not block V1 implementation:
- interactive Dynamic Group Rule Builder VCE and advanced rule-authoring UX.

The underlying domain/API reservation remains part of V1 architecture and must not be implemented with an incompatible shortcut.

## 6. Change Control

After this freeze, a change is classified as follows:

### Class A — UI-only, no semantic impact
May update the affected VCE without reopening Intent/Architecture, provided canonical behavior is unchanged.

### Class B — Contract/domain behavior change
Must reopen Business Rules and API Contract and revalidate affected VCEs.

### Class C — structural/product intent change
Examples: merging Employee and User, removing employment history, changing tenant/organization semantics, changing group model or targeting semantics.

Class C requires Intent review first, then Architecture/Data/Rules/API/VCE revalidation in order.

## 7. Implementation Gate

Implementation issues must reference the relevant canonical documents and VCE IDs.

An issue is not implementation-ready unless it has:
- explicit scope,
- affected entities/tables,
- API endpoints/contracts,
- business-rule acceptance criteria,
- VCE references where UI exists,
- negative/edge-case tests,
- audit/security requirements where applicable.

## 8. Design Freeze Result

Organization Management V1 canonical design is **FROZEN FOR IMPLEMENTATION**.

Next step:
`Epic -> Phase -> Issue decomposition`, followed by implementation in small independently testable slices.
