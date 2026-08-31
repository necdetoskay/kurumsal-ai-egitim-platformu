# Organization Management Data Model — V1

Status: Proposed canonical contract
Date: 2026-08-27
Scope: Organization, company, department, employee, employment, position, groups, access scope, integrations and audit

## 1. Purpose

This document defines the relational data contract for organization management in the corporate training platform.

The model must support:
- multiple companies under one organization,
- hierarchical departments,
- employee movement history,
- manual and future dynamic groups,
- training targeting at organization/company/department/group/employee level,
- scoped administration,
- external HR/AD/LDAP identities,
- auditable changes.

## 2. Tenant vs Organization

`tenant` and `organization` are intentionally different concepts.

- `tenant`: technical isolation/security boundary of the SaaS platform.
- `organization`: business-level customer organization/holding/group.

V1 may commonly have one organization per tenant, but the schema does not depend on them being the same concept.

```text
tenant
  └── organization
        ├── company
        │    ├── department tree
        │    └── employment ── employee
        ├── positions
        ├── groups ── group_memberships ── employee
        ├── users / scoped roles
        └── audit events
```

## 3. Core Tables

### 3.1 organizations

Business-level top boundary.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| name | varchar(200) | NOT NULL |
| code | varchar(64) | NOT NULL |
| status | varchar(24) | ACTIVE, PASSIVE |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Constraints:
- UNIQUE `(tenant_id, code)`
- tenant scope is mandatory for every organization query.

### 3.2 companies

A legal or operational company under an organization.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| organization_id | uuid | FK -> organizations.id |
| name | varchar(200) | NOT NULL |
| legal_name | varchar(255) | NULL |
| code | varchar(64) | NOT NULL |
| tax_number | varchar(32) | NULL |
| status | varchar(24) | ACTIVE, PASSIVE |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Constraints:
- UNIQUE `(organization_id, code)`
- referenced organization must belong to the same tenant.

### 3.3 departments

Recursive department/unit tree inside a company.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| company_id | uuid | FK -> companies.id |
| parent_department_id | uuid | FK -> departments.id, NULL allowed |
| name | varchar(200) | NOT NULL |
| code | varchar(64) | NOT NULL |
| status | varchar(24) | ACTIVE, PASSIVE |
| sort_order | integer | default 0 |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Constraints:
- UNIQUE `(company_id, code)`
- parent department must belong to the same company and tenant.
- a department cannot be its own parent.
- recursive cycle creation must be prevented at service/domain level and tested.
- departments with historical references are never hard-deleted; use `PASSIVE`.

### 3.4 employees

Represents the person, independent from current company/department assignment.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| organization_id | uuid | FK -> organizations.id |
| employee_no | varchar(64) | NULL |
| first_name | varchar(120) | NOT NULL |
| last_name | varchar(120) | NOT NULL |
| email | varchar(255) | NULL |
| phone | varchar(64) | NULL |
| hire_date | date | NULL |
| termination_date | date | NULL |
| status | varchar(24) | ACTIVE, PASSIVE, TERMINATED |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Recommended constraints:
- UNIQUE `(organization_id, employee_no)` where `employee_no IS NOT NULL`.
- normalized email uniqueness should only be enforced if customer identity rules require it.

Important:
- `company_id` and `department_id` do not live on this table.
- organizational placement belongs to `employments`.

### 3.5 positions

Normalized title/position catalog.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| organization_id | uuid | FK -> organizations.id |
| name | varchar(160) | NOT NULL |
| code | varchar(64) | NOT NULL |
| level | integer | NULL |
| is_managerial | boolean | default false |
| status | varchar(24) | ACTIVE, PASSIVE |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Constraint:
- UNIQUE `(organization_id, code)`.

### 3.6 locations

Physical work locations; not the same concept as department.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| organization_id | uuid | FK -> organizations.id |
| company_id | uuid | FK -> companies.id, NULL allowed |
| name | varchar(200) | NOT NULL |
| location_type | varchar(40) | HQ, OFFICE, SITE, WAREHOUSE, FACTORY, REGION, OTHER |
| address | text | NULL |
| status | varchar(24) | ACTIVE, PASSIVE |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

### 3.7 employments

