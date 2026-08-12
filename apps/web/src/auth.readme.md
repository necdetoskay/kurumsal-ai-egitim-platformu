# Web authentication/session boundary

The web client treats authentication/session state as a presentation boundary only. Backend authorization remains authoritative.

Rules:
- Protected role shells render only for authenticated session state.
- Role is accepted only from authenticated session bootstrap output.
- Missing authenticated identity fields fail closed.
- MFA/email verification is explicit and separate from authenticated state.
- Expired/forbidden/maintenance states never render protected shell content.
- Return paths must remain same-origin relative paths.
- Forbidden UI copy must not reveal tenant or resource identifiers.
