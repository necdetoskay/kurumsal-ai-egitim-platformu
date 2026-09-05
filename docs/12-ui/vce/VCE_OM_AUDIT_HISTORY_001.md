# VCE-OM-15 — Denetim Geçmişi / Audit History

Status: APPROVED
Date: 2026-09-05
Canonical visual shorthand: `VCE-OM-15`
Canonical id: `VCE-OM-AUDIT-HISTORY-001`
Visual reference: `VCE-OM-15-Denetim-Gecmisi.png`

## 1. Module
Denetim Geçmişi / Audit History

## 2. Screens
- Audit event list
- Actor/entity/company/action/date filters
- Event detail panel
- Before/After comparison
- Actor/entity/scope/correlation tracing

## 3. Purpose
Provide a tamper-evident operational view of critical Organization Management changes without exposing unsafe raw payloads. The UI is a read model over the canonical audit stream.

## 4. Required event examples
- EMPLOYMENT_TRANSFERRED
- GROUP_RECONCILED
- EMPLOYEE_CREATED
- DEPARTMENT_MOVED
- HR_SYNC_PARTIAL
- COMPANY_PASSIVATED
- GROUP_MEMBERSHIP_ADDED / REMOVED
- ROLE_SCOPE_CHANGED

## 5. Filters
At minimum:
- actor
- entity type
- company/scope
- action
- date range
- result/status

## 6. Event detail
Must show where available:
- event/action type
- timestamp
- actor identity
- target entity
- organization/company/department scope
- correlation id
- source channel (UI/API/import/system)
- result/status
- safe before/after summary

## 7. Business constraints
- Audit rows are never editable or deletable from this UI.
- Before/After presentation is read-only evidence.
- Sensitive values must be redacted according to platform security policy.
- Cross-tenant events must never be visible.
- Scope authorization is mandatory for audit queries.
- Audit records are not the mutable source of truth for domain state.

## 8. Data/API traceability
Primary sources:
- platform audit events
- Organization Management API audit query contract

Related canonical docs:
- `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
- `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
- `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
- `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
- `docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`

## 9. Responsive behavior
- Filters collapse to a drawer on small screens.
- Event list becomes stacked audit cards.
- Detail panel opens as full-screen drawer/page.
- Before/After blocks remain visually distinct but not color-only dependent.

## 10. Approval
Approved through the canonical Organization Management VCE workflow. Any semantic change affecting audit evidence, visibility, filtering, or scope requires VCE revision and traceability review.
