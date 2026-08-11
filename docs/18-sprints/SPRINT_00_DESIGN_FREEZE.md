# Sprint 00 — Design Freeze & Canonical Documentation

## Goal

V1 implementasyonuna başlamadan önce konuşmalarda kesinleşen ürün, domain, mimari, AI, veri, API, UI ve kalite kararlarını tek repo içinde kanonik hale getirmek ve scope'u dondurmak.

## Business Value

- Proje karışıklığını önler.
- Coding agent ve geliştiricinin tahminle karar vermesini azaltır.
- V1 scope creep riskini düşürür.
- Sonraki sprintlerin kabul kriterlerini ölçülebilir hale getirir.
- AI model/prompt değişimini baştan governance altına alır.

## In Scope

### Foundation
- VISION.md
- SCOPE.md
- OUT_OF_SCOPE.md veya Scope belgesi içinde açık bölüm
- PROJECT_CONTEXT.md
- PROJECT_PRINCIPLES.md
- glossary
- constraints / assumptions
- decision log

### Product & Domain
- roller ve ana kullanıcı akışları
- bounded contexts / module map
- core business rules
- training/content/question/assessment/attempt/result/certificate lifecycle
- eski çalışan sistemden korunacak davranışların doğrulanması

### Architecture
- C4 context/container/component
- modular monolith boundaries
- persistence/data boundaries
- async job/event boundaries
- deployment assumptions

### AI
- AI Runtime Harness
- 5-agent V1 catalog
- model tiers
- Model Router/Registry
- promotion policy
- ULTEF AI profile
- golden dataset strategy
- acceptance gates
- prompt/structured-output/human-review policy

### Contracts
- PostgreSQL schema baseline
- index strategy
- OpenAPI 3.1 baseline
- event catalog/schema baseline
- ADR baseline

### UI/UX
- role-based screen inventory
- critical user flows
- HTML mockups for critical flows
- responsive web principles

### Quality
- test strategy
- ULTEF integration approach
- Definition of Ready
- Definition of Done
- sprint roadmap

## Out of Scope

- production feature implementation
- native mobile implementation
- autonomous tutor
- broad external integrations
- premature microservices split
- final provider/model commitment without benchmark evidence

## Work Breakdown

### S00-T01 — Foundation Review
Geçmiş konuşmalardaki vision, scope, constraints ve product principles maddelerini doğrula ve kanonikleştir.

**Acceptance**
- V1 ve Later ayrımı açık.
- Çelişen eski kararlar işaretlenmiş veya superseded.
- Mobil V1 dışında.

### S00-T02 — Domain Freeze
Ana domain'leri, aggregate/lifecycle ve business-rule sınırlarını doğrula.

**Acceptance**
- Training, Content, Question Bank, Assessment, Assignment/Attempt, Result, Certification, AI ve Analytics sınırları tanımlı.
- Domain dili glossary ile tutarlı.

### S00-T03 — Architecture Freeze
C4, ADR ve module dependency kararlarını kanonik hale getir.

**Acceptance**
- Feature kodu provider SDK'ya doğrudan bağımlı değil.
- Modular monolith başlangıç yaklaşımı açık.
- Data ownership ve event boundaries tanımlı.

### S00-T04 — AI Architecture Freeze
Harness, agent catalog, tier/router/registry, evaluation ve human review kararlarını tamamla.

**Acceptance**
- V1 agent sayısı ve sorumlulukları açık.
- Tier isimleri model isimlerinden bağımsız.
- Model promotion ULTEF gate'e bağlı.
- Hard gates weighted score ile bypass edilemiyor.

### S00-T05 — Contract Baseline Review
DB, OpenAPI ve Event Catalog'u domain kararlarıyla çapraz doğrula.

**Acceptance**
- Ana entity ve endpoint boşluğu yok.
- Tenant scope kritik tablolarda/endpoint'lerde görünür.
- Attempt autosave/resume ve secure access için contract yönü tanımlı.

### S00-T06 — UI/UX Flow Review
Admin, instructor ve learner kritik ekran/akışlarını doğrula.

**Acceptance**
- Eski çalışan sistemde önemli olan personel, soru havuzu, sınav wizard, learner dashboard, resume ve certificate akışları kapsanmış.
- Kritik akışlar HTML mockup veya ekran spec ile temsil edilmiş.

### S00-T07 — Quality & ULTEF Baseline
Sprint gate modelini tanımla.

**Acceptance**
- Her implementation sprintinde minimum test katmanı tanımlı.
- AI sprintlerinde golden-set + prompt/model/schema/cost/latency/safety değerlendirmesi zorunlu.
- Mevcut ULTEF L/M terminolojisi yeniden tanımlanmıyor; kanonik ULTEF kaynağına bağlanacak.

### S00-T08 — Sprint Roadmap Freeze
Sprint 01–16 için goal, dependency ve high-level exit criteria hazırla.

**Acceptance**
- Sprint sırası dependency-first.
- AI Harness feature AI sprintlerinden önce geliyor.
- Release stabilization ayrı sprintlerde planlı.

### S00-T09 — Design Freeze Record
`DESIGN_FREEZE_V1.md` üret.

**Acceptance**
- Açık blocker listesi boş veya kabul edilmiş.
- Yeni fikirlerin varsayılan olarak backlog'a gideceği açık.
- Sprint 01 başlayabilir kararı verilebilir.

## Risks

### Over-documentation
Mitigation: 20/80 kuralı; yalnızca implementasyonu etkileyen kararlar Sprint 00 blocker olabilir.

### Hidden scope growth
Mitigation: Every new requirement classified as V1 blocker / V1 normal / Later.

### Premature model choice
Mitigation: Provider/model seçimi ULTEF evidence sonrası.

### Inconsistent historical documents
Mitigation: ZIP/taslak belgeler kanonik kabul edilmez; konuşma kararlarıyla yeniden doğrulanır.

## ULTEF Gate for Sprint 00

Sprint 00 kod sprinti değildir; gate doküman ve contract consistency odaklıdır.

- required canonical docs present
- no unresolved critical contradiction
- API ↔ domain consistency review
- DB ↔ domain consistency review
- event ↔ state transition consistency review
- AI architecture ↔ ULTEF policy consistency review
- screen inventory ↔ V1 flow coverage review

## Definition of Done

Sprint 00 tamamlandı sayılır ancak:

- VISION kanonik
- SCOPE kanonik
- domain map kanonik
- architecture baseline kanonik
- AI architecture kanonik
- DB/API/event contracts review edilmiş
- critical UI flows review edilmiş
- V1 sprint roadmap onaylı
- `DESIGN_FREEZE_V1.md` oluşturulmuş
- Sprint 01 için blocker kalmamış

olduğunda.

## Deliverables

- canonical docs tree
- design freeze record
- Sprint 01 specification için verified input set
- backlog/later listesi
- unresolved non-blocking questions listesi
