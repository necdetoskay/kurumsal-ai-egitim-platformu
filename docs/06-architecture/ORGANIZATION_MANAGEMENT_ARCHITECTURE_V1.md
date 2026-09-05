# Organization Management Architecture V1

**Status:** CANONICAL DRAFT  
**Branch:** `design/organization-management-canonical-v1`  
**Intent:** `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`  
**Version:** 1.0  

## 1. Purpose

This document defines the canonical architecture for Organization Management in the Kurumsal AI Eğitim Platformu. It translates the approved intent into bounded contexts, aggregate boundaries, ownership rules, service responsibilities, consistency rules, integration boundaries, and principal workflows.

The architecture must support multi-company organizations, recursive department trees, employee/employment separation, positions, locations, manual/dynamic/system groups, scoped authorization, external HR identities, auditability, and training targeting at multiple organizational levels.

## 2. Architectural Boundary

Organization Management is a dedicated domain capability and MUST NOT be treated as a sub-feature of User Management.

```text
Tenant Security Boundary
        |
        v
Organization Management Context
        |
        +-- Organization
        +-- Company
        +-- Department
        +-- Employee
        +-- Employment
        +-- Position
        +-- Location
        +-- Group
        +-- Group Membership
        +-- External Identity
        +-- Organization Audit Events
```

Identity & Access remains a separate context:

```text
Identity & Access Context
        |
        +-- User
        +-- Role
        +-- Role Assignment / Scope
        +-- Authentication / Session
```

Training remains a separate context:

```text
Training Context
        |
        +-- Training
        +-- Assignment
        +-- Completion
        +-- Assessment
```

Organization Management exposes stable references that the Training Context can target without taking ownership of organization entities.

## 3. Context Map

### 3.1 Tenant / Platform Boundary

`tenant_id` is the technical isolation boundary. It is injected from trusted execution context and is not user-selectable domain data.

All Organization Management roots MUST be tenant-scoped.

### 3.2 Organization Management Context

Owns:
- organizations
- companies
- departments
- employees
- employments
- positions
- locations
- groups
- group memberships
- dynamic group rule definitions
- external person identities
- organization-specific audit records/events

Does not own:
- authentication credentials
- application user sessions
- global role definitions
- training content
- exam attempts
- certificates

### 3.3 Identity & Access Context

Owns User identity and authorization decisions. It may reference `employee_id` when a system user corresponds to an employee, but `User != Employee`.

### 3.4 Training Context

May target:
- organization
- company
- department
- group
- employee

The Training Context stores assignment intent and resolved/derived targeting evidence according to its own contract. It MUST NOT mutate Organization Management state.

### 3.5 Integration Context

AD/LDAP, CSV/Excel, HR API, ERP and future HRIS connectors feed Organization Management through an anti-corruption/import layer. Provider payloads MUST NOT directly shape the canonical domain model.

## 4. Aggregate Boundaries

### 4.1 Organization Aggregate

**Root:** `Organization`

Responsibilities:
- business-level organization identity
- lifecycle state
- organization code/name uniqueness within tenant
- top-level policy defaults that truly belong to organization scope

Organization does NOT directly contain all child collections in-memory. Companies, groups, positions and other high-cardinality entities are independently persisted and referenced by `organization_id`.

### 4.2 Company Aggregate

**Root:** `Company`

Responsibilities:
- company identity and lifecycle
- legal/operational metadata
- organization ownership

Invariant:
- company belongs to exactly one Organization
- company cannot cross tenant boundary

### 4.3 Department Aggregate

**Root:** `Department`

Responsibilities:
- department identity
- recursive hierarchy
- ordering/lifecycle
- company ownership

Key invariants:
- every department belongs to exactly one company
- `parent_department_id` is nullable
- parent and child MUST belong to the same company
- department tree MUST be acyclic
- a department cannot parent itself
- hard-delete is prohibited once referenced historically

Tree traversal MAY use recursive CTEs or a closure/materialized strategy later, but V1 canonical model remains adjacency-list based unless benchmark evidence requires otherwise.

### 4.4 Employee Aggregate

**Root:** `Employee`

Represents the person record inside an organization. It does not own current company/department/position state as mutable scalar fields.

Responsibilities:
- person identity
- organization ownership
- core profile data
- lifecycle
- employment history linkage
- external identity linkage

Invariant:
- employee belongs to one Organization business boundary
- Employee and User are independent concepts

### 4.5 Employment Aggregate

**Root:** `Employment`

