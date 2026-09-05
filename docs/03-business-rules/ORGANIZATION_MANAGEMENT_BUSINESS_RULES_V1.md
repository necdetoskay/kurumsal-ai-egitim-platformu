# Organization Management Business Rules — V1

Status: Canonical
Date: 2026-09-05
Depends on:
- `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
- `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
- `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`

## 1. Purpose

This document defines the canonical operational business rules for Organization Management in the Corporate AI Training Platform. It translates the intent, architecture and relational model into explicit rules that application services, APIs, UI/VCE implementations, migrations and tests must obey.

If a future change conflicts with these rules, first review whether the canonical intent must be revised and versioned.

## 2. Rule Precedence

When rules conflict, precedence is:

1. tenant/security isolation
2. canonical intent
3. architecture invariants
4. business rules in this document
5. API/UI convenience

No UI shortcut may bypass a domain invariant.

## 3. Tenant and Organization Boundaries

### BR-OM-001 — Tenant context is mandatory
Every organization-management command and query must execute inside an authenticated tenant context.

### BR-OM-002 — Cross-tenant references are forbidden
A record in one tenant may never reference Organization, Company, Department, Employee, Employment, Position, Location, Group or scoped-role records from another tenant.

### BR-OM-003 — Organization is a business boundary, not the tenant itself
`Tenant` and `Organization` remain separate concepts even when a tenant currently has only one organization.

### BR-OM-004 — Company belongs to exactly one Organization
A Company must have one valid Organization owner and cannot be moved to another Organization by ordinary update. Such a change requires a controlled migration/correction flow.

## 4. Company Rules

### BR-OM-010 — Company code uniqueness
Company code must be unique within its Organization.

### BR-OM-011 — Company passivation is non-destructive
A Company with historical employments, training assignments, completions, certificates or audit references is not hard-deleted. It becomes `PASSIVE`.

### BR-OM-012 — Passive Company cannot receive new active placements
New Employment records cannot be started in a passive Company.

### BR-OM-013 — Passive Company cannot receive new training audience assignments
Historical assignment evidence remains valid, but new assignment targeting to a passive Company is rejected unless an explicit correction/recovery policy says otherwise.

### BR-OM-014 — Company reactivation is explicit
Reactivation must be an auditable command and must not silently reactivate child Departments or Employments.

## 5. Department Rules

### BR-OM-020 — Department belongs to exactly one Company
A Department must remain inside the owning Company.

### BR-OM-021 — Parent Department must share the same Company
`parent_department_id` may reference only a Department from the same tenant and Company.

### BR-OM-022 — Department tree must be acyclic
A Department cannot be its own parent, direct or indirect. Any move that creates a cycle is rejected atomically.

### BR-OM-023 — Department code uniqueness
Department code must be unique within its Company.

### BR-OM-024 — Department move does not rewrite history
Changing a Department's parent changes the current hierarchy only. Historical Employment and training snapshot evidence are not rewritten.

### BR-OM-025 — Passive Department cannot receive new active Employments
Existing active employments must be explicitly moved/ended before policy permits full retirement of a Department.

### BR-OM-026 — Department hard delete is forbidden after reference
Referenced Departments are passivated, not deleted.

### BR-OM-027 — Child handling must be explicit
When passivating a Department with active child Departments, the command must either:
- reject, or
- require explicit child passivation/move actions.

Implicit cascade passivation is not allowed in V1.

## 6. Employee Rules

### BR-OM-030 — Employee represents the person
Company, Department, Position and Location do not define Employee identity; they belong to Employment.

### BR-OM-031 — Employee number uniqueness
When present, `employee_no` must be unique within the Organization.

### BR-OM-032 — Employee lifecycle is independent from login lifecycle
Terminating or passivating an Employee does not delete the related User account or audit identity automatically.

### BR-OM-033 — Employee termination preserves history
Termination must preserve all historical Employment, GroupMembership, training assignment, assessment, completion and certificate evidence.

### BR-OM-034 — Terminated Employee cannot start new active Employment
A terminated Employee must be explicitly reactivated/corrected before a new Employment starts.

### BR-OM-035 — Employee merge is a controlled correction flow
If duplicate employees are detected from imports/integrations, merging them requires explicit lineage, conflict handling and audit evidence. Ordinary CRUD update cannot merge identities.

## 7. Employment Rules

### BR-OM-040 — Organizational placement is temporal
Company/Department/Position/Location changes are represented by ending an old Employment and creating a new one.

### BR-OM-041 — Historical Employment is not overwritten
Except controlled data correction, historical rows are immutable.

### BR-OM-042 — End date validation
`end_date` must be null or greater than/equal to `start_date`.

### BR-OM-043 — Primary Employment overlap is forbidden in V1
An Employee cannot have overlapping active primary Employments unless a future version explicitly allows multi-primary placement.

### BR-OM-044 — Department must belong to Employment Company
If a Department is selected, its Company must equal the Employment Company.

### BR-OM-045 — Position/Location scope must be valid
Position and Location must belong to the same Organization/tenant and must be eligible for the selected Company if company-scoped.

