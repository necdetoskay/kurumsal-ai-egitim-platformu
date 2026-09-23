# M8 V1 Release Hardening

Status: ACTIVE QUALIFICATION  
Parent: #148 / #114

## Release scope

Recovered V1 is limited to the demonstrated mission:

`Organization → Employee/User → Training authoring → immutable publish → Audience resolution → Assignment → Learning/resume → Assessment → Objective evidence → bounded insight/recommendation → Certificate → Organization analytics`.

Deferred features remain outside this release: broad ERP/LDAP productization, AI Tutor, competency/career inference, adaptive curriculum, native mobile, SCORM/xAPI ecosystem, gamification/social learning, and AI media/avatar work.

## Mandatory release gates

1. **Deterministic build**
   - Node 22.
   - pnpm 10.
   - committed `pnpm-lock.yaml`.
   - CI uses `pnpm install --frozen-lockfile`.
2. **Production-like UAT**
   - all packages are built before runtime qualification.
   - API is started from `apps/api/dist/index.js` with the `production` package export condition.
   - Web is served from the Vite production build through `vite preview`.
   - MUR browser suite must PASS end-to-end against PostgreSQL + Redis + cryptographically signed test JWTs.
3. **Security regression**
   - legacy `x-kaep-*` identity headers do not authenticate a request.
   - invalid Bearer tokens fail closed.
   - client tenant/learner identity override is rejected.
   - cross-tenant audience and analytics substitution fails closed.
4. **Performance baseline**
   - authenticated `GET /api/v1/organizations` and `GET /api/v1/trainings`.
   - 50 sequential requests per endpoint in the release environment.
   - zero HTTP failures.
   - p95 <= 1000 ms per endpoint.
   - This is a release smoke baseline, not a capacity claim.
5. **Database migration and recovery**
   - forward migration executes on a clean PostgreSQL 17 database.
   - M1–M7 PostgreSQL integration suite executes after migration.
   - after browser/UAT writes, PostgreSQL `pg_dump` custom-format backup is restored into a new database.
   - source/restored row counts must match for `trainings`, `training_versions`, `training_assignments`, `attempts`, and `certificates`.
   - restored public schema must contain more than 20 tables.
6. **Browser mission**
   - MUR-E2E-001 full mission.
   - MUR-E2E-002 insufficient-evidence abstention.
   - MUR-E2E-003 cross-tenant fail-closed.
   - MUR-E2E-004 replay/idempotency and immutable history.
   - MUR-E2E-005 security boundary regression.
7. **CI execution**
   - final release gate must execute on an approved Linux self-hosted runner with Docker/browser capability.

## Rollback strategy

Schema changes are forward-only during normal operation. A release rollback does not attempt destructive reverse DDL on a database that may already contain new-version writes.

Operational rollback sequence:

1. stop new writes / place the application into maintenance mode;
2. capture a fresh database backup and preserve application logs;
3. if the failed release did not introduce incompatible persisted writes, redeploy the previously qualified application SHA;
4. if incompatible writes or schema corruption are possible, provision a clean PostgreSQL instance and restore the pre-release qualified backup;
5. run migration metadata/schema checks and the readiness smoke against the restored database;
6. reopen traffic only after tenant isolation, authentication and the primary mission smoke pass.

Never delete or rewrite published TrainingVersion, confirmed AudienceResolution, completed Attempt, ObjectiveEvidence, Completion or Certificate history to make an older binary fit.

## Backup / restore runbook

The CI drill uses the exact PostgreSQL major version:

- `postgres:17-alpine pg_dump -Fc`;
- create a separate `kaep_restore` database;
- `pg_restore --no-owner --no-privileges`;
- compare critical table row counts;
- validate restored schema presence.

Production operators must additionally retain the backup outside the application host and apply organization retention/encryption policy.

## Incident triage

For a failed release, collect before repair:

- exact application SHA;
- failed CI/UAT scenario and artifact;
- API logs and correlation/audit identifiers;
- PostgreSQL migration state;
- readiness status for PostgreSQL and Redis;
- affected tenant/resource IDs without exporting unrelated tenant data.

Security boundary failures, cross-tenant leakage, immutable-history corruption, or authentication bypass are release blockers and require traffic containment before functional debugging.

## Known limitations

- M8 load numbers are single-run release-smoke measurements, not a formal concurrent-user capacity certification.
- Test IdP/JWKS exists only inside the E2E harness; production requires the configured canonical issuer/JWKS.
- Broad directory/ERP integrations and file import productization are deferred from recovered V1.
- Organization analytics intentionally suppresses cohorts below the configured privacy threshold and does not provide employee performance/personality/career scoring.
- Published training history is immutable; editing a published training requires a future explicit new-version authoring workflow rather than silent mutation.
- The release does not claim disaster-recovery RPO/RTO until infrastructure-specific storage/retention targets are agreed and measured.

## Final evidence record

This section must be updated only after the exact release SHA passes all gates:

- exact SHA: PENDING
- CI run: PENDING
- browser mission: PENDING
- p95 baseline: PENDING
- backup/restore: PENDING
- self-hosted runner: PENDING
