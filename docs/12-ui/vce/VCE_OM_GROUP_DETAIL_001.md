# VCE-OM-12 — Grup Detayı

Status: APPROVED
Canonical ID: VCE-OM-GROUP-DETAIL-001
Visual shorthand: VCE-OM-12
Module: Grup Detayı
Screens: Üyeler + Eğitim Atamaları + Dinamik Kurallar + Üyelik Geçmişi

## Purpose
Grup detay ekranı, manual/dynamic/system grup yapısını tek yerde görünür kılar; üyelik geçmişini ve eğitim atamalarını korur.

## Canonical Rules
- Grup üyeliği fiziksel silinmez; ayrılan üyelik `valid_until` ile kapatılır.
- Dynamic group üyeliği doğrudan elle değiştirilmez; kural değerlendirmesi/reconcile akışı kullanılır.
- Grup ve üye aynı tenant/organization scope içinde olmalıdır.
- Group type: MANUAL, DYNAMIC, SYSTEM.
- Üyelik kaynağı görünür olmalıdır: MANUAL/RULE/IMPORT/SYSTEM.
- Eğitim atamaları grup üyeliğinden bağımsız audit edilebilir olmalıdır.

## UI Contract
Header:
- group name
- type badge
- active member count
- status
- Edit Group action

Tabs:
1. Üyeler
2. Eğitim Atamaları
3. Kurallar
4. Geçmiş

Members tab:
- employee
- company
- department
- position
- membership source
- valid_from / active state
- filters by company/department/search

Dynamic rule summary:
- field
- operator/value
- last evaluation
- estimated/current members
- rule preview action

## Data Bindings
- groups
- group_memberships
- dynamic_group_rules
- employees
- employments
- training_assignment_audiences
- audit events

## API Bindings
- GET /api/v1/groups/{groupId}
- GET /api/v1/groups/{groupId}/members
- GET /api/v1/groups/{groupId}/rules
- POST /api/v1/groups/{groupId}/rules/evaluate
- POST /api/v1/groups/{groupId}/rules/reconcile
- GET /api/v1/groups/{groupId}/history

## Non-Negotiable UX Behavior
- `Delete member` label kullanılmaz; `Remove from group`/`Gruptan çıkar` kullanılır.
- Historical membership remains queryable.
- Dynamic rule sonuçları preview edilmeden destructive-looking bulk changes yapılmaz.

## Visual Reference
Approved visual: `VCE-OM-12-Grup-Detayi.png`

## Traceability
Intent: `docs/01-intent/ORGANIZATION_MANAGEMENT_INTENT_V1.md`
Architecture: `docs/06-architecture/ORGANIZATION_MANAGEMENT_ARCHITECTURE_V1.md`
Data: `docs/07-data/ORGANIZATION_MANAGEMENT_DATA_MODEL_V1.md`
Business Rules: `docs/03-business-rules/ORGANIZATION_MANAGEMENT_BUSINESS_RULES_V1.md`
API: `docs/09-api/ORGANIZATION_MANAGEMENT_API_CONTRACT_V1.md`