### BR-OM-046 — Manager must be a valid Employment
`manager_employment_id` must point to a valid Employment in the same tenant and Organization, and cannot create a self-management cycle.

### BR-OM-047 — Transfer is atomic
Ending the old Employment and creating the new Employment during transfer/promotion must succeed or fail as one transaction.

### BR-OM-048 — Transfer reason is auditable
Company, Department, Position or Location change commands must record actor, effective date and change reason when provided/required by policy.

## 8. Position Rules

### BR-OM-050 — Position is a normalized catalog entity
Position is not free-text on Employment.

### BR-OM-051 — Position code uniqueness
Position code must be unique within the Organization.

### BR-OM-052 — Managerial flag is classification, not authorization
`is_managerial=true` does not grant application permissions by itself.

### BR-OM-053 — Passive Position cannot be used in new Employment
Historical rows continue to reference it.

### BR-OM-054 — Position level is ordered metadata
If level is used, lower/higher numeric semantics must be consistent platform-wide and documented before dependent dynamic-group rules rely on it.

## 9. Location Rules

### BR-OM-060 — Location is independent from Department
A physical work location cannot be modeled only as a Department.

### BR-OM-061 — Location may be Organization- or Company-scoped
If `company_id` is null, the Location may be organization-wide; otherwise it belongs to that Company.

### BR-OM-062 — Passive Location cannot be used in new Employment
Historical Employment references remain valid.

### BR-OM-063 — Location movement does not imply Department movement
Changing physical location must not silently modify Department.

## 10. Group Rules

### BR-OM-070 — Groups are cross-cutting audiences
Groups are independent from the Company/Department hierarchy.

### BR-OM-071 — Group type is immutable without migration
A `MANUAL`, `DYNAMIC` or `SYSTEM` Group cannot casually switch type because membership semantics differ.

### BR-OM-072 — Manual Groups allow explicit membership changes
Users with sufficient scope may add/remove Employees manually.

### BR-OM-073 — Dynamic Group membership is rule-derived
Manual add/remove cannot override a dynamic rule result in V1 unless an explicit exception mechanism is designed later.

### BR-OM-074 — System Groups are platform-owned
Ordinary organization administrators cannot arbitrarily change system-group semantics.

### BR-OM-075 — Group name uniqueness
Group name must be unique within the Organization in V1.

### BR-OM-076 — Passive Group cannot receive new memberships or assignments
Historical memberships and training snapshots remain queryable.

## 11. Group Membership Rules

### BR-OM-080 — Membership is temporal
Membership removal sets `valid_until`; the row is not deleted.

### BR-OM-081 — One active membership per employee/group
Only one open membership may exist for `(group_id, employee_id)`.

### BR-OM-082 — Group and Employee must share Organization
Cross-organization membership is forbidden.

### BR-OM-083 — Membership source must be preserved
`MANUAL`, `RULE`, `IMPORT` and `SYSTEM` sources must remain distinguishable.

### BR-OM-084 — Membership end cannot precede start
`valid_until >= valid_from` when `valid_until` is set.

### BR-OM-085 — Membership correction is auditable
Backdated corrections require audit evidence and must not silently rewrite unrelated training completion snapshots.

## 12. Dynamic Group Rules

### BR-OM-090 — Dynamic rule evaluation is deterministic
Given the same canonical employee/employment state and rule version, evaluation must produce the same membership result.

### BR-OM-091 — Rules are versioned
Changing a dynamic-group rule creates a new rule version/effective period rather than rewriting historical rule evidence.

### BR-OM-092 — Allowed fields/operators are whitelisted
The UI/API cannot submit arbitrary SQL/expression fragments.

### BR-OM-093 — Rule evaluation failure is fail-safe
A failed evaluation cannot silently remove valid memberships. Failure must be observable and retryable.

## 13. User and Authorization Rules

### BR-OM-100 — Employee and User are separate
An Employee may have zero or one primary User login in V1; service/system Users may have no Employee.

### BR-OM-101 — Role does not define scope alone
Authorization uses `role + explicit scope`.

### BR-OM-102 — Scope cannot exceed actor authority
A user cannot grant another user a role scope broader than the actor's own delegated authority unless they possess platform-level permission.

### BR-OM-103 — Scope integrity is relational
Organization/Company/Department scope references must resolve inside the same tenant.

### BR-OM-104 — Authorization change is audited
Role assignment create/update/revoke actions are mandatory audit events.

## 14. External Identity and Import Rules

### BR-OM-110 — External identity uniqueness
`(tenant, provider, external_id)` identifies at most one Employee.

### BR-OM-111 — Import never bypasses domain validation
CSV/Excel/AD/LDAP/HR/ERP imports pass through the same invariant checks as manual CRUD.

### BR-OM-112 — Source payload is not the source of truth after normalization
Raw external metadata may be stored for evidence/debugging, but canonical Employee/Employment records drive platform behavior.

### BR-OM-113 — Sync conflicts are explicit
Conflicting mappings must enter a review/error state rather than creating duplicate Employees silently.

