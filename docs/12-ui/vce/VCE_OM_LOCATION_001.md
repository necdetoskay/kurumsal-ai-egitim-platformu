# VCE — Organization Management — Location Management — V1

Status: APPROVED CANONICAL
Canonical ID: VCE-OM-LOCATION-001
Human-facing shorthand: VCE-OM-07
Module: Lokasyon Yönetimi
Version: 1.0
Canonical branch: design/organization-management-canonical-v1

## 1. Purpose

Bu VCE, Organization Management bounded context içindeki fiziksel çalışma lokasyonlarının yönetim ekranlarını tanımlar.

Lokasyonlar departman değildir. Bir lokasyon; merkez ofis, bölge ofisi, şantiye, depo, fabrika veya diğer fiziksel çalışma noktalarını temsil eder.

## 2. Covered Screens

- Lokasyon listesi
- Lokasyon özeti/detayı
- Yeni lokasyon oluşturma
- Lokasyon düzenleme
- Pasifleştirme akışı

## 3. Canonical Domain Mapping

Primary entities:
- `locations`
- `companies`
- `employments`

Related read models:
- active employee count by location
- company scope
- location type distribution

## 4. Required List View

Header:
- `Lokasyonlar`
- açıklama
- `Yeni Lokasyon` primary action

KPI cards:
- Toplam Lokasyon
- Aktif Lokasyon
- Şantiye
- Atanmış Personel

Filters:
- search
- location type
- company
- status

Minimum table columns:
- Lokasyon Adı
- Tür
- Şirket
- Şehir
- Personel
- Durum
- İşlemler

Supported actions:
- Aç
- Düzenle
- Pasifleştir

Hard-delete action MUST NOT be exposed for historically referenced locations.

## 5. Location Detail / Summary

Minimum fields:
- name
- code
- type
- company scope
- city
- district
- postal code
- full address
- employee count
- active/passive state
- default/primary marker when supported

## 6. Create / Edit Form

Required or canonical fields:
- `name` — required
- `code` — required
- `location_type` — required
- `organization_id` — server/domain context
- `company_id` — optional according to scope
- `city`
- `district`
- `postal_code`
- `address`
- `status`

The UI must not allow cross-tenant or cross-organization company selection.

## 7. Canonical Lifecycle Rules

- Lokasyon silinmez; kullanım geçmişi varsa pasifleştirilir.
- Pasif lokasyon yeni employment atamalarında varsayılan olarak seçilemez.
- Geçmiş employment kayıtları pasif lokasyonu göstermeye devam eder.
- Bir lokasyonun şirket kapsamı değiştirilecekse mevcut employment etkisi kontrol edilmeden doğrudan taşınamaz.

## 8. Validation Rules

- code uniqueness follows canonical data contract.
- company must belong to the same organization/tenant.
- type values follow domain enum.
- invalid company scope returns canonical validation error.
- optimistic concurrency/version conflict is surfaced to the user rather than silently overwriting changes.

## 9. Visual Language

Must inherit Organization Management shell:
- dark navy persistent sidebar
- light content canvas
- purple/blue primary actions
- green success/active badge
- warning/passive badges using text + icon, never color alone
- rounded enterprise cards
- dense but readable tables
- contextual detail panel

## 10. Responsive Rules

Desktop is primary.

Tablet/mobile:
- sidebar becomes drawer
- KPI cards stack or use two-column layout
- filters move into a drawer
- dense table can degrade into responsive cards
- create/edit forms become single-column

## 11. Required States

- loading
- empty
- no-results
- validation error
- permission denied
- optimistic concurrency conflict
- save success
- passivation confirmation

## 12. API Traceability

List/read/create/update/passivate actions must bind to the Organization Management API contract, especially location endpoints and scope/authorization rules.

The VCE MUST NOT invent direct hard-delete behavior if the domain/API contract only supports lifecycle transition.

## 13. Approval Record

Approved visual shorthand: `VCE-OM-07`
Approved by: product owner
Canonicalized into: `VCE-OM-LOCATION-001`

This document supersedes any draft location UI behavior that conflicts with the canonical Intent, Architecture, Data Model, Business Rules or API Contract.
