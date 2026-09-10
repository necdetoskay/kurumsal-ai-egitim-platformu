# VCE-OM-FIRST-RUN-SETUP-001 — First-Run Organization Setup

Status: APPROVED
Visual shorthand: VCE-OM-09
Date: 2026-09-05
Branch: design/organization-management-canonical-v1

## Module
First-Run Organization Setup

## Screens
Seven-step organization setup wizard:
1. Organization
2. First Company
3. Department Structure
4. Positions
5. Employees
6. Optional Groups
7. Ready Summary

## Purpose
Provide a guided first-run flow that prevents administrators from entering employee/training administration before the minimum organization structure exists.

## UX Contract
- Persistent stepper showing current, completed and pending steps.
- `Save and Exit` is available on every non-final step.
- `Continue` advances only when the current step is valid.
- Right-side setup summary/help panel remains visible on desktop.
- Employee step offers manual entry and CSV/Excel import; integration-based import may appear only when capability is available.
- Groups are optional for readiness.
- Final screen communicates training-targeting readiness and any remaining non-blocking warnings.

## Step 1 — Organization
Required fields:
- organization name
- code
- default language
- timezone

Optional:
- sector
- description

Rules:
- tenant is resolved from security context, never selected by user.
- organization code must obey canonical uniqueness rules.

## Step 2 — First Company
Fields align with canonical Company contract.
- company name
- code
- legal name where applicable
- status defaults ACTIVE

At least one active company is required to continue to structural/personnel setup.

## Step 3 — Department Structure
- company selector is fixed to an organization-owned company.
- supports root and nested departments.
- same-company parent rule applies.
- recursive cycles must be prevented.
- setup may continue with a minimal root department structure if product policy permits.

## Step 4 — Positions
- add/edit position catalog entries.
- code uniqueness within organization scope.
- managerial flag and level follow canonical domain rules.

## Step 5 — Employees
Entry methods:
- Manual
- CSV/Excel Import
- Integration source when capability is enabled

Employee identity and employment placement remain separate.
The flow must not write company/department/position directly onto employee identity.

## Step 6 — Groups
Optional.
- create manual groups
- optionally select initial members
- dynamic/system groups are shown only when capability exists

## Step 7 — Ready Summary
Must show at least:
- organization
- active company count
- department count
- position count
- active employee count
- group count
- unresolved warnings

Primary action: enter Organization Overview or continue to Training Administration.

## Canonical Dependencies
- `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
- `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
- `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
- `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
- `docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`
- `docs/12-ui/ORGANIZATION_MANAGEMENT_UI_CONTRACT_V1.md`

## Visual Reference
Approved visual filename: `VCE-OM-09-First-Run-Organization-Setup.png`

## Non-Negotiable Rules
- No hard delete in wizard flows for historically referenced organizational entities.
- Employee != User.
- Employee != Employment.
- Department hierarchy cannot cross company boundaries.
- Setup convenience must never bypass domain/API validation.

## Responsive
Desktop-first. On tablet/mobile the right summary panel becomes a collapsible summary block and the stepper becomes horizontally scrollable or compact drill-down navigation.
