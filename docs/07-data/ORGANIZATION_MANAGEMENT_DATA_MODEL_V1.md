# Organization Management Data Model V1

**Status:** CANONICAL DRAFT  
**Version:** 1.0  
**Bounded Context:** Organization Management  
**Depends on:** `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`, `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`

## 1. Purpose

This document defines the canonical relational data model for Organization Management. It fixes entity boundaries, PK/FK rules, uniqueness constraints, temporal-history rules, indexes, lifecycle behavior, and delete semantics before API and implementation work.

Canonical hierarchy:

`Tenant -> Organization -> Company -> Department Tree`

Canonical person placement model:

`Employee -> Employment -> Company / Department / Position / Location`

Groups are orthogonal to hierarchy:

`Group <-> GroupMembership <-> Employee`

## 2. Global conventions

- Primary keys use UUID.
- Business tables are tenant-scoped.
- Tenant identity is resolved from authenticated context, never trusted from arbitrary client input.
- Timestamps are stored in UTC.
- Historical relationships use temporal validity rather than destructive overwrite.
- Hard delete is prohibited after historical training, assignment, completion, reporting, audit, or dependent organization data exists.
- Codes are normalized and unique in the smallest valid business scope.
- Foreign keys must never cross tenant boundaries.
- Aggregate counters shown in UI are projections, not mutable source-of-truth columns.

## 3. Core tables

### 3.1 `organizations`

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| name | varchar(200) | required |
| code | varchar(50) | required |
| sector | varchar(120) | nullable |
| default_locale | varchar(20) | required |
| timezone | varchar(64) | required |
| status | enum | ACTIVE / PASSIVE |
| description | text | nullable |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraints:
- `UNIQUE (tenant_id, code)`
- tenant consistency is mandatory for all dependent entities.

Indexes:
- `(tenant_id, status)`
- `(tenant_id, lower(name))`

### 3.2 `companies`

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| organization_id | uuid | FK -> organizations.id, required |
| name | varchar(200) | required |
| legal_name | varchar(250) | nullable |
| code | varchar(50) | required |
| tax_number | varchar(50) | nullable |
| email | varchar(254) | nullable |
| phone | varchar(50) | nullable |
| website | varchar(255) | nullable |
| status | enum | ACTIVE / PASSIVE |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraints:
- `UNIQUE (tenant_id, organization_id, code)`
- company tenant must equal organization tenant.

Indexes:
- `(tenant_id, organization_id, status)`
- `(tenant_id, lower(name))`

Delete behavior:
- organization FK: RESTRICT
- hard delete prohibited after dependent data exists.

### 3.3 `departments`

Recursive company-local hierarchy.

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| company_id | uuid | FK -> companies.id, required |
| parent_department_id | uuid | FK -> departments.id, nullable |
| name | varchar(200) | required |
| code | varchar(50) | required |
| description | text | nullable |
| sort_order | int | default 0 |
| status | enum | ACTIVE / PASSIVE |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraints:
- `UNIQUE (tenant_id, company_id, code)`
- `CHECK (parent_department_id <> id)`
- parent must belong to same tenant and company.
- recursive cycles are prohibited and must be validated transactionally.

Indexes:
- `(tenant_id, company_id, parent_department_id)`
- `(tenant_id, company_id, status)`
- `(tenant_id, company_id, lower(name))`

Delete behavior:
- hard delete prohibited after reference.
- active descendants prevent destructive removal.

### 3.4 `employees`

Represents the person, not the current organizational placement and not the login account.

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| organization_id | uuid | FK -> organizations.id, required |
| employee_no | varchar(80) | nullable |
| first_name | varchar(120) | required |
| last_name | varchar(120) | required |
| email | varchar(254) | nullable |
| phone | varchar(50) | nullable |
| birth_date | date | nullable |
| hire_date | date | nullable |
| termination_date | date | nullable |
| status | enum | ACTIVE / PASSIVE / TERMINATED |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraints:
- employee tenant must equal organization tenant.
- partial unique: `(tenant_id, organization_id, employee_no)` where employee_no is not null.
- e-mail uniqueness is intentionally not globally enforced until HR identity policy is fixed.

Indexes:
- `(tenant_id, organization_id, status)`
- `(tenant_id, organization_id, employee_no)`
- `(tenant_id, lower(last_name), lower(first_name))`
- partial `(tenant_id, lower(email))` where email is not null.

### 3.5 `positions`

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| organization_id | uuid | FK -> organizations.id, required |
| name | varchar(160) | required |
| code | varchar(50) | required |
| level | int | nullable |
| is_managerial | boolean | default false |
| status | enum | ACTIVE / PASSIVE |
| description | text | nullable |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraints:
- `UNIQUE (tenant_id, organization_id, code)`

