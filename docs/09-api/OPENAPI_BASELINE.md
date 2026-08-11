# OpenAPI 3.1 Contract Baseline — V1

Status: Canonical contract inventory for Sprint 00
Related issue: #3

Bu belge endpoint envanterini ve contract ilkelerini tanımlar. Machine-readable `openapi.yaml` implementasyon sprintinde bu baseline'dan türetilir ve contract tests ile korunur.

## Global Rules

- API version prefix: `/api/v1`
- JSON request/response contracts version-controlled.
- Authentication required except explicitly public endpoints.
- Tenant context server-side trusted source'dan çözülür.
- Object-level authorization mandatory.
- Mutating critical endpoints support idempotency where duplicate side effects are harmful.
- Standard error envelope carries code, message, correlation id and safe details.
- Pagination uses stable cursor or explicit documented scheme.

## Identity / Organization

- `GET /me`
- `GET /organization`
- `GET /organization/units`
- `GET /users`
- `POST /users/invitations`
- `PATCH /users/{userId}`
- `GET /roles`
- `PUT /users/{userId}/roles`

## Training / Content

- `GET /trainings`
- `POST /trainings`
- `GET /trainings/{trainingId}`
- `PATCH /trainings/{trainingId}`
- `POST /trainings/{trainingId}/submit-review`
- `POST /trainings/{trainingId}/publish`
- `POST /trainings/{trainingId}/archive`
- `GET /trainings/{trainingId}/versions`
- `POST /trainings/{trainingId}/versions`
- `GET /trainings/{trainingId}/objectives`
- `POST /trainings/{trainingId}/objectives`
- `PATCH /learning-objectives/{objectiveId}`
- `GET /trainings/{trainingId}/modules`
- `POST /trainings/{trainingId}/modules`
- `POST /content/sources`
- `POST /content/{contentId}/versions`

## Learning / Assignments

- `GET /assignments`
- `POST /assignments`
- `GET /learner/assignments`
- `GET /learner/trainings/{trainingId}`
- `PUT /learner/progress/{trainingVersionId}`
- `PUT /learner/modules/{moduleId}/progress`
- `PUT /learner/videos/{videoId}/progress`
- `GET /learner/trainings/{trainingVersionId}/resume`

## Question Bank

- `GET /questions`
- `POST /questions`
- `GET /questions/{questionId}`
- `PATCH /questions/{questionId}`
- `POST /questions/{questionId}/submit-review`
- `POST /questions/{questionId}/approve`
- `POST /questions/{questionId}/retire`

## Assessments

- `GET /assessments`
- `POST /assessments`
- `GET /assessments/{assessmentId}`
- `PATCH /assessments/{assessmentId}`
- `POST /assessments/{assessmentId}/publish`
- `POST /assessments/{assessmentId}/close`
- `POST /assessments/{assessmentId}/attempts`
- `GET /attempts/{attemptId}`
- `PUT /attempts/{attemptId}/answers/{questionSnapshotId}`
- `POST /attempts/{attemptId}/submit`
- `GET /attempts/{attemptId}/result`
- `POST /assessments/{assessmentId}/retake-requests`
- `POST /retake-requests/{requestId}/approve`
- `POST /retake-requests/{requestId}/reject`

## Certification

- `GET /learner/certificates`
- `GET /certificates/{certificateId}`
- `GET /certificates/verify/{verificationCode}` public-safe verification
- `POST /certificates/{certificateId}/revoke`

Certificate issuance is normally event/workflow-driven, not arbitrary learner-facing POST.

## AI Runtime

- `POST /ai/content-intelligence/jobs`
- `POST /ai/question-generation/jobs`
- `GET /ai/jobs/{jobId}`
- `GET /ai/review-queue`
- `GET /ai/reviews/{reviewId}`
- `POST /ai/reviews/{reviewId}/approve`
- `POST /ai/reviews/{reviewId}/reject`
- `PATCH /ai/reviews/{reviewId}/final-content`
- `GET /ai/usage`

Provider/model selection is not a normal client-controlled field; routing policy owns the decision unless a privileged evaluation endpoint is explicitly introduced.

## Analytics / Notifications / Audit

- `GET /analytics/overview`
- `GET /analytics/trainings/{trainingId}`
- `GET /analytics/assessments/{assessmentId}`
- `GET /learner/insights`
- `GET /notifications`
- `POST /notifications/read`
- `GET /audit/events`

## Contract Security Requirements

- Learner answer-key fields never appear before permitted result disclosure.
- Cross-tenant identifiers do not grant access.
- Review/publish operations have distinct permissions.
- Attempt ownership enforced server-side.
- Public certificate verification exposes only minimum safe verification data.

## Idempotency Candidates

Required/strongly recommended for:
- user invitation
- assignment creation/bulk assignment
- attempt creation
- attempt submit
- AI job creation where retry may duplicate cost
- retake approval
- certificate side effects

## Contract Testing

Machine-readable OpenAPI must later be checked for:
- schema validity
- endpoint/permission mapping
- response-code coverage
- examples for critical flows
- no undocumented production endpoints
- breaking-change detection
- ULTEF contract profile PASS before issue/PR completion.