Historical placement of an employee in company/department/position/location.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| employee_id | uuid | FK -> employees.id |
| company_id | uuid | FK -> companies.id |
| department_id | uuid | FK -> departments.id, NULL allowed |
| position_id | uuid | FK -> positions.id, NULL allowed |
| location_id | uuid | FK -> locations.id, NULL allowed |
| manager_employment_id | uuid | FK -> employments.id, NULL allowed |
| employment_type | varchar(40) | FULL_TIME, PART_TIME, CONTRACTOR, INTERN, OTHER |
| start_date | date | NOT NULL |
| end_date | date | NULL |
| is_primary | boolean | default true |
| status | varchar(24) | ACTIVE, ENDED |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Rules:
- department must belong to `company_id`.
- position/location must belong to the same tenant/organization.
- employee must belong to the same organization.
- changing company, department or position creates a new employment row; do not overwrite historical placement.
- the old employment gets `end_date` and `ENDED`.
- overlapping primary employments should be rejected unless explicitly allowed by a future policy.

### 3.8 groups

Cross-cutting training/audience groups independent from organization tree.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| organization_id | uuid | FK -> organizations.id |
| name | varchar(200) | NOT NULL |
| description | text | NULL |
| group_type | varchar(24) | MANUAL, DYNAMIC, SYSTEM |
| status | varchar(24) | ACTIVE, PASSIVE |
| created_by_user_id | uuid | FK -> users.id |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Constraint:
- UNIQUE `(organization_id, name)` unless product later allows duplicate display names.

### 3.9 group_memberships

Historical many-to-many membership relation.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| group_id | uuid | FK -> groups.id |
| employee_id | uuid | FK -> employees.id |
| source_type | varchar(24) | MANUAL, RULE, IMPORT, SYSTEM |
| valid_from | timestamptz | NOT NULL |
| valid_until | timestamptz | NULL |
| added_by_user_id | uuid | FK -> users.id, NULL allowed |
| created_at | timestamptz | NOT NULL |

Rules:
- membership removal sets `valid_until`; row is not deleted.
- only one active membership for the same `(group_id, employee_id)` is allowed.
- group and employee must belong to the same organization and tenant.

Recommended partial unique index:
```sql
CREATE UNIQUE INDEX uq_active_group_membership
ON group_memberships (group_id, employee_id)
WHERE valid_until IS NULL;
```

### 3.10 dynamic_group_rules

Prepared for dynamic groups; UI may be postponed from first release.

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| group_id | uuid | FK -> groups.id |
| field | varchar(120) | NOT NULL |
| operator | varchar(40) | EQ, NEQ, IN, NOT_IN, GT, GTE, LT, LTE, CONTAINS |
| value | jsonb | NOT NULL |
| logical_operator | varchar(8) | AND, OR |
| sort_order | integer | default 0 |

V1 rule evaluation may be deferred, but schema ownership is reserved now.

## 4. User Account Separation

`Employee != User`.

A person may exist in HR/training records without having an application login.

Add or preserve a nullable mapping:

```text
users.employee_id -> employees.id
```

Rules:
- one employee may have zero or one primary login in V1.
- service/system accounts may have no employee.
- employee lifecycle must not automatically delete the user audit identity.

## 5. Scoped Authorization

Recommended role assignment structure:

### user_role_assignments

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| user_id | uuid | FK -> users.id |
| role_id | uuid | FK -> roles.id |
| scope_type | varchar(32) | TENANT, ORGANIZATION, COMPANY, DEPARTMENT |
| organization_id | uuid | FK -> organizations.id, NULL |
| company_id | uuid | FK -> companies.id, NULL |
| department_id | uuid | FK -> departments.id, NULL |
| created_at | timestamptz | NOT NULL |

Use explicit nullable FKs rather than an unenforced generic `scope_id`, so database integrity remains available.

Example:
- COMPANY_ADMIN + `company_id = X`
- HR_MANAGER + `organization_id = Y`
- DEPARTMENT_MANAGER + `department_id = Z`

## 6. External Employee Identities

