# Coding Agent Sprint Pack — V1

Status: Canonical implementation packaging baseline
Related issue: #6

## Purpose

Her sprint, konuşma geçmişine ihtiyaç duymadan coding agent tarafından uygulanabilecek şekilde paketlenir.

## Required Sprint Package Fields

Her sprint aşağıdakileri içermelidir:

1. Goal / business value
2. In scope
3. Out of scope
4. Dependencies
5. Canonical document references
6. Domain/architecture impact
7. Data model changes
8. API changes
9. Event/outbox changes
10. AI/tool/prompt changes where relevant
11. Security/authorization requirements
12. Failure/retry/idempotency behavior
13. Observability/telemetry
14. Cost/latency constraints where relevant
15. Acceptance criteria
16. Unit tests
17. Integration/DB tests
18. Contract tests
19. E2E tests
20. ULTEF profile and hard gates
21. Migration/rollback notes
22. Deliverables
23. Definition of Done

## Issue Decomposition Rule

Bir sprint tek devasa issue değildir. Deliverable'lar independently testable ve reviewable issue'lara bölünür.

Her implementation issue minimum:
- context
- dependency
- implementation scope
- non-goals
- acceptance criteria
- applicable tests
- ULTEF qualification profile
- evidence expectation

## Branch / PR Rule

Kod değişikliği issue -> branch -> PR -> CI/ULTEF -> merge -> issue close akışını izler.

## Backend-First Dependency Rule

Frontend issue'ları backend contract issue'larının acceptance criteria'sını yeniden tanımlamaz. UI issue yalnız mevcut API/domain contract'ını tüketir; contract değişikliği gerekiyorsa backend change issue açılır.

## Definition of Ready

Bir sprint coding'e başlamadan önce:
- dependency docs mevcut
- unresolved blocking architecture decision yok
- acceptance criteria test edilebilir
- required test profile tanımlı
- DB/API/event schema etkisi biliniyor
- security hard gates tanımlı

## Definition of Done

Sprint tamamlanması, tüm child delivery issue'larının `STD-TEST-001` uyarınca completed olması ve sprint-level regression/qualification gate'in PASS olmasıyla mümkündür.