Indexes:
- `(tenant_id, organization_id, status)`
- `(tenant_id, organization_id, is_managerial)`

### 3.6 `locations`

Physical/operational work location; distinct from department.

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| organization_id | uuid | FK -> organizations.id, required |
| company_id | uuid | FK -> companies.id, nullable |
| name | varchar(180) | required |
| code | varchar(50) | required |
| location_type | enum | OFFICE / SITE / WAREHOUSE / FACTORY / REGION / OTHER |
| country | varchar(80) | nullable |
| city | varchar(120) | nullable |
| district | varchar(120) | nullable |
| address | text | nullable |
| status | enum | ACTIVE / PASSIVE |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraints:
- `UNIQUE (tenant_id, organization_id, code)`
- company, if set, must belong to same organization and tenant.

Indexes:
- `(tenant_id, organization_id, status)`
- `(tenant_id, company_id, location_type)`

### 3.7 `employments`

Temporal employee placement.

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| employee_id | uuid | FK -> employees.id, required |
| company_id | uuid | FK -> companies.id, required |
| department_id | uuid | FK -> departments.id, nullable |
| position_id | uuid | FK -> positions.id, nullable |
| location_id | uuid | FK -> locations.id, nullable |
| manager_employment_id | uuid | FK -> employments.id, nullable |
| employment_type | enum | FULL_TIME / PART_TIME / CONTRACTOR / INTERN / OTHER |
| start_date | date | required |
| end_date | date | nullable |
| is_primary | boolean | default true |
| status | enum | ACTIVE / CLOSED |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraints:
- `CHECK (end_date IS NULL OR end_date >= start_date)`
- employee/company/department/position/location must resolve to same tenant and organization.
- department must belong to selected company.
- manager employment cannot reference itself.
- one active primary employment per employee unless a future explicit multi-primary policy supersedes this rule.

Recommended partial unique index:
- `UNIQUE (tenant_id, employee_id) WHERE is_primary = true AND end_date IS NULL`

Temporal rule:
- company/department/position movement closes the current employment and creates a new row.
- past placement is never overwritten to simulate a move.

Indexes:
- `(tenant_id, employee_id, start_date DESC)`
- `(tenant_id, company_id, department_id, end_date)`
- `(tenant_id, position_id, end_date)`
- `(tenant_id, location_id, end_date)`
- `(tenant_id, manager_employment_id, end_date)`

### 3.8 `groups`

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| organization_id | uuid | FK -> organizations.id, required |
| name | varchar(180) | required |
| code | varchar(50) | required |
| group_type | enum | MANUAL / DYNAMIC / SYSTEM |
| description | text | nullable |
| status | enum | ACTIVE / PASSIVE |
| created_by_user_id | uuid | nullable, Identity context reference |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraints:
- `UNIQUE (tenant_id, organization_id, code)`

Indexes:
- `(tenant_id, organization_id, group_type, status)`
- `(tenant_id, organization_id, lower(name))`

### 3.9 `group_memberships`

Temporal many-to-many relation between group and employee.

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| group_id | uuid | FK -> groups.id, required |
| employee_id | uuid | FK -> employees.id, required |
| source_type | enum | MANUAL / RULE / IMPORT / SYSTEM |
| valid_from | timestamptz | required |
| valid_until | timestamptz | nullable |
| added_by_user_id | uuid | nullable |
| source_reference | varchar(255) | nullable |
| created_at | timestamptz | required |

Constraints:
- group and employee must belong to same tenant and organization.
- `CHECK (valid_until IS NULL OR valid_until > valid_from)`
- duplicate active membership is prohibited.

Recommended partial unique index:
- `UNIQUE (tenant_id, group_id, employee_id) WHERE valid_until IS NULL`

Indexes:
- `(tenant_id, employee_id, valid_until)`
- `(tenant_id, group_id, valid_until)`
- `(tenant_id, source_type)`

Lifecycle:
- removing a member sets `valid_until`; the row is not deleted.

### 3.10 `dynamic_group_rules`

Dynamic rules are versioned and declarative; arbitrary executable expressions are forbidden.

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| group_id | uuid | FK -> groups.id, required |
| rule_version | int | required |
| expression | jsonb | normalized rule AST, required |
| status | enum | DRAFT / ACTIVE / RETIRED |
| created_at | timestamptz | required |
| activated_at | timestamptz | nullable |

Constraints:
- only DYNAMIC groups can have active rules.
- at most one ACTIVE rule version per group.

Index:
- `(tenant_id, group_id, status)`

### 3.11 `employee_external_identities`

Maps canonical employees to external HR/AD/LDAP/ERP identities.

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id, required |
| employee_id | uuid | FK -> employees.id, required |
| provider | enum | MANUAL / CSV / LDAP / ACTIVE_DIRECTORY / HR_API / ERP |
| external_id | varchar(255) | required |
| external_username | varchar(255) | nullable |
| last_sync_at | timestamptz | nullable |
| metadata | jsonb | nullable |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

