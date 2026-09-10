# VCE-OM-13 — Personel İçe Aktarma

Canonical ID: `VCE-OM-EMPLOYEE-IMPORT-001`
Visual shorthand: `VCE-OM-13`
Status: APPROVED
Branch: `design/organization-management-canonical-v1`

## Module
Personel İçe Aktarma

## Screens
- Dosya/Kaynak Seçimi
- Kolon Eşleme
- Doğrulama
- Çakışma Çözümü
- Önizleme
- Sonuç

## Purpose
CSV/Excel tabanlı personel içe aktarma işlemini güvenli, denetlenebilir ve employment history'yi koruyan bir akışla yürütmek.

## Core Rules
- Import mevcut employment geçmişini sessizce overwrite etmez.
- Yeni şirket/departman/pozisyon/lokasyon eşleşmeleri kanonik Organization Management veri modeline göre doğrulanır.
- Bilinmeyen veya çelişkili referanslar kullanıcıya satır bazında gösterilir.
- Mevcut employee ile eşleşme employee_no, external identity ve kontrollü alternatif anahtarlarla yapılır.
- Aynı import tekrarlandığında idempotency ilkeleri uygulanır; aynı satır yan etkisi çoğaltılmaz.
- Uyarı içeren satırlar açık kullanıcı kararı olmadan otomatik uygulanmaz.
- Hatalı satırlar başarılı satırların uygulanmasını zorunlu olarak engellemez; import sonucu satır bazında raporlanır.
- Transfer niteliğindeki organizasyon değişiklikleri yeni employment kaydı açarak uygulanır.
- Import preview ile uygulanacak değişiklikler kullanıcıya önceden gösterilir.
- İşlem audit log üretir.

## Validation Summary
Görselde en az şu metrikler yer alır:
- toplam satır
- geçerli
- uyarı
- hata
- yeni personel
- güncellenecek personel

## Conflict Examples
- Şirket bulunamadı
- Departman eşleşmedi
- Pozisyon bulunamadı
- Lokasyon bulunamadı
- Yönetici referansı geçersiz
- Employee number çakışması
- External identity çakışması
- Geçersiz effective date / overlapping employment

## Data Relationships
Primary entities:
- `employees`
- `employments`
- `companies`
- `departments`
- `positions`
- `locations`
- `employee_external_identities`
- audit events

## API Relationships
Contractually tied to Organization Management import endpoints and job/result resources defined in `ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`.

## UX Requirements
- Wizard/stepper kullanılmalı.
- Hata/uyarılar satır bazında seçilebilir ve çözülebilir olmalı.
- Çakışma çözüm paneli kaynak değer ile hedef entity'yi yan yana göstermeli.
- Uygulamadan önce preview zorunlu olmalı.
- Sonuç ekranı başarılı/başarısız/atlanmış satırları ayrı göstermeli.
- Kısmi başarı açıkça raporlanmalı.

## Canonical Constraint
Bu VCE, `ORGANIZATION_MANAGEMENT_INTENT_V1.md`, `ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`, `ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`, `ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md` ve `ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md` ile çelişemez.
