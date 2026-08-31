# Organization Management UI Contract — V1

Status: Proposed design contract
Date: 2026-08-27
Data source of truth: `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`

## 1. Goal

Organization Management is the administrative foundation that must exist before personnel and training audience management can be reliable.

The UI must make this hierarchy obvious:

```text
Organization
  -> Companies
      -> Department tree
          -> Employees via employment
  -> Positions
  -> Groups
  -> Integrations
```

The experience must work for both a 20-person single company and a multi-company holding with thousands of employees.

## 2. Navigation

Recommended admin navigation group:

```text
Organization Management
  Overview
  Companies
  Organization Tree
  Employees
  Groups
  Positions
  Locations
  Integrations
  Audit History
```

`Locations`, `Integrations` and advanced dynamic-group controls may be hidden behind feature readiness in early V1, but routes and information architecture are reserved.

## 3. Screen Set

### OM-01 — First-Run Organization Setup

Purpose: prevent a new customer from landing on an empty employee table before organization structure exists.

Desktop layout:
- left: compact product/organization identity area,
- center: setup stepper,
- right: contextual summary/help panel.

Steps:
1. Organization information
2. First company
3. Department structure
4. Positions
5. Add employees
6. Optional groups
7. Ready summary

Employee import choices on step 5:
- manual entry,
- CSV/Excel import,
- integration (shown as available/coming later according to capability).

Primary action: `Continue`
Secondary action: `Save and exit`

### OM-02 — Organization Overview

Purpose: executive/HR operational overview rather than a generic settings page.

Header:
- organization name,
- active/passive status,
- organization code,
- `Edit organization` action.

Metric cards:
- companies,
- active employees,
- departments,
- active groups.

Main content:
- company distribution card,
- employee distribution by company,
- recent organizational changes timeline,
- setup/completeness warnings,
- quick actions.

Quick actions:
- Add company
- Add employee
- Create group
- Import employees

### OM-03 — Companies

Purpose: manage multi-company structure.

Primary view: data table with optional card summary above it.

Columns:
- company name,
- code,
- employee count,
- department count,
- status,
- last updated,
- actions.

Filters:
- status,
- search.

Actions:
- Add company
- Open company
- Edit
- Passivate

No hard-delete action after historical use.

### OM-04 — Company Detail

Header:
- company name/legal name,
- code,
- status,
- organization breadcrumb.

Tabs:
1. Overview
2. Departments
3. Employees
4. Groups affecting this company
5. Activity

Overview cards:
- active employees,
- departments,
- managers,
- active training assignments.

### OM-05 — Organization Tree / Departments

This is the primary structural management screen.

Desktop composition:
- left pane: company selector + recursive department tree,
- center/right pane: selected department detail,
- optional right drawer for create/edit/move actions.

Tree node shows:
- department name,
- employee count,
- status indicator,
- expand/collapse,
- context menu.

Selected department panel:
- name/code,
- parent,
- company,
- manager if available,
- direct employee count,
- child unit count,
- active training audience usage.

Actions:
- Add child department
- Edit
- Move
- Passivate

Move interaction must prevent selecting a department from another company and must prevent cycles.

### OM-06 — Employees

Purpose: central employee management, not user-account management.

Top actions:
- Add employee
- Import
- Export

Filters:
- company,
- department,
- position,
- group,
- employment status,
- location,
- search.

Columns:
- employee,
- employee no,
- primary company,
- department,
- position,
- groups count,
- status,
- actions.

Important visual distinction:
- employee record,
- application login/account state.

These must not be presented as the same thing.

### OM-07 — Employee Detail

Header:
- avatar/initials,
- full name,
- employee number,
- employment status,
- account/link state.

Tabs:
1. Overview
2. Employment History
3. Groups
4. Trainings
5. Assessments
6. Certificates
7. Activity

Overview:
- current primary company,
- department,
- position,
- manager,
- location,
- hire date,
- contact information.

Employment History:
- chronological timeline/table,
- start/end dates,
- company,
- department,
- position,
- location,
- primary indicator.

A company/department/position change uses a dedicated `Change assignment` flow rather than directly overwriting current fields.

### OM-08 — Change Employee Assignment

Modal or focused page depending on complexity.

Fields:
- effective date,
- company,
- department,
- position,
- location,
- manager,
- employment type,
- primary assignment flag.

Review section before save:
- old assignment closes on date X,
- new assignment begins on date Y.

The UI must communicate that history will be preserved.

### OM-09 — Groups

Purpose: manage cross-cutting learning audiences.

Tabs or filter:
- Manual
- Dynamic (when enabled)
- System

Group cards/table show:
- name,
- type,
- member count,
- companies represented,
- active training assignments,
- status.

Primary action: `Create group`

### OM-10 — Create/Edit Manual Group

Fields:
- name,
- description,
- status.

Member selection area:
- search employees,
- filter by company/department/position,
- multi-select,
- selected members side panel.

The UI must allow employees from different companies/departments in the same group.

