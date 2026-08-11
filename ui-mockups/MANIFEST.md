# Canonical HTML Mockup Manifest — V1

Status: Design Freeze reference
Related issues: #4, #12

## Files

- `index.html` — gallery / role entry
- `admin.html` — Tenant Admin surfaces
- `instructor.html` — Training authoring, Learning Objectives, Question Bank, Assessment Builder, AI generation
- `reviewer.html` — Human-in-the-Loop queue, AI quality evidence, approve/reject/edit
- `learner.html` — assignments, player/progress, assessment, result, retake, certificate, Learning Insight
- `states.html` — loading, empty, 403, AI running/degraded, assessment expired, retake pending, human-review required, tenant-boundary not-found
- `styles.css` — shared responsive visual baseline

## Inventory Mapping

`docs/12-ui/UI_SCREEN_INVENTORY_V1.md` 64 logical screens/surfaces tanımlar. Bu mockup seti her logical screen için ayrı HTML dosyası üretmek yerine shared role/domain surfaces kullanır.

### Auth / Shared
Login, invite acceptance, session/permission/error/loading/empty davranışları production implementation sırasında shared components olarak uygulanacaktır. Critical permission/error/loading/empty örnekleri `states.html` içindedir.

### Tenant Admin
Organization dashboard, users, roles, departments/groups, assignment management, retake review, organization analytics, AI operations and audit -> `admin.html`.

### Instructor
Training list/create/edit, module/content authoring, Learning Objective management, preview/review-submit surface, Question Bank, AI content/question generation, Assessment Builder -> `instructor.html`.

### Reviewer
Review queue, question/content review detail, AI evaluator evidence, edit/reject/approve, lineage/audit -> `reviewer.html`.

### Learner
Assigned/in-progress/completed training, player/resume/progress, assessment start/in-progress/result, retake, certificates, bounded Learning Insight -> `learner.html`.

### Critical States
Loading, empty, permission denied, async AI job, degraded provider, assessment expiry, pending retake, review-required, tenant-safe not-found -> `states.html`.

## Required Interaction Principles Represented

- Role-aware navigation
- Tenant-aware access language
- Human-in-the-Loop separation
- AI model/prompt/evidence visibility where operationally relevant
- Learning Objective traceability
- Assessment server-authoritative time/state
- Retake creates a new attempt conceptually
- Bounded Learning Insight with evidence/confidence
- Responsive web baseline

## Deliberate Non-Goals

These mockups are not production code, not a finalized design system and not a pixel-perfect brand guide. Their purpose is to remove screen/surface ambiguity before implementation.

## Future Implementation Rule

Frontend implementation may improve layout and component composition, but must preserve canonical capability/state coverage unless a documented design decision changes the inventory.