### employee_external_identities

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| employee_id | uuid | FK -> employees.id |
| provider | varchar(40) | MANUAL, CSV, LDAP, ACTIVE_DIRECTORY, HR_API, ERP |
| external_id | varchar(255) | NOT NULL |
| external_username | varchar(255) | NULL |
| last_sync_at | timestamptz | NULL |
| raw_metadata | jsonb | NULL |
| created_at | timestamptz | NOT NULL |

Constraint:
- UNIQUE `(tenant_id, provider, external_id)`.

This enables the same employee to be linked to AD SID, HR personnel ID and future ERP identity without duplicating the employee record.

## 7. Audit

Use the existing platform audit mechanism. Organization-management changes must emit auditable events for at least:
- company created/updated/passivated,
- department created/moved/passivated,
- employee created/updated/terminated,
- employment started/ended,
- group created/passivated,
- group membership added/removed,
- scoped role assignment changed,
- external sync identity linked/unlinked.

Audit payload must contain actor, tenant, target entity, timestamp and before/after or equivalent change evidence.

## 8. Training Assignment Targeting

Training targeting must support:
- ORGANIZATION
- COMPANY
- DEPARTMENT
- GROUP
- EMPLOYEE

Avoid a single unenforced `(target_type, target_id)` FK pair in the persistence model.

Recommended relational structure:

### training_assignment_audiences

| Column | Type | Key / Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| training_assignment_id | uuid | FK -> training_assignments.id |
| audience_type | varchar(24) | ORGANIZATION, COMPANY, DEPARTMENT, GROUP, EMPLOYEE |
| organization_id | uuid | FK -> organizations.id, NULL |
| company_id | uuid | FK -> companies.id, NULL |
| department_id | uuid | FK -> departments.id, NULL |
| group_id | uuid | FK -> groups.id, NULL |
| employee_id | uuid | FK -> employees.id, NULL |
| created_at | timestamptz | NOT NULL |

Constraint:
- exactly one target FK must be populated, matching `audience_type`.

Assignment expansion to concrete learners must be snapshot/audit friendly so future department/group membership changes do not rewrite historical completion evidence.

## 9. Lifecycle Rules

### Company / Department
- historical records are never hard-deleted.
- use explicit `PASSIVE` lifecycle state.

### Employment
- organizational changes close the old row and create a new row.
- historical employment is immutable except for controlled correction flows.

### Group Membership
- removal sets `valid_until`.
- historical group membership remains queryable.

### Employee
- termination changes lifecycle state; assessment/completion/certificate history remains intact.

## 10. Main Relationship Map

```text
tenants
  |
  +-- organizations
        |
        +-- companies
        |     |
        |     +-- departments --(parent_department_id)--> departments
        |     |
        |     +-- employments -----------------------------+
        |                                                   |
        +-- employees <-------------------------------------+
        |       |
        |       +-- employee_external_identities
        |
        +-- positions
        |
        +-- locations
        |
        +-- groups
              |
              +-- group_memberships --> employees
              |
              +-- dynamic_group_rules

users -- user_role_assignments --> organization/company/department scopes
```

## 11. V1 Minimum Required Tables

Required for V1 implementation:
- organizations
- companies
- departments
- employees
- employments
- positions
- groups
- group_memberships
- user_role_assignments
- audit events integration

Prepared now, UI/automation may follow later:
- locations
- employee_external_identities
- dynamic_group_rules
- sync_jobs

## 12. Required Indexes

At minimum:
- `companies (organization_id, status)`
- `departments (company_id, parent_department_id, status)`
- `employees (organization_id, status)`
- `employments (employee_id, start_date desc)`
- `employments (company_id, department_id, status)`
- partial index for active primary employment
- `groups (organization_id, status)`
- `group_memberships (group_id, valid_until)`
- `group_memberships (employee_id, valid_until)`
- `employee_external_identities (tenant_id, provider, external_id)` unique
- scoped-role indexes based on organization/company/department administration queries.

## 13. Product Consequence

Organization Management becomes a prerequisite for corporate training administration.

Recommended first-run flow:

```text
Organization
  -> First company
  -> Department tree
  -> Positions
  -> Employees
  -> Manual groups (optional)
  -> Training assignment ready
```

All organization-management UI and later training-targeting UI must use this contract as the source of truth.
