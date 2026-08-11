# State Transitions & Failure Matrix — V1

Status: Canonical
Related issue: #13

## Training
| Current | Command | Next | Key guard |
|---|---|---|---|
| DRAFT | submitReview | IN_REVIEW | completeness minimum |
| IN_REVIEW | requestRework | DRAFT | reviewer decision |
| IN_REVIEW | publish | PUBLISHED | publish readiness + permission |
| PUBLISHED | archive | ARCHIVED | permission |

## Question
| Current | Command | Next | Key guard |
|---|---|---|---|
| DRAFT | submitReview | IN_REVIEW | schema/evidence valid |
| IN_REVIEW | approve | APPROVED | reviewer permission |
| IN_REVIEW | rework | DRAFT | reviewer decision |
| APPROVED | retire | RETIRED | history preserved |

## Assessment
| Current | Command | Next | Key guard |
|---|---|---|---|
| DRAFT | publish | PUBLISHED | valid snapshot/policy |
| PUBLISHED | close | CLOSED | permission |
| CLOSED | archive | ARCHIVED | no destructive history change |

## Attempt
| Current | Command | Next | Key guard |
|---|---|---|---|
| CREATED | begin | IN_PROGRESS | eligibility/time |
| IN_PROGRESS | saveAnswer | IN_PROGRESS | owner + before deadline |
| IN_PROGRESS | submit | SUBMITTED | not expired |
| SUBMITTED | score | SCORED | immutable answers |
| SCORED | finalize | COMPLETED | result persisted |
| CREATED/IN_PROGRESS | expire | EXPIRED | server clock/policy |
| any non-terminal | invalidate | INVALIDATED | privileged reason + audit |

## Retake Request
`REQUESTED -> APPROVED | REJECTED | CANCELLED`

## Certificate
`ELIGIBLE -> ISSUED -> REVOKED`

## Failure Matrix
| Operation | Failure | Transaction outcome | Retry |
|---|---|---|---|
| Training publish | content readiness fail | rollback/no transition | after correction |
| Training publish | event dispatch fail | state committed + outbox pending | automatic |
| Attempt start | duplicate request | existing attempt/idempotent result | safe |
| Attempt submit | concurrency conflict | no duplicate score | reload/retry policy |
| Scoring | deterministic exception | attempt stays submitted/error-marked | controlled |
| Certificate issue | duplicate consumer | one certificate only | safe |
| AI job | provider timeout | no domain candidate commit | retry/fallback |
| Notification | delivery failure | business state unchanged | independent retry |
| Analytics | projection failure | source state unchanged | replay |

## Recovery Principles
- Transactional source-of-truth wins over projection.
- Retry must not create duplicate business effects.
- External side effects must be isolated from core transaction.
- Reconciliation jobs are allowed; silent data repair is not.
- Every manual recovery action is audited.