Constraint:
- `UNIQUE (tenant_id, provider, external_id)`

Indexes:
- `(tenant_id, employee_id)`
- `(tenant_id, provider, external_username)`

## 4. Identity / authorization boundary

`Employee != User`.

Organization Management may reference Identity-context user IDs for actor, creator, and scoped authorization assignments but does not own login credentials.

Canonical scoped-role bridge:

### `user_role_assignments`

- `id uuid PK`
- `tenant_id uuid`
- `user_id uuid`
- `role_id uuid`
- `scope_type enum (TENANT, ORGANIZATION, COMPANY, DEPARTMENT)`
- `organization_id uuid nullable`
- `company_id uuid nullable`
- `department_id uuid nullable`
- `valid_from timestamptz`
- `valid_until timestamptz nullable`

Use explicit nullable FK columns rather than an unprotected generic `scope_id`. Exactly one scope matching `scope_type` must be populated, except TENANT scope where all three are null.

## 5. Training targeting bridge

Training/assignment persistence must support typed audiences:

- ORGANIZATION
- COMPANY
- DEPARTMENT
- GROUP
- EMPLOYEE

Recommended relational structure: `training_assignment_audiences` with one nullable FK column per supported audience type plus a check constraint requiring exactly one matching target.

Target expansion must be snapshot/audit friendly so later organizational changes do not rewrite historical assignment/completion evidence.

## 6. Audit

Organization-management mutations must produce append-only audit evidence containing at least:

- tenant
- actor
- entity type/id
- action
- before/after or equivalent change evidence
- correlation id where applicable
- timestamp

Audit does not replace temporal domain tables. Employment and group-membership history remain first-class domain history.

## 7. FK delete semantics

Default policy:

- Tenant -> Organization: RESTRICT
- Organization -> Company: RESTRICT
- Company -> Department: RESTRICT
- Employee -> Employment: RESTRICT
- Group -> GroupMembership: RESTRICT
- Position/Location -> Employment: RESTRICT
- Department parent relationship: RESTRICT while descendants exist
- ExternalIdentity -> Employee: RESTRICT

Normal lifecycle uses PASSIVE / CLOSED / RETIRED / TERMINATED rather than physical deletion.

## 8. Query projections

Read models may derive:

- organization company counts
- company current employee counts
- department descendant/current employee counts
- current primary employment
- group active member counts
- position employee counts
- location employee counts

These are projections only and never become source-of-truth mutable fields.

## 9. Atomic transaction boundaries

### Employee movement
One transaction must:
1. validate tenant/organization/company/department consistency,
2. close current primary employment,
3. create new employment,
4. write/emit audit and domain event evidence.

### Department re-parent
One transaction must:
1. validate same company,
2. validate no cycle,
3. update parent,
4. emit audit/domain event evidence.

### Group membership change
One transaction must:
1. validate same organization,
2. create or close membership,
3. preserve historical membership,
4. emit audit/domain event evidence.

### Dynamic rule activation
One transaction must:
1. retire previous active version,
2. activate new version,
3. schedule/trigger controlled membership reconciliation.

## 10. Canonical ER overview

```text
Tenant
 └─ Organization
     ├─ Company
     │   ├─ Department ──┐
     │   │      ▲        │ recursive parent
     │   │      └────────┘
     │   └─ Employment ───────── Employee
     │          ├─ Position
     │          └─ Location
     ├─ Position
     ├─ Location
     ├─ Group
     │   ├─ GroupMembership ──── Employee
     │   └─ DynamicGroupRule
     └─ EmployeeExternalIdentity ─ Employee
```

## 11. Non-negotiable invariants

1. No cross-tenant relationship.
2. Department parent remains in the same company.
3. Employment department belongs to employment company.
4. Historical employment is not overwritten to represent movement.
5. Group membership removal closes validity instead of deleting history.
6. Employee and User lifecycles remain separate.
7. UI counters are derived projections.
8. Dynamic group rules are declarative and versioned.
9. Training target references are typed and tenant-scoped.
10. Referential history is preserved for training/reporting/audit evidence.

## 12. V1 minimum implementation set

Required:
- organizations
- companies
- departments
- employees
- employments
- positions
- groups
- group_memberships
- scoped role assignments
- audit integration

Prepared now and may be surfaced incrementally:
- locations
- employee_external_identities
- dynamic_group_rules
- sync jobs

## 13. Next canonical step

After acceptance of this data model, the next document is **Organization Management Business Rules V1**, which will formalize lifecycle transitions, validation behavior, dynamic-group semantics, authorization rules, and training-target expansion behavior.