# ULTEF Runtime Qualification — Issue #19

Standard: `STD-TEST-001 v1.0.0`
Framework: `STD-TEST-002` / `STD-TEST-003`
Profile: `Sprint 01 Foundation v1`
PR: #20
Qualified implementation commit: `d6abe003dd1ede19b16d623216fcdf2b5d87ff05`
GitHub Actions run: `31537221016`
Job: `foundation` (`93931091967`)
Result: **PASS**

## Required Gates

- PostgreSQL service initialization — PASS
- Redis service initialization — PASS
- pnpm/toolchain setup — PASS
- dependency installation — PASS
- TypeScript typecheck — PASS
- unit/smoke tests — PASS
- application build — PASS
- Drizzle migration generation — PASS
- PostgreSQL migration apply — PASS
- dependency-aware `/readyz` runtime smoke — PASS

## Acceptance Criteria Evidence

- pnpm workspace and TypeScript baseline present — PASS
- Fastify API shell present — PASS
- `/healthz` liveness contract present — PASS
- `/readyz` validates PostgreSQL + Redis — PASS
- environment validation is fail-fast through Zod — PASS
- PostgreSQL/Drizzle migration framework executable — PASS
- Docker Compose provides PostgreSQL + Redis — PASS
- GitHub Actions executes foundation qualification chain — PASS
- repository ignore baseline present — PASS
- architecture-significant runtime choice recorded in ADR-011 — PASS

## Iterative Qualification History

Earlier CI runs failed and were not accepted as qualification:

1. pnpm version declared in two locations — corrected so `packageManager` is authoritative.
2. lockfile-dependent setup-node cache configured before a repository lockfile existed — cache removed from foundation workflow.
3. database TypeScript rootDir/include mismatch — corrected.
4. ioredis import shape failed TypeScript construction check — corrected to the supported constructable export.

These failures demonstrate the gate blocked completion until the foundation was actually executable.

## Hard Gates

- build/type safety — PASS
- migration execution — PASS
- dependency readiness — PASS
- invalid config rejection — PASS

Blocking findings: 0
Hard gate failures: 0
Final qualification: **PASS**

Note: this evidence file is documentation-only and is committed after the qualified implementation run. The PR head CI should remain green before merge.
