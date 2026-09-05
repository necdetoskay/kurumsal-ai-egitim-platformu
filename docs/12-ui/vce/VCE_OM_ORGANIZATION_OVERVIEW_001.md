# VCE-OM-ORGANIZATION-OVERVIEW-001 — Organizasyon Genel Bakış

Status: APPROVED
Visual shorthand: VCE-OM-08
Date: 2026-09-05
Branch: `design/organization-management-canonical-v1`

## 1. Amaç

Organizasyonun şirket, personel, departman ve grup yapısını tek ekranda özetlemek; eğitim hedefleme hazırlığını ve dikkat gerektiren yapısal sorunları görünür kılmak.

## 2. Kanonik Kaynaklar

- `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
- `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
- `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
- `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
- `docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`
- `docs/12-ui/ORGANIZATION_MANAGEMENT_UI_CONTRACT_V1.md`

Bu VCE yukarıdaki kanonik sözleşmeleri zayıflatamaz veya tersine çeviremez.

## 3. Modül ve Ekran Kapsamı

Modül: Organizasyon Genel Bakış

Ekranlar / bileşenler:
- Organizasyon kimlik özeti
- KPI kartları
- Şirket/personel dağılımı
- Kurulum hazırlığı
- Hızlı işlemler
- Son organizasyon değişiklikleri
- Dikkat gerektirenler
- Denetim geçmişine geçiş

## 4. Header / Organization Identity

Gösterilecek minimum alanlar:
- organization name
- code
- status
- sector (varsa)
- default language
- timezone

Ana aksiyon:
- `Organizasyonu Düzenle`

## 5. KPI Kartları

Minimum KPI seti:
- Toplam / aktif şirket sayısı
- Aktif personel sayısı
- Departman sayısı
- Aktif grup sayısı

KPI değerleri doğrudan write-model sayaçlarından değil güvenilir aggregate/read-model sorgularından türetilmelidir.

## 6. Şirket Dağılımı

Her şirket için en az:
- şirket adı
- aktif personel sayısı
- organizasyon içindeki yüzdesel dağılım

Bu görünüm organizasyonun çok şirketli yapısını açıkça göstermek zorundadır.

## 7. Kurulum Hazırlığı

Eğitim ataması öncesi temel organization readiness kontrolü:
- Organization
- Companies
- Department Tree
- Positions
- Employees
- Groups

Durumlar örneğin:
- COMPLETE
- PARTIAL
- MISSING
- READY

UI kullanıcıya boş/eksik yapı nedeniyle yapılması gereken bir sonraki işlemi gösterebilir.

## 8. Hızlı İşlemler

En az:
- Şirket ekle
- Personel ekle
- Grup oluştur
- Personel içe aktar

Aksiyon görünürlüğü capability + scope authorization kurallarına tabidir.

## 9. Son Organizasyon Değişiklikleri

Audit/read model üzerinden son olaylar gösterilir. Örnekler:
- department moved
- employee assignment changed
- employee created
- dynamic group reconciled
- external directory sync completed

Her satır minimum:
- timestamp
- actor
- action
- target/summary

## 10. Dikkat Gerektirenler

Kullanıcıya operasyonel tutarsızlık veya eksik yapı gösterebilir. Örnekler:
- aktif birincil employment olmayan çalışanlar
- pasif departmanda aktif employment
- başarısız/eksik external identity eşlemesi
- eksik organization setup

Bu kartlar karar desteğidir; domain invariant ihlallerini gizleyemez.

## 11. Domain Bağları

Birincil varlıklar:
- organizations
- companies
- departments
- employees
- employments
- groups
- group_memberships
- audit events
- employee_external_identities / sync jobs

## 12. API Bağları

Bu ekran Organization Management API Contract V1 içindeki read endpoints/projections ile beslenir. UI doğrudan persistence tablolarına bağlanmaz.

Önerilen read contract grupları:
- organization summary
- organization readiness
- company distribution
- recent organization events
- organization warnings / integrity insights

## 13. Yetkilendirme

- Tenant context client tarafından belirlenemez.
- Kullanıcı yalnızca yetkili organization/scope verisini görebilir.
- Hızlı aksiyonlar ilgili mutation capability yoksa gösterilmez veya disabled + açıklamalı olur.

## 14. Responsive

Desktop-first.

Tablet/mobile:
- KPI kartları 2 kolon / tek kolon olabilir.
- dağılım ve warning kartları stack olur.
- son değişiklikler timeline/list formatına döner.
- hızlı işlemler sticky veya compact action sheet olabilir.

## 15. Visual Reference

Approved visual filename:
`VCE-OM-08-Organizasyon-Genel-Bakis.png`

Visual shorthand:
`VCE-OM-08`

## 16. Acceptance Criteria

- Tenant ve organization kavramları karıştırılmıyor.
- Multi-company yapı görünür.
- Employee placement doğrudan employees tablosundan varsayılmıyor.
- Readiness organization → company → department → position → employee/group hattını yansıtıyor.
- Audit events ve integrity warnings görünür.
- Yetkisiz aksiyon oluşturulamıyor.
- Hard delete aksiyonu yok.
- VCE kanonik domain/API kurallarıyla çelişmiyor.