### BR-OM-114 — Provider outage must not corrupt canonical data
Failed external sync leaves the last valid canonical state intact and records sync failure metadata.

## 15. Training Audience Rules

### BR-OM-120 — Supported audience types
Training targeting supports exactly these V1 types:
- ORGANIZATION
- COMPANY
- DEPARTMENT
- GROUP
- EMPLOYEE

### BR-OM-121 — Exactly one audience FK
Each persisted audience target contains exactly one populated target FK matching `audience_type`.

### BR-OM-122 — Audience target must be active at assignment creation
New assignments cannot target passive/retired entities without an explicit correction policy.

### BR-OM-123 — Assignment expansion is snapshot-friendly
At assignment/publish time, concrete learner eligibility must be recoverable so later organization/group changes do not rewrite historical completion evidence.

### BR-OM-124 — Membership changes affect future/current eligibility by policy, not history
A person leaving a Department/Group may affect future delivery/reminder behavior, but completed historical evidence remains unchanged.

### BR-OM-125 — Duplicate audience overlap must deduplicate learners
If one Employee is reached through Company + Department + Group simultaneously, the platform creates one effective learner assignment unless the training domain explicitly supports separate assignment instances.

## 16. Lifecycle and Deletion Rules

### BR-OM-130 — Referenced business entities use soft lifecycle
Company, Department, Employee, Position, Location and Group use lifecycle states, not hard delete, once referenced.

### BR-OM-131 — Hard delete is allowed only for safe drafts
Hard delete may be permitted only for never-used draft/setup records with no historical/audit dependency and only if implementation policy explicitly supports it.

### BR-OM-132 — Passivation is explicit and audited
No silent cascading state changes.

### BR-OM-133 — Reactivation does not restore child state automatically
Reactivation affects only the selected entity unless an explicit command says otherwise.

## 17. Audit Rules

### BR-OM-140 — Critical commands emit audit evidence
Minimum audit coverage:
- Organization/Company create/update/passivate/reactivate
- Department create/move/passivate/reactivate
- Employee create/update/terminate/reactivate
- Employment start/end/transfer/promotion/correction
- Position/Location create/update/passivate
- Group create/update/passivate
- Group membership add/remove/correction
- scoped-role change
- external identity link/unlink/sync conflict resolution

### BR-OM-141 — Audit identity survives employee termination
Actor User identity/history remains queryable even if linked Employee becomes terminated.

### BR-OM-142 — Audit event must contain context
At minimum: tenant, actor, action, target entity/id, timestamp and change evidence or reason.

## 18. Transaction Rules

### BR-OM-150 — Multi-entity invariants are transactional
Operations such as transfer, department move, group membership replacement and audience creation must be atomic when partial success would violate invariants.

### BR-OM-151 — Concurrency conflicts must be detected
Optimistic locking/version checks or equivalent must prevent lost updates on mutable administrative records.

### BR-OM-152 — Retry must be idempotent where applicable
Import/sync and command retry paths must not create duplicate memberships, employments or audience targets.

## 19. UI/VCE Enforcement Rules

### BR-OM-160 — UI options are scope-filtered
Company, Department, Position, Location, Group and Manager selectors show only valid entities for the current tenant/organization/company and actor scope.

### BR-OM-161 — Invalid cross-scope combinations are blocked before submit
The UI should prevent invalid combinations, but server-side validation remains authoritative.

### BR-OM-162 — Passivation warns about active dependencies
The UI must surface blocking/affected active Employments, child Departments, memberships or assignments before a passivation command.

### BR-OM-163 — Historical records are visible as history, not editable current state
Employment and GroupMembership history must be visually distinguishable from current active state.

## 20. Required Negative Cases

Automated tests must cover at least:

- cross-tenant FK/reference attempt
- Company code duplicate
- Department code duplicate
- Department cross-company parent
- Department cycle
- Employment Department/Company mismatch
- overlapping primary Employment
- Employment for terminated Employee
- active Employment using passive Company/Department/Position/Location
- duplicate active GroupMembership
- membership across Organizations
- invalid dynamic rule field/operator
- external identity duplicate mapping
- unauthorized role-scope grant
- invalid training audience FK/type pair
- audience targeting passive entity
- duplicate learner caused by overlapping audiences
- destructive delete of referenced entity

## 21. Canonical Non-Negotiables

The following are V1 non-negotiable:

1. Tenant isolation is never bypassed.
2. Employee identity and organizational placement remain separate.
3. Historical Employment is preserved.
4. Department hierarchy cannot cross Company boundaries or form cycles.
5. Group membership history is preserved.
6. Employee and User remain separate concepts.
7. Authorization is role + scope.
8. Imports/integrations use the same domain rules as manual operations.
9. Training audience targeting uses typed relational references and snapshot-friendly expansion.
10. Referenced organizational entities are passivated rather than destructively deleted.
11. Critical changes are auditable.
12. UI/VCE behavior cannot weaken server-side invariants.

## 22. Next Canonical Contract

The next document in the canonicalization chain is:

`docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`

It must expose commands/queries that enforce these rules without leaking persistence-specific shortcuts.