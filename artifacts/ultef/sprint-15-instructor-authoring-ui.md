# Sprint 15 — Instructor Authoring UI Qualification

Issue: #46

## Implemented boundaries

- create/edit/preview/review/version authoring route inventory
- responsive instructor authoring workspace
- source/evidence lineage visibility
- AI proposal cannot self-publish
- published edit requires a new version
- failed save blocks review handoff and never renders success
- backend transport contract maps 401/403/conflict/validation failures fail-closed
- cross-role authoring routes fail closed

## Executable evidence

- `apps/web/src/authoring.test.ts`
- `apps/web/src/authoring-api.test.ts`
- `apps/web/src/authoring-screens.test.ts`
- existing web auth/navigation/screen regression suite

## Generic-standard extraction review

Reusable rules identified:

1. AI-generated authoring output remains a proposal until explicit human/policy review.
2. Published content is immutable in place; edits create a new version.
3. Save failure must never be represented as success and must block state promotion.
4. Evidence/provenance must remain visible across authoring and review handoff.
5. Client route visibility is presentation-only; authorization remains backend authoritative.

These rules are generic and can be promoted to the shared UI/workflow standard without project-specific domain names.

## Closure gate

GitHub Actions CI must pass typecheck, tests and build before merge/issue closure.
