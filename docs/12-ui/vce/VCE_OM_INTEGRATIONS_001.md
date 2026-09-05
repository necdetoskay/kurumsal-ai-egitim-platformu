# VCE-OM-INTEGRATIONS-001 — Entegrasyonlar

Status: APPROVED
Visual shorthand: VCE-OM-14
Branch: design/organization-management-canonical-v1

## Purpose
Organization Management için harici personel ve organizasyon veri kaynaklarını görünür, izlenebilir ve yönetilebilir biçimde sunmak.

## Screens
- Entegrasyon kartları
- Bağlantı durumu
- Son senkronizasyon
- Hata/uyarı görünümü
- Yapılandırma
- Manuel senkronizasyon
- Son sync job geçmişi

## Supported sources
- Active Directory / LDAP
- CSV / Excel
- HR API
- ERP

## Core UI rules
- Her entegrasyon bağımsız kart olarak gösterilir.
- Durum, son sync zamanı, işlenen kayıt sayısı ve hata/uyarı sayısı görünür olmalıdır.
- Yapılandırma ve manuel senkronizasyon ayrı aksiyonlardır.
- Başarısız/kısmi sync kullanıcıdan gizlenmez.
- Job geçmişi ayrı izlenebilir tablo olarak sunulur.
- Harici kaynaktan gelen veri Organization Management domain kurallarını bypass edemez.
- Import/sync mevcut employment history kayıtlarını sessizce overwrite edemez.
- External identity mapping canonical `employee_external_identities` modeliyle uyumlu olmalıdır.
- Sync işlemleri auditable olmalıdır.

## Domain references
- employee_external_identities
- employees
- employments
- companies
- departments
- positions
- locations
- audit events

## API references
- Organization Management API Contract V1 integration/import endpoints
- Sync jobs must expose status, processed counts, warnings, failures and safe diagnostics.

## Visual reference
Approved visual: `VCE-OM-14-Entegrasyonlar.png`
