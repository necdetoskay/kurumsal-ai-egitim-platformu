# Bounded Context Contracts — Kurumsal AI Eğitim Platformu

Status: Canonical for Sprint 00

## Purpose

Bu belge `DOMAIN_MAP.md` içindeki context sınırlarını implementasyon açısından daha somut hale getirir. Her context için public responsibility, forbidden ownership ve temel inbound/outbound contract'ları tanımlar.

## Identity & Access

### Inbound
- Login / SSO callback
- User activation/disable commands
- Role/permission management
- Authorization checks

### Outbound
- `identity.user.invited`
- `identity.user.activated`
- `identity.user.disabled`
- `identity.role.assigned`

### Forbidden
- Training progress yazmak
- Tenant hierarchy sahibi olmak
- Assessment result hesaplamak

## Organization

### Inbound
- Tenant create/update
- Membership create/remove
- Department/group management

### Outbound
- Tenant membership changed events
- Group membership changed events

### Forbidden
- User authentication secret/state sahibi olmak
- Learning progress sahibi olmak

## Training

### Inbound
- Create/update training
- Manage Learning Objectives
- Submit for review
- Publish/archive

### Outbound
- `learning.training.created`
- `learning.training.published`
- `learning.training.archived`

### Required collaborators
- Content: publish completeness için içerik sürümü bilgisi
- Identity/Organization: authorization ve tenant scope

### Forbidden
- Content body'yi kendi tablosunda kopyalamak
- Learner progress yazmak
- Assessment scoring yapmak

## Content

### Inbound
- Module/content CRUD
- Source upload/reference
- Transcript and derived text creation
- Content review

### Outbound
- Content approved/versioned events
- AI source preparation contract

### Forbidden
- Training publish state sahibi olmak
- Question Bank kaydını doğrudan oluşturmak

## Learning

### Inbound
- Assign training
- Update progress
- Resume
- Complete training

### Outbound
- `learning.enrollment.assigned`
- `learning.enrollment.completed`
- Progress projection events where required

### Forbidden
- Attempt/result sahibi olmak
- Certificate oluşturmak

## Question Bank

### Inbound
- Manual question create/edit
- Accept generated question draft
- Approve/retire question version

### Outbound
- Approved question version contract
- Question lifecycle events

### Required collaborators
- Training: Learning Objective identity/reference
- AI Runtime: generated question candidate

### Forbidden
- Published assessment attempt'ındaki question snapshot'ı sonradan değiştirmek

## Assessment

### Inbound
- Create/configure assessment
- Attach approved question versions
- Publish
- Create assignment
- Start/resume/submit attempt
- Retake request/approval

### Outbound
- `assessment.assignment.created`
- `assessment.attempt.started`
- `assessment.attempt.submitted`
- `assessment.result.calculated`

### Required collaborators
- Question Bank: approved/versioned question material
- Learning/Organization: learner and assignment context

### Forbidden
- AI ile scoring yapmak (V1 objective scoring deterministic'tir)
- Certificate lifecycle sahibi olmak

## Certification

### Inbound
- Eligible result/completion signal
- Revoke command
- Verify command/query

### Outbound
- `assessment.certificate.issued`
- Certificate revoked event

### Forbidden
- Assessment pass/fail kararını tekrar hesaplamak

## AI Runtime

### Inbound
- Content intelligence request
- Question generation request
- Quality evaluation request
- Bounded learning insight request

### Outbound
- `ai.generation.requested`
- `ai.generation.completed`
- `ai.generation.failed`
- Human review request/result linkage

### Required contracts
- Versioned prompt
- Selected model metadata
- Structured output schema
- Tenant context
- Cost/latency telemetry

### Forbidden
- Generated content'i kendiliğinden published Training/Content/Question haline getirmek
- Authorization kararını AI modeline bırakmak
- Deterministic business rule yerine LLM kullanmak

## Analytics & Learning Insight

### Inbound
- Domain events/read models
- Explicit insight request

### Outbound
- Read-only analytics DTOs
- Weak area insight
- Relevant content recommendation link

### Forbidden
- Transactional source of truth'a doğrudan mutation
- V1'de tam competency graph sahibi olmak

## Notification

### Inbound
- Domain event veya send-notification command

### Outbound
- Delivery status events

### Forbidden
- Business workflow state değiştirmek

## Audit & Operations

### Inbound
- Audit event
- Operational job/trace state

### Outbound
- Read-only audit/operations query models

### Forbidden
- Business entity'nin authoritative current state'i olmak

# Shared Kernel Policy

`shared` yalnızca gerçekten teknik ve domain-neutral primitive'ler için kullanılabilir:
- UUID/value helpers
- Result/error primitives
- Date/time abstraction
- Correlation/trace contracts
- Pagination primitives

Aşağıdakiler `shared` içine konulamaz:
- Training rules
- Assessment scoring
- Tenant membership policy
- AI routing policy
- Learning Objective logic

# Contract Evolution

Context sınırını aşan her public contract:
- typed olmalı,
- versioning davranışı tanımlı olmalı,
- contract/integration test ile korunmalı,
- breaking değişiklikte consumer impact değerlendirilmelidir.

# Coding Agent Rule

Coding agent bir task sırasında bir context'in başka context'in persistence modeline doğrudan erişmesini gerektiren bir ihtiyaç görürse bunu otomatik uygulamaz. Önce mevcut application contract/event ile çözmeye çalışır; mümkün değilse architecture decision ihtiyacını raporlar.
