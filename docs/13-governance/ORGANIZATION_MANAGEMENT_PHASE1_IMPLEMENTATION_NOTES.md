# Organization Management Phase 1 Implementation Notes

## Issue #60

This implementation slice adds persistence for canonical Organization Management governance concerns:

- MANUAL / DYNAMIC / SYSTEM groups
- temporal group memberships using valid_from / valid_until
- versioned dynamic group rules
- external employee identities
- scoped user role assignments
- append-only organization audit event records

### Non-negotiable constraints preserved

- membership removal closes history; it does not delete prior membership rows
- active duplicate memberships are prevented
- dynamic group rules retain version history
- external identity mappings are unique by tenant + provider + external id
- scoped role assignments use explicit organization/company/department columns
- audit events are modeled as append-only evidence records at the persistence layer

### Compatibility

Existing authz primitives (`roles`, `user_roles`, `audit_events`) remain intact. Organization Management adds its canonical scoped assignment and audit persistence layer without rewriting the existing authorization baseline.
