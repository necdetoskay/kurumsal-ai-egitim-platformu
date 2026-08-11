# ADR-011 — V1 API & Repository Runtime Baseline

Status: Accepted
Sprint: 01 — Repository & Engineering Foundation
Related issue: #19
Related PR: #20

## Context

V1 modular-monolith kararının implementation seviyesinde çalışır bir backend foundation'a dönüştürülmesi için repository/package manager, runtime, HTTP framework, database access/migration ve test harness seçimlerinin açık biçimde kaydedilmesi gerekir.

## Decision

V1 backend foundation aşağıdaki baseline ile ilerler:

- Node.js 22+
- TypeScript
- pnpm workspace
- Fastify 5 API runtime
- PostgreSQL transactional source of truth
- Drizzle ORM + drizzle-kit migration tooling
- Redis ephemeral cache/coordination/readiness dependency
- Vitest test harness
- Docker Compose local PostgreSQL/Redis dependencies
- GitHub Actions CI foundation gate

## Rationale

- Mevcut V1 modular-monolith ve API-first kararlarıyla uyumlu olması.
- Type-safe backend contracts ve küçük/modüler package sınırları sağlaması.
- PostgreSQL migration'larının repository içinde version-controlled tutulabilmesi.
- Fastify'ın küçük API shell'den daha büyük modular-monolith yapısına büyüyebilmesi.
- Redis'in domain source-of-truth olmadan operasyonel/ephemeral görevlerde kullanılabilmesi.
- CI içinde typecheck, test, build, migration ve runtime readiness'in aynı qualification zincirinde çalıştırılabilmesi.

## Runtime Health Contract

- `/healthz`: process liveness; dış bağımlılık gerektirmez.
- `/readyz`: serving readiness; gerekli PostgreSQL ve Redis bağlantılarını kontrol eder.
- Dependency failure domain state'i değiştirmez ve readiness başarısızlığı açıkça raporlanır.

## Consequences

- Domain/application code provider/framework detaylarından mümkün olduğunca ayrıştırılacaktır.
- PostgreSQL dışındaki cache/queue katmanları authoritative business truth değildir.
- Schema değişiklikleri migration ile yönetilir.
- Architecture-significant framework değişikliği yeni ADR ve ULTEF regression qualification gerektirir.

## Deferred

Aşağıdakiler bu ADR ile çözülmez:

- authentication provider/library (Sprint 02)
- RBAC framework (Sprint 02)
- PostgreSQL RLS kararı (Sprint 02)
- production queue/job technology (ADR-B04)
- full observability stack / exporter/backend seçimi (ADR-B10)
- OpenAPI runtime schema-generation strategy'nin son biçimi (Sprint 12'ye kadar contract alignment ile kesinleştirilebilir)

## Qualification

Bu karar Sprint 01 ULTEF Foundation Profile ile doğrulanacaktır: install, typecheck, unit smoke, build, migration generate/apply ve dependency-aware readiness smoke PASS olmalıdır.
