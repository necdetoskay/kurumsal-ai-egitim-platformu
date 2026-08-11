# Training Authoring Composition & AI-Assisted Course Build — V1

Status: Canonical backend design
Related issue: #17

## 1. Goal

Bir eğitimin yalnızca metin üretimi olarak değil; amaç, hedef kitle, kaynak, Learning Objective, modül yapısı, evidence, soru, kalite ve human review zinciriyle oluşturulmasını tanımlar.

## 2. Authoring Inputs

- training topic / intent
- target audience
- learner level
- expected duration / depth
- mandatory vs optional training intent
- manual author notes
- processed internal source materials
- discovered external sources (#18) when enabled
- existing training/content assets
- approved Learning Objectives
- tenant/org context explicitly allowed by policy
- reusable Question Bank assets
- delivery/output language

## 3. Training Brief

Her authoring run önce structured Training Brief üretir.

Minimum fields:
- topic
- purpose
- audience
- prerequisite knowledge
- target level
- target language
- desired duration
- learning mode/style constraints
- compliance/mandatory context if any
- source policy
- assessment requirement
- certification requirement if applicable

Brief human tarafından girilebilir veya AI tarafından taslaklanıp onaylanabilir.

## 4. Course Build Pipeline

`Training Brief -> Source Plan -> Learning Objectives -> Coverage Check -> Outline -> Module Composition -> Content Draft -> Evidence Linkage -> Question/Assessment Draft -> Quality Evaluation -> Human Review -> Publish Readiness -> Versioned Publish`

## 5. Source Planning

Kaynaklar üç gruba ayrılır:

### Primary Sources
Resmî, authoritative veya training'in temel doğruluğunu taşıyan kaynaklar.

### Supporting Sources
Açıklama, örnek, görsel yaklaşım veya farklı anlatım sunan kaynaklar.

### Optional Enrichment Sources
Ek okuma/video/derinleşme için kullanılır; temel claim doğruluğunu tek başına taşımaz.

External discovery kullanılırsa popularity tek başına kaynak seçme ölçütü değildir. Source authority, relevance, freshness, coverage, evidence quality ve diversity birlikte değerlendirilir.

## 6. Learning Objective Design

Learning Objective course authoring'in merkezidir.

Her objective:
- açık ve ölçülebilir olmalı
- hedef kitle seviyesine uygun olmalı
- source evidence ile desteklenebilmeli
- en az bir content section/module ile ilişkilendirilmeli
- assessment gerekiyorsa en az bir ölçüm stratejisine bağlanabilmeli

AI objective önerir; human/editor onaylayabilir/düzeltebilir.

## 7. Coverage Matrix

Publish öncesi traceability matrisi oluşturulur:

`Learning Objective -> Source Evidence -> Module/Section -> Question/Assessment Evidence`

Amaç orphan objective, unsupported content veya ölçülmeyen kritik objective kalmasını engellemektir.

## 8. Outline & Module Composition

Her module en az:
- module purpose
- linked objectives
- prerequisites if applicable
- ordered sections
- estimated duration
- source/evidence set
- interaction/assessment touchpoint where applicable

taşır.

Generic section patterns:
- concept introduction
- explanation
- example
- scenario/case
- procedure/steps
- comparison
- recap
- knowledge check

AI outline önerebilir fakat training brief ve objective coverage constraint'lerini aşamaz.

## 9. Content Composition

Content block türleri V1'de en az:
- rich text
- list
- callout
- example
- scenario/case
- source quote/excerpt reference
- image/diagram reference
- video reference
- downloadable/resource reference
- knowledge check

Generated content raw source'u kopyalamak yerine evidence-grounded synthesis üretmelidir.

## 10. AI vs Human Responsibilities

### AI may
- brief draft
- source summary/comparison
- objective suggestions
- outline/module draft
- content draft
- examples/scenarios
- question draft
- language/localization draft
- gap/coverage detection

### Human must retain authority for
- final objective acceptance where required
- source selection override
- compliance-sensitive claims
- critical content approval
- question approval before production use
- publish decision

AI output domain truth veya published content değildir.

## 11. Multilingual Authoring

Source language ile output language ayrıdır.

Örnek:
`EN source -> EN evidence -> TR working interpretation -> TR training content`

Original evidence korunur. Translation/localization versioned derived artifact'tır.

## 12. Reuse

Reused content/question/source linkage source version ve provenance ile taşınmalıdır.

Reuse modes:
- clone-and-edit new version
- reference shared approved asset
- reuse source/evidence only

Published training history silent mutation ile değiştirilmez.

## 13. Missing Evidence / Low Confidence

AI bir section veya claim için yeterli evidence bulamazsa:
- fabricate etmez
- gap signal üretir
- source discovery önerir (#18)
- human input ister/queue'ya düşürür
- unsupported draft publish-readiness'i bloklar

## 14. Question & Assessment Composition

Question Generation #16 kalite pipeline'ına bağlıdır.

Question coverage:
- linked objective
- evidence locator
- difficulty
- answer/explanation
- quality status
- human review status

Assessment blueprint objective distribution ve difficulty distribution tanımlayabilir.

## 15. Publish Readiness

Hard blockers:
- required metadata missing
- orphan Learning Objective
- required objective has no content coverage
- unsupported critical claim
- required question/assessment not approved
- source/evidence integrity failure
- review-required content not approved
- tenant/auth violation
- critical quality gate failure

Warnings:
- optional objective weak coverage
- excessive module duration
- low source diversity
- stale external source
- localization warning

Publish action deterministic readiness service tarafından değerlendirilir; LLM tek başına publish kararı vermez.

## 16. Cost Control

Authoring pipeline her adımda LLM kullanmaz.

- deterministic coverage checks
- cached source summaries when valid
- reuse approved prior outputs when lineage matches
- batch generation when quality permits
- cheap model tier for drafting, stronger tier only on complexity/quality escalation
- model/prompt cost telemetry

## 17. Authoring State

Suggested lifecycle:

`BRIEF_DRAFT -> SOURCES_READY -> OBJECTIVES_READY -> OUTLINE_READY -> CONTENT_DRAFT -> QUALITY_REVIEW -> HUMAN_REVIEW -> PUBLISH_READY -> PUBLISHED`

Failure/rework transitions önceki valid state'e kontrollü dönüş yapabilir.

## 18. Integration Boundaries

- #15 supplies READY evidence-aware sources
- #18 may supply external source candidates that still pass #15
- #16 evaluates generated content/questions
- Question Bank owns approved production questions
- Training context owns final training/version/objective state
- AI Runtime owns prompt/model lineage, not training truth

## 19. ULTEF Authoring Profile

Required scenarios:
- topic only -> structured brief draft
- brief + internal source -> objective/outline
- multilingual source -> target-language course
- conflicting sources -> human review required
- missing evidence -> publish blocked
- orphan objective -> publish blocked
- objective without assessment coverage when required -> blocked
- AI draft edited by human -> lineage preserved
- reused asset -> version/provenance preserved
- stale external source warning
- cost escalation path
- deterministic publish readiness

Hard gates:
- evidence integrity
- Learning Objective traceability
- human review for critical AI content
- no unsupported claim promotion
- tenant isolation
- deterministic publish readiness

## 20. Definition of Done

Training brief'ten publish-ready version'a kadar bütün authoring orchestration; source/evidence, Learning Objective, modules, questions, multilingual support, AI/human authority, cost control ve readiness hard gates ile tanımlıdır.