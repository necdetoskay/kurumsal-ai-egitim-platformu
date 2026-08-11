# DESIGN FREEZE — V1

Status: Design Freeze Candidate
Version: 1.0

## Freeze Scope

V1 için aşağıdaki alanlar kanonik olarak dondurulmuştur:
- Vision / V1 scope / domain boundaries
- Core business rules
- Roles & permission model
- Primary user flows
- C4/UML/PostgreSQL/OpenAPI/Event/ADR architecture contracts baseline
- UI screen/state inventory as reference design
- Backend business logic and domain service boundaries
- Agent/tool/memory/orchestration model
- Material ingestion/OCR/provenance model
- Training authoring composition model
- AI generation/evaluation/quality pipeline
- Prompt library baseline
- Golden dataset baseline
- Backend-first sprint roadmap
- Coding-agent sprint packaging model

## Backend-First Implementation Order

Canonical order is defined by `docs/10-sprints/BACKEND_FIRST_SPRINT_ROADMAP_V1.md`.

Frontend implementation begins after backend contract completion and critical backend E2E qualification.

## Frozen Hard Invariants

Changes require explicit change issue/ADR and requalification:
- tenant isolation
- authorization/object-level access
- assessment integrity
- domain source-of-truth boundaries
- original evidence/provenance preservation
- untrusted content cannot gain instruction/tool authority
- AI tool boundaries
- AI-derived/conversation memory cannot override authoritative domain truth
- AI hard gates cannot be bypassed by weighted score
- critical AI content requires policy-defined human review
- published/versioned integrity rules

## Standards Baseline

Global standards are sourced from `necdetoskay/engineering-standards`, including:
- STD-TEST-001 Issue Done & Qualification
- STD-TEST-002 ULTEF Core Framework
- STD-TEST-003 ULTEF Test Profile & Gate Model
- STD-AI-001 Prompt Library Baseline
- STD-AI-002 Golden Dataset Baseline
- STD-AI-003 Agent Capability & Tool Boundary
- STD-AI-004 AI Memory & Context
- STD-AI-005 AI-Assisted Authoring
- STD-AI-006 AI Generation & Quality Qualification
- STD-ARCH-001 Domain/Application/Infrastructure
- STD-ARCH-002 Transaction/Outbox/Idempotency
- STD-ARCH-003 Document Ingestion/OCR/Provenance
- STD-AGENT-001 Coding Agent Sprint Package

## Deferred / Backlog

The following are not automatically V1 commitments unless promoted through an explicit issue/change decision:
- AI Tutor
- Competency Graph / Skill Gap
- Adaptive Learning
- Native Mobile
- SCORM/xAPI and enterprise integrations
- Gamification/social learning/AI media
- Multilingual external source discovery & YouTube research (#18), unless promoted into active V1 scope

## Change Control

After Design Freeze:
1. Open change issue.
2. Identify affected canonical docs/contracts/sprints/tests.
3. Create/update ADR when architecture or invariant changes.
4. Re-run applicable ULTEF design/contract gates.
5. Update Design Freeze baseline/version if accepted.

## Implementation Readiness

Sprint 01 may start when Design Freeze qualification PASS evidence exists and no blocking design issue remains.