# V1 Sprint Roadmap

## Amaç

Tasarım kararlarını kontrollü şekilde çalışan ürüne dönüştürmek. Sprint sırası dependency-first ve AI-first yaklaşımı birlikte gözetir.

## Sprint 00 — Design Freeze & Canonical Documentation

V1 scope, domain boundaries, architecture, AI harness, API/data contracts, UI inventory ve test/ULTEF yaklaşımını kanonikleştir.

## Sprint 01 — Repository & Engineering Foundation

Monorepo/app yapısı, local development, configuration, CI başlangıcı, lint/typecheck/test/build ve temel observability.

## Sprint 02 — Identity / Organization / RBAC

Authentication, tenant/organization, personnel/user model, role/permission ve güvenli erişim temeli.

## Sprint 03 — AI Runtime Harness Foundation

Provider abstraction, Model Registry, Model Router, tier policy, Prompt Registry, structured output, metering, tracing, retry/fallback ve ULTEF adapter iskeleti.

## Sprint 04 — Training Domain & Content Management

Eğitim, modül, video/metin/doküman kaynakları, transcript ilişkisi, içerik lifecycle ve yönetim UI.

## Sprint 05 — Learning / Assignment / Progress

Personele eğitim atama, zorunlu video/içerik kuralları, ilerleme, yarıda kalıp devam etme ve learner dashboard temeli.

## Sprint 06 — Question Bank Domain

Soru havuzu/bankası, soru tipleri, difficulty, tags, source evidence, manual authoring ve klasik soru havuzu akışı.

## Sprint 07 — Assessment Engine

Sınav oluşturma, soru seçme, süre, geçme notu, attempt limit, kişiye özel güvenli erişim, autosave/resume ve submission.

## Sprint 08 — AI Content Intelligence

Transcript/metin/doküman analizi, topic extraction, learning objectives, source/context preparation ve outline generation.

## Sprint 09 — AI Question Generation

Konu, metin ve transcript kaynaklarından structured soru üretimi; question type distribution ve difficulty kontrolü.

## Sprint 10 — AI Quality & Human Review

Quality Evaluator, automated checks, human review queue, approve/reject/regenerate ve generator/evaluator bağımsızlığı.

## Sprint 11 — Results / Retake / Certification

Scoring, result lifecycle, başarısız kullanıcı için yeniden sınav talebi/politikası, sertifikalar ve geçmiş sonuçlar.

## Sprint 12 — Learning Insights & Analytics

Concept/topic bazlı başarı, eğitim/soru analizi, öğrenme boşlukları ve kontrollü Learning Insight Agent önerileri.

## Sprint 13 — Notifications & Operational Workflows

E-posta/link gönderimi, sınav/eğitim atama bildirimleri, reminder, job visibility ve operasyon ekranları.

## Sprint 14 — ULTEF Full Qualification

Functional/domain/API/E2E ve AI qualification profillerinin tam sistem üzerinde çalıştırılması; current/candidate model benchmark altyapısı.

## Sprint 15 — Security / Performance / Stabilization

Tenant isolation, auth hardening, security scans, rate limits, performance/load, failure recovery ve kritik regresyonlar.

## Sprint 16 — V1 Release Candidate

Production-like deployment, migration/backup/rollback testleri, UAT, release checklist, known limitations ve v1 go/no-go.

## V1 Sonrası

- Advanced personalization
- Autonomous tutor benzeri yetenekler
- Native/cross-platform mobile application
- Offline-first mobile
- Geniş enterprise integration ecosystem

Bunlar v1 sprintlerine scope creep olarak eklenmez.
