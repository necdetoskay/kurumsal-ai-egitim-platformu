# Organization Management Intent V1

**Status:** CANONICAL-DRAFT  
**Version:** 1.0  
**Module:** Organization Management  
**Repository:** `necdetoskay/kurumsal-ai-egitim-platformu`

## 1. Purpose

Organization Management provides the canonical business structure on which personnel management, training targeting, permissions, reporting, and integrations depend.

The system must support both a simple single-company organization and a multi-company group/holding without requiring a future data-model rewrite.

## 2. Core Intent

The canonical business hierarchy is:

```text
Organization
  └─ Company
      └─ Department Tree
          └─ Employment
              └─ Employee
```

Training-oriented groups are independent of the organization tree:

```text
Organization
  └─ Group
      └─ Group Membership
          └─ Employee
```

The design must allow a single employee to participate in multiple groups without changing the employee's real organizational placement.

## 3. Tenant and Organization Separation

`Tenant` and `Organization` are different concepts.

- `Tenant` is the technical SaaS isolation/security boundary.
- `Organization` is the business-level customer group/holding/organization.

A user must never select or manipulate `tenant_id` as ordinary business data.

## 4. Multi-Company Requirement

An Organization may contain one or more Companies.

Examples:

```text
ABC Holding
├─ ABC İnşaat A.Ş.
├─ ABC Enerji A.Ş.
└─ ABC Lojistik A.Ş.
```

The design must therefore treat Company as a first-class entity rather than embedding company identity directly into employee records.

## 5. Department Requirement

Departments form a hierarchical tree within a Company.

A department may have a parent department, enabling structures such as:

```text
Bilgi İşlem Müdürlüğü
├─ Sistem Yönetimi Birimi
├─ Yazılım Birimi
└─ Destek Hizmetleri Birimi
```

A department must not have a parent from another Company.

## 6. Employee and Employment Separation

`Employee` represents the person.

`Employment` represents the person's organizational assignment over a time interval.

This separation is required because a person may:

- change company,
- change department,
- change position,
- change manager,
- change location,
- have historical assignments that must remain queryable.

Historical assignment data must not be overwritten.

## 7. Groups

Groups are training/operational targeting constructs independent from Department hierarchy.

The system must support:

- Manual Groups,
- Dynamic Groups,
- System Groups.

Examples:

- Yöneticiler
- Yeni Başlayanlar
- KVKK 2026
- İSG Kurulu
- Acil Durum Ekibi

An Employee may belong to zero, one, or many Groups simultaneously.

Group membership history must be preserved.

## 8. Dynamic Groups

The canonical model must be capable of supporting rule-based group membership even if full UI/runtime automation is delivered in a later phase.

Example rules:

```text
hire_date >= today - 90 days
position.is_managerial = true
company = X AND department = Y
training_completion != completed
```

The rule engine implementation technology is not fixed by this intent.

## 9. Positions and Locations

Position and Location are separate managed entities.

Position represents organizational responsibility/title and may include managerial semantics.

Location represents physical or operational working location, such as:

- Genel Müdürlük
- Şantiye
- Depo
- Bölge Ofisi
- Fabrika

Department and Location must not be treated as the same concept.

## 10. Employee Is Not User Account

`Employee` and application `User` are separate concepts.

A person may exist as an Employee without having a login account.

A User may receive application roles and scoped permissions independently from organizational employment data.

## 11. Authorization Intent

Authorization must support scoped roles.

Examples:

```text
ORGANIZATION_ADMIN @ Organization A
COMPANY_ADMIN @ Company X
HR_MANAGER @ Company X
MANAGER @ Department Y
TRAINER @ Organization A
LEARNER @ self
```

The exact authorization framework/library is an implementation concern and is not fixed here.

## 12. Training Targeting Intent

Training assignment must eventually support these target levels through one coherent targeting model:

- Organization
- Company
- Department
- Group
- Employee

Examples:

- assign mandatory training to all employees in an Organization,
- assign finance training to a Department,
- assign leadership training to the Managers Group,
- assign remediation training to a single Employee.

## 13. History Preservation

The system must preserve business history.

The following records must not be destructively overwritten when history is meaningful:

- employment assignments,
- department/company movements,
- position changes,
- manager changes,
- group memberships,
- lifecycle state changes relevant to historical reports.

Where appropriate, closure/end timestamps or passive states are preferred over hard deletion.

## 14. Integration Intent

Personnel information may enter the system from multiple sources without changing the canonical Employee model.

Supported/planned sources include:

- manual entry,
- CSV/Excel import,
- LDAP / Active Directory,
- HR systems,
- ERP/API integrations.

External identities must be linkable to the canonical Employee record.

## 15. Audit Intent

Critical organization/personnel management changes must be auditable.

At minimum the platform must be capable of identifying:

- who made the change,
- what entity changed,
- previous state,
- new state,
- when the change occurred.

## 16. UI Intent

Organization Management is an administration workspace, not a single page.

The canonical module set is expected to include at least:

- Organizations
- Companies
- Departments
- Personnel
- Groups
- Positions
- Locations

Each managed module should expose an appropriate list/browse view and create/edit/detail experience.

Approved visual designs become VCE references and implementation must conform to the approved VCE unless a later VCE version supersedes it.

## 17. Non-Goals of This Intent

This document does not select:

- frontend framework,
- ORM,
- database engine-specific syntax,
- queue technology,
- exact API route structure,
- exact dynamic-rule-engine library,
- exact identity provider.

Those decisions belong to architecture, contracts, ADRs, or implementation phases.

## 18. Canonicalization Rule

This Intent is the upstream source of truth for Organization Management architecture and downstream contracts.

If a later architecture, epic, phase, issue, implementation, or VCE introduces a material change to these goals or boundaries, this Intent must be reviewed and versioned before that change becomes canonical.

## 19. Acceptance Conditions

Organization Management V1 is aligned with this Intent only if:

1. Multi-company is first-class.
2. Departments are hierarchical and company-bound.
3. Employee and Employment remain separate.
4. Groups remain independent of the department tree and support many-to-many membership.
5. Historical organizational assignments are preserved.
6. Employee and User remain separate concepts.
7. Training targeting can address Organization, Company, Department, Group, or Employee.
8. Tenant isolation is not exposed as ordinary business configuration.
9. Integration sources map into canonical personnel records rather than creating parallel personnel models.
10. Approved VCE references are traceable to the canonical domain/contracts.
