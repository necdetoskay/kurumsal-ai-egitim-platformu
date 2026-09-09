# AEGIS MUR — Mission / Usage Review

**Status:** Working canonical review package  
**Scope:** Kurumsal AI Eğitim Platformu V1  
**Baseline branch:** `main`  
**Review date:** 2026-09-09

## Purpose

AEGIS MUR, uygulamanın mevcut mimari ve backlog'unu yalnız teknik doğruluk açısından değil, ürünün temel amacı açısından değerlendirir.

Başlangıç noktası dokümantasyonu okuyup mevcut sistemi açıklamak değildir. Önce ürünün temel amacı, çözmek istediği gerçek problem, hedef kullanıcılar, beklenen iş sonuçları, kritik başarı ölçütleri, zorunlu kısıtlar ve non-goals sabitlenir. Ardından dokümanlar, epic/issue'lar, kod, API, veri modeli, testler, UI akışları, operasyonel süreçler ve altyapı bu amaca karşı sınıflandırılır.

## Review verdict

**MISSION ALIGNED / EXECUTION DRIFTED**

Ürünün temel vizyonu ve çekirdek mimari yönü korunmalıdır. Yeniden yazma önerilmez. Ancak geliştirme öncelikleri ana öğrenme döngüsünden uzaklaşmış, Organization Management V1 bazı alanlarda HR/ERP yönüne genişlemiş ve mission-level başarı kanıtı teknik gate'lerin gerisinde kalmıştır.

## Canonical MUR package

1. `PURPOSE_BASELINE_V1.md` — ürünün neden var olduğu ve V1 başarı tanımı
2. `CAPABILITY_CENSUS_V1.md` — mevcut/planlı capability sınıflandırması
3. `PURPOSE_TRACEABILITY_MATRIX_V1.md` — capability -> amaç -> kullanıcı -> iş sonucu -> karar izi
4. `DRIFT_GAP_REGISTER_V1.md` — scope drift, eksik mission capability ve governance sapmaları
5. `RECOVERY_ROADMAP_V1.md` — V1'i yeniden ana öğrenme döngüsüne bağlayan uygulama sırası

## Classification vocabulary

- **KEEP** — amacı doğrudan destekler; korunur.
- **COMPLETE** — amacı destekler fakat uçtan uca tamamlanmalıdır.
- **RESCOPE** — gerekli capability'dir fakat mevcut sınırı V1 ihtiyacını aşmaktadır.
- **DEFER** — değerli olabilir fakat V1 başarısı için gerekli değildir.
- **REMOVE** — tekrarlı, amaçsız veya açıkça yanlış yönlendiren çalışma; V1 aktif planından çıkarılır.

Capability importance:

- **CORE** — ürünün kullanıcıya sunduğu temel değer.
- **DIFFERENTIATOR** — ürünü sıradan LMS/sınav sisteminden ayıran temel değer.
- **ENABLER** — core capability'lerin güvenli/ölçeklenebilir çalışmasını sağlar.
- **ADJACENT** — yardımcı fakat doğrudan mission-critical olmayan yetenek.

## Hard MUR rule

Bir capability aşağıdaki sorulardan en az birine güçlü cevap veremiyorsa V1'e otomatik olarak giremez:

1. Hangi temel ürün amacına hizmet ediyor?
2. Hangi V1 kullanıcı problemini çözüyor?
3. Hangi ölçülebilir iş/öğrenme sonucunu mümkün kılıyor?
4. Hangi kritik akışın çalışması için zorunlu?
5. Güvenlik, veri bütünlüğü veya operasyonel zorunluluk nedeniyle mi gerekli?

## V1 mission acceptance scenario

V1 ancak aşağıdaki senaryo gerçek DB + gerçek API + gerçek UI üzerinden çalıştığında mission-complete kabul edilir:

> Eğitmen güvenilir kaynaklardan AI yardımıyla evidence-linked bir eğitim oluşturur; kritik AI çıktıları insan kontrolünden geçer; eğitim organizasyon/şirket/departman/grup/personel hedeflerine güvenli biçimde atanır; çalışan eğitime başlar, kaldığı yerden devam eder, assessment'ı tamamlar; sistem deterministic sonuç ve Learning Objective bazlı evidence üretir; yeterli kanıt varsa weak-area insight ve ilgili içeriğe yönlendirme üretir; şartları karşılıyorsa sertifika verir; yönetici aynı öğrenme sinyallerini güvenli ve toplulaştırılmış kurumsal görünümde izler.

Bu senaryo tamamlanmadan HR/ERP genişlemesi, AI Tutor, gamification, native mobile veya benzeri yeni ürün genişlemeleri V1 blocker olarak değerlendirilemez.
