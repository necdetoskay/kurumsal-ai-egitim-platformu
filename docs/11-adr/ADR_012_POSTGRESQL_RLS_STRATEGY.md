# ADR-012 — PostgreSQL RLS Strategy

Status: Accepted
Sprint: 02

## Decision

V1 authorization relies on mandatory application-layer tenant context resolution, permission policy enforcement, object-level authorization and tenant-scoped repository/query helpers.

PostgreSQL Row Level Security (RLS) is **not enabled as the primary enforcement mechanism in Sprint 02**. It remains an approved defense-in-depth layer to be introduced selectively after the tenant-owned schema and connection/session-context mechanism are stable.

## Rationale

- Application authorization must exist regardless of database implementation.
- Current V1 uses a pooled PostgreSQL connection model; safe RLS requires a rigorously defined per-transaction tenant/session context and reset semantics.
- Enabling partial RLS too early can create a false security assumption while some tables or background workers bypass it.
- ULTEF tenant-isolation, BOLA/IDOR and privilege-escalation tests provide executable enforcement evidence now.

## Mandatory Invariants

- Client-provided `tenant_id` is never authoritative.
- Tenant-owned queries must be tenant-scoped by trusted context.
- Object lookup must not expose cross-tenant existence.
- Background jobs carry explicit tenant context.
- RLS, when introduced, cannot replace application-layer authorization.

## Promotion Trigger

Introduce RLS in a later data/security sprint only when:
1. tenant-owned table inventory is stable,
2. transaction-scoped tenant context is implemented and tested,
3. worker/system-actor behavior is specified,
4. connection-pool context leakage tests exist,
5. bypass/admin policies are explicitly audited.

## ULTEF Requirement

Any future RLS adoption must add tests for cross-tenant reads/writes, pool context leakage, transaction reset behavior, privileged bypass, background jobs and migration safety.