Represents a time-bound organizational assignment of an Employee.

Responsibilities:
- company assignment
- department assignment
- position assignment
- location assignment
- manager relationship
- employment type
- primary/non-primary assignment
- valid time range

Core rule:
- organizational movement creates/closes Employment records; historical Employment rows are not overwritten to simulate movement.

Invariants:
- employee, company, department, position and location references MUST be compatible with the same tenant/organization scope
- department MUST belong to referenced company when set
- only allowed overlapping active employments are those explicitly supported by business rules
- only one active primary employment per employee unless future policy explicitly versions this rule

### 4.6 Position Aggregate

**Root:** `Position`

Responsibilities:
- reusable position/title identity
- level/rank metadata
- managerial flag
- organization or company scope where applicable

Position is not a Department. A position can be used by multiple employments where policy allows.

### 4.7 Location Aggregate

**Root:** `Location`

Responsibilities:
- physical/operational work location
- organization/company ownership
- type (office, site, warehouse, factory, region, etc.)
- address metadata
- lifecycle

Location is not a Department and MUST remain independently assignable.

### 4.8 Group Aggregate

**Root:** `Group`

Group types:
- MANUAL
- DYNAMIC
- SYSTEM

Responsibilities:
- group identity
- membership strategy
- lifecycle
- rule definition reference for dynamic groups

A Group is not part of the organization hierarchy. It is an orthogonal targeting/segmentation construct.

### 4.9 Group Membership Aggregate / Entity

Represents temporal membership of an Employee in a Group.

Responsibilities:
- employee membership
- source type
- valid_from / valid_until
- who/what added the member

Membership history MUST be preserved. Removing a member closes membership instead of deleting historical evidence.

## 5. Application Services

Recommended logical services; these are architectural responsibilities, not mandatory process boundaries.

### OrganizationService
- create/update organization
- lifecycle transitions
- tenant-scope validation

### CompanyService
- create/update/deactivate company
- validate organization ownership

### DepartmentService
- create/update/move/deactivate department
- validate same-company parent
- cycle detection
- hierarchy queries

### EmployeeService
- create/update/deactivate employee
- query employee profile
- attach/detach external identities through integration workflow

### EmploymentService
- assign employee
- transfer company/department/position/location
- change manager
- close employment
- enforce primary assignment rules

### PositionService
- create/update/deactivate position
- position level / managerial semantics

### LocationService
- create/update/deactivate location

### GroupService
- create/update/deactivate group
- add/remove manual members
- manage dynamic rule definition
- rebuild/evaluate dynamic membership

### OrganizationQueryService
Read-optimized projections for:
- organization dashboard
- company summary
- department tree
- personnel list
- personnel detail
- group detail
- position summary
- location summary

Writes MUST go through domain/application commands; query projections are not write models.

## 6. Authorization Architecture

Authorization is evaluated by Identity & Access against Organization Management resource scope.

Canonical scope types:
- TENANT
- ORGANIZATION
- COMPANY
- DEPARTMENT

Future scope types may be added only if a real authorization need exists.

Example:

```text
User
  Role: HR_MANAGER
  Scope: COMPANY / Kent Konut A.Ş.
```

This user may manage employees within that company subject to business policy, but must not automatically gain access to sibling companies.

Authorization MUST be checked server-side. UI visibility is not a security boundary.

## 7. Training Targeting Integration

Organization Management exposes stable identifiers and lifecycle metadata. Training Assignment targets use a typed reference pattern:

```text
target_type = ORGANIZATION | COMPANY | DEPARTMENT | GROUP | EMPLOYEE
target_id   = UUID
```

Rules:
- target reference must be valid for the tenant
- assignment history must not be invalidated when a target later becomes passive
- Training Context decides whether audience is dynamically resolved or snapshotted according to its own contract
- Organization Management does not create training assignments

## 8. Integration Architecture

External providers enter through a normalized import pipeline:

```text
Provider
  -> Connector Adapter
  -> Staging / Validation
  -> Identity Match
  -> Canonical Command(s)
  -> Organization Domain
  -> Audit / Sync Evidence
```

Supported source categories:
- MANUAL
- CSV / XLSX
- LDAP
- ACTIVE_DIRECTORY
- HR_API
- ERP

External IDs are stored separately from canonical Employee identity so one employee can be linked to multiple providers.

Provider-specific raw metadata MAY be stored for diagnostics, but canonical behavior must not depend on undocumented provider payload shapes.

