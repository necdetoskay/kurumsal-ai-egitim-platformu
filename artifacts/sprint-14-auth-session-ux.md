# Sprint 14 — Authentication & Session UX

Issue: #45
Branch: `agent/sprint-14-auth-session-ux`

## Implemented slice

- Explicit session state model: bootstrapping, unauthenticated, verification-required, authenticated, expired, forbidden, maintenance.
- Protected role shell renders only for authenticated sessions.
- Role is derived from authenticated session state rather than navigation alone.
- Explicit MFA verification state.
- Logout returns the client to unauthenticated state.
- Generic forbidden copy avoids tenant/resource detail disclosure.
- Safe return-path helper rejects absolute and protocol-relative redirect targets.
- Responsive public auth/session state surface.
- Unit tests for redirect safety, authenticated-shell gating, role derivation and forbidden-copy boundary.

## Qualification note

Local runtime execution was not available from the assistant container because external GitHub DNS access is blocked there. GitHub Actions CI on the pull request is the authoritative runtime/build/test qualification for this slice.

## Remaining Sprint 14 work

- Replace demo session transition adapter with real API-backed session bootstrap/login/logout contract.
- Wire verification/MFA challenge submission to backend identity provider boundary.
- Persist/restore approved return path after successful authentication.
- Add browser-level keyboard/responsive auth flow qualification.
- Add explicit invalid-session/API 401/403 mapping.
- Complete generic-standard extraction review before issue closure.
