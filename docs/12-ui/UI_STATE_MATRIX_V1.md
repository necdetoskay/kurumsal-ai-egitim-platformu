# UI State Matrix — V1

Status: Canonical for Sprint 00
Related issue: #4

## Purpose

Bu belge kritik V1 ekranlarının yalnız happy-path görünümünden ibaret kalmaması için gerekli state kapsamını tanımlar.

| Area | Loading | Empty | Error | Permission | Domain/Workflow States |
|---|---|---|---|---|---|
| Users | required | required | required | required | invited, active, inactive |
| Trainings | required | required | required | required | draft, in-review, changes-requested, published, archived |
| Training Editor | required | n/a | required | required | dirty, saving, saved, validation-failed, version-conflict |
| Learning Objectives | required | required | required | required | active, historical/deprecated |
| Question Bank | required | required | required | required | draft, in-review, approved, retired |
| AI Generation | required | initial | required | required | queued, running, validation-failed, evaluation-failed, awaiting-review, approved, rejected |
| Review Queue | required | required | required | required | pending, claimed/active, approved, rejected, changes-requested |
| Assignments | required | required | required | required | scheduled, active, overdue, completed/cancelled where policy allows |
| Learner Dashboard | required | required | required | required | assigned, in-progress, overdue, completed |
| Training Player | required | n/a | required | required | resuming, progress-saving, progress-save-failed, completed |
| Assessment Start | required | n/a | required | required | not-eligible, scheduled, eligible, attempt-exists |
| Assessment Player | required | n/a | required | required | in-progress, autosaving, autosave-failed, resumed, expiring, expired, submitting |
| Result | required | n/a | required | required | scoring, pass, fail |
| Retake | required | n/a | required | required | available, requested, approved, rejected, exhausted |
| Certificates | required | required | required | required | issued, revoked |
| Learning Insight | required | insufficient-evidence | required | required | available, low-confidence/insufficient-evidence |
| Analytics | required | insufficient-data | required | required | fresh, delayed/read-model-lag |
| Audit | required | required | required | required | filtered/search-results |
| Notifications | required | required | required | required | unread, read, delivery-failed where admin-visible |

## Critical Rules

1. Async save işlemi başarısız olduğunda UI başarı göstermemelidir.
2. AI provider failure ile schema/evaluator failure ayrı hata sınıfları olarak gösterilebilir.
3. Assessment timer server-authoritative state ile senkronize olmalıdır.
4. Cross-tenant/unauthorized resource için UI hassas resource bilgisini sızdırmamalıdır.
5. Learning Insight yetersiz evidence olduğunda kesin zayıflık iddiası göstermemelidir.
6. Published resource edit ekranı versioning davranışını kullanıcıya açıkça göstermelidir.
7. Retry butonları idempotent server contract ile uyumlu olmalıdır.

## Visual Mockup Validation Requirement

Her kanonik mockup seti en az şu kritik state örneklerini göstermelidir:

- Training editor: validation error + published/version change
- AI generation: running + failure + awaiting review
- Review: approve/reject/changes requested
- Learner training: resume + progress save failure
- Assessment: autosave failure + expiry + submit
- Result: pass/fail
- Retake: pending/rejected
- Learning insight: weak-area + insufficient evidence
- Global: loading/empty/error/403