## 9. Consistency and Transaction Rules

Strong consistency is required inside a single command when enforcing invariants such as:
- company belongs to organization
- department parent company match
- no hierarchy cycle
- employment scope compatibility
- active primary employment uniqueness
- duplicate active manual group membership prevention

Cross-context workflows should prefer stable references and domain events rather than distributed transactions.

## 10. Domain Events

Expected event vocabulary:
- OrganizationCreated
- OrganizationDeactivated
- CompanyCreated
- CompanyDeactivated
- DepartmentCreated
- DepartmentMoved
- DepartmentDeactivated
- EmployeeCreated
- EmployeeDeactivated
- EmploymentStarted
- EmploymentChanged
- EmploymentEnded
- PositionCreated
- PositionDeactivated
- LocationCreated
- LocationDeactivated
- GroupCreated
- GroupDeactivated
- GroupMemberAdded
- GroupMemberRemoved
- DynamicGroupRebuilt
- ExternalIdentityLinked
- ExternalIdentityUnlinked

Events must be tenant-scoped and include actor/correlation metadata where available.

## 11. Audit Architecture

Critical mutations produce immutable audit evidence including:
- tenant_id
- organization_id where applicable
- actor_user_id / system actor
- entity_type
- entity_id
- action
- before snapshot or relevant diff
- after snapshot or relevant diff
- source
- correlation_id
- occurred_at

Audit storage may be implemented as append-only table/event stream, but mutation history must not depend solely on application logs.

## 12. Deletion and Lifecycle Strategy

Default strategy is lifecycle transition, not hard delete.

Hard delete is only acceptable for records that:
- were never externally referenced
- have no historical business/audit significance
- are explicitly allowed by business rules

Otherwise use ACTIVE/PASSIVE/ENDED semantics.

## 13. Query and Index Strategy

The data design phase MUST define indexes for at least:
- tenant scoping
- organization/company lookup
- department tree traversal
- active employment by employee
- active employees by company/department/position/location
- group membership lookup
- dynamic group evaluation fields
- external identity provider + external_id
- audit entity timeline

Exact index syntax belongs to the Data Model document, not this architecture document.

## 14. API Boundary Principles

APIs should follow task-oriented resources and commands rather than exposing database tables one-to-one.

Examples:
- `POST /organizations`
- `POST /companies`
- `POST /departments`
- `POST /departments/{id}/move`
- `POST /employees`
- `POST /employees/{id}/employments`
- `POST /employments/{id}/close`
- `POST /groups/{id}/members`
- `DELETE /groups/{id}/members/{employeeId}` as semantic membership close, not necessarily physical delete

Exact request/response schemas are deferred to the API/Contracts stage.

## 15. UI / VCE Relationship

VCE is a presentation contract over this architecture.

UI MUST NOT introduce domain concepts that do not exist canonically without an intent/architecture update when material.

Examples:
- Company screen maps to Company aggregate and derived employee counts
- Department tree maps to Department hierarchy
- Personnel screen maps Employee + Employment projection
- Groups screen maps Group + GroupMembership
- Position screen maps Position + assignment projections
- Location screen maps Location + employment projections

## 16. Non-Goals for V1

Not canonical in V1 unless separately promoted:
- payroll
- salary/compensation
- leave/attendance management
- performance appraisal
- recruitment/ATS
- full HRIS replacement
- arbitrary organization graph beyond company/department hierarchy
- cross-tenant employee identity

## 17. Architecture Decision Summary

Canonical decisions:
1. Tenant and Organization are separate concepts.
2. Organization Management is a dedicated bounded context.
3. Employee and User are separate.
4. Employee and Employment are separate.
5. Department uses recursive same-company hierarchy.
6. Position and Location are independent domain entities.
7. Groups are orthogonal to hierarchy and support manual/dynamic/system types.
8. Historical employment and membership evidence is temporal, not overwritten.
9. Authorization is role + scope and server-enforced.
10. Training targets organization entities through typed stable references.
11. External HR/AD data enters through an anti-corruption/import layer.
12. Critical mutations are auditable.

## 18. Next Canonical Artifact

The next document MUST be the Organization Management Domain/Data Model V1 and must concretize:
- tables/entities
- PK/FK constraints
- unique constraints
- temporal constraints
- indexes
- delete/lifecycle behavior
- organization/company scope validation
- dynamic group rule storage
- external identity storage

Any contradiction discovered in the Data Model phase must be resolved here or in the Intent before the model is marked canonical.