### OM-11 — Group Detail

Header:
- group name,
- MANUAL/DYNAMIC/SYSTEM badge,
- member count,
- status.

Tabs:
1. Members
2. Training Assignments
3. Rules (dynamic groups only)
4. History

Members table:
- employee,
- company,
- department,
- position,
- membership source,
- valid from,
- action.

Removing a member is presented as `Remove from group`, not delete record.

### OM-12 — Dynamic Group Rule Builder

May be deferred from initial UI release, but contract reserved.

Rule builder examples:
- Position is managerial
- Hire date is within last 90 days
- Company equals X AND department equals Y

UI pattern:
- field,
- operator,
- value,
- AND/OR grouping,
- live estimated member count,
- preview members before activation.

### OM-13 — Positions

Table:
- position name,
- code,
- level,
- managerial flag,
- employee count,
- status.

Actions:
- Add position
- Edit
- Passivate

### OM-14 — Locations

Table/card hybrid:
- name,
- type,
- company scope,
- address,
- employee count,
- status.

Useful for HQ/site/warehouse/factory/regional work structures.

### OM-15 — Employee Import

Wizard:
1. Select source/file
2. Map columns
3. Validate
4. Resolve conflicts
5. Preview changes
6. Import result

Conflict examples:
- existing employee number,
- existing external identity,
- unknown company,
- unknown department,
- invalid manager reference.

No import should silently overwrite employment history.

### OM-16 — Integrations

Cards:
- Manual
- CSV/Excel
- Active Directory / LDAP
- HR API
- ERP

Each integration card shows:
- connection status,
- last sync,
- imported employees,
- errors/warnings,
- configure/sync action.

### OM-17 — Organization Audit History

Filters:
- actor,
- entity type,
- company,
- action,
- date range.

Timeline/table displays:
- who,
- what changed,
- entity,
- before/after summary,
- timestamp.

### OM-18 — Training Audience Selector

Shared component/screen used during training assignment.

Audience types:
- Entire organization
- Company
- Department
- Group
- Individual employees

Interaction:
- type selector,
- searchable target picker,
- selected audience summary,
- estimated learner count,
- overlap warning/deduplication summary.

Example summary:
`ABC Company + Managers Group + 3 individual employees = 184 unique learners`

Historical assignment expansion must be preserved after publication/assignment.

## 4. First-Run UX Rule

If the tenant has no organization/company structure, navigation to Employees should redirect or guide to setup rather than display a meaningless blank employee-management screen.

Suggested empty state:
`Create your organization structure before adding employees.`

Primary action:
`Start organization setup`

## 5. Shared Components

Organization UI requires these reusable components:
- Organization/company switcher
- Department tree
- Employee picker
- Group picker
- Position picker
- Status badge
- Historical timeline
- Scope badge
- Import stepper
- Before/after change summary
- Audience selector
- Member count preview
- Empty/error/loading/forbidden states

## 6. Responsive Strategy

Desktop is primary for admin management.

Tablet/mobile responsive web:
- department tree becomes drill-down navigation,
- detail pane becomes separate view/drawer,
- dense employee tables prioritize name/company/department/status,
- filters move to a filter drawer,
- bulk member selection remains available with a sticky selection summary.

## 7. Visual Design Direction

The visual language should remain consistent with the existing platform shell but Organization Management should feel operational, calm and structured.

Principles:
- hierarchy is communicated with spacing, indentation and connectors rather than excessive color,
- company identity is visible without turning every company into a different theme,
- statuses use badge + text/icon, never color alone,
- destructive-looking red actions are reserved for truly destructive/security-critical operations; organizational lifecycle actions use `Passivate`,
- history/timeline is a first-class visual pattern,
- data density is balanced with generous page framing and clear grouping.

## 8. Data-to-UI Traceability

| Data entity | Primary UI |
|---|---|
| organizations | OM-01, OM-02 |
| companies | OM-03, OM-04 |
| departments | OM-05 |
| employees | OM-06, OM-07 |
| employments | OM-07, OM-08 |
| positions | OM-13 |
| locations | OM-14 |
| groups | OM-09, OM-10, OM-11 |
| group_memberships | OM-10, OM-11 |
| dynamic_group_rules | OM-12 |
| employee_external_identities | OM-15, OM-16 |
| user_role_assignments | scope-aware controls across admin screens |
| audit events | OM-17 |
| training_assignment_audiences | OM-18 |

## 9. Recommended Visual Mockup Order

Create visual designs in this order so later screens reuse established patterns:
1. OM-02 Organization Overview
2. OM-05 Organization Tree / Departments
3. OM-06 Employees
4. OM-07 Employee Detail
5. OM-09 Groups
6. OM-11 Group Detail
7. OM-03 Companies
8. OM-01 First-Run Setup
9. OM-18 Training Audience Selector
10. OM-15 Employee Import

Once these ten are approved, remaining management screens can inherit the same design system with much lower risk of inconsistency.
