# VCE — Organization Management — Personnel Detail — V1

Status: APPROVED
Canonical VCE: `VCE-OM-PERSONNEL-DETAIL-001`
Visual shorthand: `VCE-OM-10`
Branch: `design/organization-management-canonical-v1`

## 1. Scope

This contract defines the Personnel Detail experience for Organization Management.

The screen set includes:
- Overview
- Employment History
- Groups
- Trainings
- Assessments
- Certificates
- Activity

## 2. Canonical Domain Rules

- `Employee != Employment`.
- Current company/department/position/location is derived from active employment, not stored as mutable employee identity fields.
- Assignment changes must launch the dedicated assignment-change flow; current employment fields are not overwritten in-place.
- Historical employments remain queryable and are shown chronologically.
- Group memberships are historical and source-aware.
- Employee lifecycle and application account lifecycle are distinct.
- Training, assessment and certificate history must survive employee termination/passivation.

## 3. Header

Required:
- employee full name
- employee number
- employee lifecycle status
- primary action: `Atamayı Değiştir`
- application account/link state visible separately from employee status

## 4. Overview

Show current primary employment projection:
- company
- department
- position
- location
- manager
- employment type
- start date

Show explicit informational copy that assignment changes preserve history.

## 5. Employment History

Chronological rows/timeline with:
- effective start/end dates
- company
- department
- position
- location
- primary flag where relevant

History rows are read-only except through an explicit correction workflow authorized separately.

## 6. Groups

Show active group memberships with:
- group name
- group type: MANUAL / DYNAMIC / SYSTEM
- membership source
- valid-from

Removal actions must use membership lifecycle semantics, not physical delete semantics.

## 7. Learning Tabs

Trainings, Assessments and Certificates are read models from their owning bounded contexts.
Organization Management does not own those records.

## 8. Activity

Activity tab uses audit/event projections and must show actor, action, timestamp and affected entity/context.

## 9. Visual Direction

Use canonical enterprise admin shell:
- dark navy persistent sidebar
- light canvas
- purple active navigation and primary action
- green active/success badges
- clear tabs
- timeline-first treatment for employment history

## 10. Responsive

On narrow screens:
- identity card stacks vertically
- tabs become horizontally scrollable or compact selector
- current assignment and groups become stacked cards
- employment history remains chronological

## 11. Source of Truth

This VCE must remain aligned with:
- `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
- `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
- `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
- `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
- `docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`

Any later UI change that permits direct overwrite of historical placement is a contract violation.
