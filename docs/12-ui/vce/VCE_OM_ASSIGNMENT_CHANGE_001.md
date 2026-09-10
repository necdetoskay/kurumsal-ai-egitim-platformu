# VCE-OM-11 — Atama Değişikliği / Employment Transfer

Status: APPROVED
Canonical ID: VCE-OM-ASSIGNMENT-CHANGE-001
Visual shorthand: VCE-OM-11
Date: 2026-09-05
Branch: design/organization-management-canonical-v1

## Purpose

Personelin mevcut organizasyonel yerleşimini geçmişi ezmeden değiştirmek için kullanılan kanonik ekran sözleşmesidir.

## Screens

- Mevcut atama özeti
- Yeni atama formu
- Efektif tarih
- Eski/yeni atama karşılaştırma önizlemesi
- Doğrulama kontrolleri
- Onay / kayıt

## Mandatory Fields

- effective_date
- company_id
- department_id
- position_id (optional)
- location_id (optional)
- manager_employment_id (optional)
- employment_type
- is_primary

## Canonical Behavior

- Mevcut aktif employment satırı overwrite edilmez.
- Efektif tarihten önceki gün mevcut kayıt kapatılır.
- Yeni atama için yeni employment satırı oluşturulur.
- Tarihçe korunur.
- Department aynı company içinde olmak zorundadır.
- Employee / company / position / location aynı tenant/organization sınırlarında olmalıdır.
- Çakışan primary employment oluşturulamaz.
- Manager employment geçerli ve aynı scope içinde olmalıdır.
- İşlem audit event üretir.

## Validation UX

Kaydetmeden önce kullanıcıya şu kontroller görünür biçimde sunulur:
- aynı şirket / geçerli scope
- geçerli departman
- employment tarih çakışması yok
- yönetici ilişkisi geçerli

## Preview

Eski ve yeni employment kayıtları yan yana gösterilir. Kullanıcı mevcut kaydın hangi tarihte kapanacağını ve yeni kaydın hangi tarihte başlayacağını açıkça görür.

## API Mapping

- GET /api/v1/employees/{employeeId}
- GET /api/v1/employees/{employeeId}/employments
- POST /api/v1/employees/{employeeId}/employment-transfers

## Domain Mapping

- employees
- employments
- companies
- departments
- positions
- locations

## Non-Negotiable Rule

Employee kimliği ile employment yerleşimi birbirine karıştırılamaz. Atama değişikliği personel ana kaydındaki company/department alanlarını ezerek uygulanamaz.
