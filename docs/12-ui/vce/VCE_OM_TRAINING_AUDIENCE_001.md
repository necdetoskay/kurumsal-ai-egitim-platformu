# VCE — Training Audience Selector — V1

Status: APPROVED
Canonical ID: `VCE-OM-TRAINING-AUDIENCE-001`
Visual shorthand: `VCE-OM-16`
Branch: `design/organization-management-canonical-v1`

## 1. Purpose

Provide a shared audience-selection surface for training assignment that combines multiple organization target types while preserving deduplication, scope integrity and auditable assignment expansion.

## 2. Supported Audience Types

- ORGANIZATION
- COMPANY
- DEPARTMENT
- GROUP
- EMPLOYEE

## 3. Required Screens / States

- audience type selector
- searchable target picker
- selected audience summary
- estimated learner count
- overlap/deduplication summary
- confirmation action

## 4. Canonical Behavior

- A training assignment may combine multiple target types.
- The UI must display the estimated number of unique learners before confirmation.
- Overlapping targets must be deduplicated by employee identity.
- The UI must explain overlap rather than silently double-counting.
- Cross-tenant or unauthorized targets must never be selectable.
- Published/committed assignment expansion must be snapshot/audit friendly; later organization changes must not rewrite historical completion evidence.
- Audience selection is not a replacement for authorization scope checks.

## 5. Example Summary

`Kent Konut A.Ş. + Yöneticiler + Bilgi İşlem + 1 personel = 912 benzersiz öğrenci`

## 6. Data / API Traceability

Primary data entities:
- `training_assignment_audiences`
- `organizations`
- `companies`
- `departments`
- `groups`
- `group_memberships`
- `employees`
- `employments`

API responsibility:
- target search/lookup
- audience validation
- unique learner estimation
- overlap/deduplication analysis
- snapshot-friendly audience resolution

## 7. Visual Contract

Approved visual reference filename:
`VCE-OM-16-Training-Audience-Selector.png`

The approved composition includes:
- target-type tabs,
- left-side searchable picker,
- right-side selected-target summary,
- unique learner count,
- overlap/deduplication warning,
- final audience confirmation action.

## 8. Responsive Rule

- target-type tabs may wrap or become horizontally scrollable,
- picker and summary stack vertically on narrow screens,
- selected audience summary remains sticky or easily reachable,
- unique learner and overlap information must remain visible before confirmation.

## 9. VCE Change Policy

Any change that alters supported audience types, deduplication semantics, learner estimation, assignment snapshot semantics or authorization scope requires review against the canonical Intent, Architecture, Data Model, Business Rules and API Contract before this VCE is revised.
