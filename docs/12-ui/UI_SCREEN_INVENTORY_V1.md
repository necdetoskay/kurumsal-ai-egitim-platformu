# UI Screen Inventory — V1

Status: Canonical for Sprint 00
Related issue: #4

## Purpose

Bu belge V1 kullanıcı akışlarını gerekli ekranlar, roller, temel state'ler ve ilgili domain capability'leri ile eşler. UI implementation için source-of-truth envanteridir; görsel mockup dosyalarının kendisi değildir.

## Global UI Principles

- V1 web-first ve responsive'dir; native mobile V1 dışıdır.
- Navigation role/permission-aware olabilir ancak authorization server-side enforce edilir.
- Her data-driven ekran en az loading, empty, success ve error state'lerini tanımlar.
- Permission denied state gizli hata yerine kontrollü 403/forbidden deneyimi sunar.
- Async AI işleri progress/pending/failure/retry state'lerini göstermelidir.
- Human-review gerektiren AI çıktıları draft/review/approved/rejected ayrımını görünür kılmalıdır.
- Learner attempt ekranları answer key veya scoring secret bilgisini submit öncesi göstermemelidir.

## Auth / Shared

1. Login
2. MFA / verification
3. Session expired
4. Forbidden / 403
5. Not found / 404
6. Maintenance / degraded-service
7. Notification center
8. Profile/account

## Tenant Admin

9. Admin dashboard
10. Users list
11. User detail
12. User invitation
13. Roles/permissions overview
14. Organization units/departments/groups
15. Training portfolio overview
16. Assignment management
17. Assessment overview
18. Retake request queue
19. Certificates administration
20. Organization analytics
21. Audit log viewer
22. AI operations / usage-cost overview

## Instructor / Training Manager

23. Training list
24. Create training
25. Training overview/detail
26. Training editor
27. Module editor
28. Content/source manager
29. Learning Objective editor
30. Training preview
31. Submit-for-review state
32. Training version history
33. Question Bank list
34. Question editor
35. AI question generation wizard
36. AI content intelligence workspace
37. Assessment list
38. Assessment editor
39. Assessment publish/configuration screen
40. Assignment creation/management
41. Training/assessment analytics

## Reviewer

42. Review queue
43. Training review detail
44. Question review detail
45. AI output comparison/review
46. Approve/reject with rationale
47. Review history

## Learner

48. Learner dashboard
49. Assigned trainings list
50. Training detail
51. Training player
52. Module/content reader
53. Video player with resume/progress
54. Assessment eligibility/start screen
55. Assessment player
56. Attempt resume screen/state
57. Attempt submit confirmation
58. Assessment result
59. Retake request
60. Certificates list
61. Certificate detail
62. Learning insight / weak-area view
63. Recommended relevant content view
64. Learner notifications

## AI-specific States

AI Workspace ve generation akışlarında en az:
- idle
- input/source selected
- validating input
- queued
- running
- partial/progress if supported
- completed
- structured-output validation failed
- evaluator failed
- provider/model failure
- budget/usage limit reached
- awaiting human review
- approved
- rejected
- edited-after-generation

## Assessment-specific States

- not eligible
- eligible
- scheduled/not started
- in progress
- autosave pending
- autosave failed/retry
- resumed
- time warning
- time expired
- submitting
- submitted
- scoring
- completed/pass
- completed/fail
- retake available
- retake approval pending
- retake rejected

## Training-specific States

- draft
- in review
- changes requested
- approved for publish
- published
- version update in progress
- archived

## Required Cross-Screen Traceability

Primary user flows must map as follows:

- Training create -> review -> publish: screens 23-32 + 42-46
- AI content generation -> review -> training draft: 36 + 45-46 + 26-30
- AI question generation -> review -> Question Bank: 33-35 + 42/44-46
- Assignment -> progress -> completion: 40 + 48-53
- Assessment start -> resume -> submit -> result: 54-58
- Retake: 18 + 59
- Certificate: 19 + 60-61
- Learning Insight: 58 + 62-63

## Component Inventory

Minimum shared component families:
- App shell/navigation
- Breadcrumbs
- Data table
- Search/filter bar
- Pagination
- Status badge
- Empty state
- Error state
- Permission/forbidden state
- Form controls
- Rich text/content editor wrapper
- Video player wrapper
- Progress indicator
- Stepper/wizard
- Confirmation dialog
- Toast/notification
- Review diff/compare panel
- AI generation status panel
- Cost/usage indicator where relevant
- Timeline/audit trail
- Chart/metric card

## Responsive Requirements

- Desktop is primary V1 target.
- Tablet/mobile widths must remain usable for responsive web.
- Native mobile interaction patterns are not required in V1.
- Dense admin tables may use horizontal scroll or responsive column prioritization.
- Learner core flows (dashboard, training player, assessment player, results) receive higher responsive priority than complex admin authoring screens.

## Accessibility Baseline

- Keyboard-accessible primary controls
- Visible focus state
- Semantic heading hierarchy
- Form labels and error association
- Sufficient text contrast
- Status cannot be conveyed by color alone
- Timer/assessment warnings must be perceivable without animation dependence

## Validation Rule

A V1 capability cannot be considered UI-complete unless its happy path and required failure/loading/empty/permission states have a screen or explicit component/state definition.
