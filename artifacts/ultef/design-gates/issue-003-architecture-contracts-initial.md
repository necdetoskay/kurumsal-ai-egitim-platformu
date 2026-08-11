# ULTEF Design Gate Evidence — Issue #3

Standard: `STD-TEST-001 v1.0.0`
Profile: `design/architecture-contracts-v1`
Issue: #3 — Architecture Contracts Validation Pack
Result: **FAIL / OPEN**

## Deliverables Found/Created

- C4 architecture baseline — PASS
- UML class/state/sequence baseline — PASS
- PostgreSQL schema/index baseline — PASS
- OpenAPI endpoint inventory — PASS
- Machine-readable OpenAPI 3.1 document — CREATED, validation blocker found
- Event Catalog — PASS
- Event Schema Contracts — PASS
- ADR baseline/backlog — PASS

## Canonical Consistency Gates

1. Scope alignment — PASS
2. Bounded-context ownership — PASS
3. Learning Objective traceability — PASS
4. Historical version/snapshot integrity — PASS
5. Deterministic scoring boundary — PASS
6. Human-in-the-Loop AI boundary — PASS
7. Tenant isolation represented across architecture/data/API/events — PASS
8. Idempotency/outbox semantics represented — PASS
9. Audit/observability boundary represented — PASS

## Hard Gate Failure

### OpenAPI Path Parameter Contract

Current `docs/09-api/openapi.yaml` reuses a generic component path parameter named `id` through aliases such as `TrainingId`, `UserId`, etc. In OpenAPI, the resolved path parameter name must exactly match the path template placeholder (`{trainingId}`, `{userId}`, etc.).

This design may fail OpenAPI structural validation and is therefore a **contract compliance hard-gate failure** under `STD-TEST-001`.

## Additional Non-blocking Hardening

- Request/response schemas are intentionally generic at this baseline stage and require domain-specific typed schemas before implementation contract freeze.
- Machine validation should be automated in ULTEF/CI once repository tooling exists.
- Endpoint-level permission mapping should be generated against `ROLES_AND_PERMISSION_MATRIX.md`.

## Decision

Issue #3 MUST remain OPEN.

Required remediation before PASS:
1. Fix every path parameter component so the resolved `name` matches the path placeholder.
2. Validate OpenAPI 3.1 structurally.
3. Add typed critical schemas or explicitly split a follow-up contract-detail issue with no ambiguity about Design Freeze expectations.
4. Re-run architecture Design Gate.

Acceptance Criteria: PARTIAL
Hard Gates: **FAIL (OpenAPI contract compliance)**
Issue Closure: **NOT ALLOWED**
