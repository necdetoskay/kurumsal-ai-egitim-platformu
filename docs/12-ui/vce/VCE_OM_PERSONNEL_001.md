# VCE-OM-PERSONNEL-001 — Personel Yönetimi

**Durum:** APPROVED  
**Onay tarihi:** 2026-08-27  
**Modül:** Organizasyon Yönetimi / Personel Yönetimi  
**VCE sürümü:** 1.0  
**Görsel referans:** `../../../ui-mockups/vce/VCE-OM-PERSONNEL-001.jpg`  
**Görsel etiketi:** `VCE-OM-04`  
**Kaynak render gen_id:** `8dadf9bd-acc6-4756-bf1e-1d991ab68e65`

## 1. Amaç
Bu VCE, personellerin şirket, departman, pozisyon, grup ve yönetici ilişkileriyle birlikte listelenmesi, görüntülenmesi ve CRUD işlemlerinin yürütülmesi için onaylanmış görsel/etkileşim sözleşmesidir.

## 2. Kapsanan ekranlar
- Personel listesi
- Personel özet/detay paneli
- Yeni Personel Ekle formu
- Personel Düzenle formu

## 3. Liste sözleşmesi
KPI alanında en az Toplam Personel, Aktif Personel, Pasif Personel ve Atanmış Eğitim bulunur. Arama ve filtrelerde Şirket, Departman, Grup ve Durum desteklenir. Tabloda en az Ad Soyad, Sicil No, Şirket, Departman, Pozisyon, Grup, Durum ve İşlemler gösterilir.

## 4. Personel özeti
Seçili personel için avatar, ad soyad, sicil no, durum, şirket, departman, pozisyon, grup, yönetici, e-posta, telefon, işe giriş tarihi ve açıklama görünür.

## 5. CRUD form sözleşmesi
Minimum alanlar:
- Ad *
- Soyad *
- Sicil No *
- E-posta *
- Telefon
- Şirket *
- Departman *
- Pozisyon *
- Grup
- Yönetici
- Durum *
- İşe Giriş Tarihi *
- Açıklama

Aksiyonlar: İptal, Kaydet; düzenlemede Güncelle ve kontrollü Sil/Pasifleştir.

## 6. Veri ve iş kuralları
İlgili varlıklar: `employees`, `employments`, `companies`, `departments`, `positions`, `groups`, `group_memberships`, `users`. Employee ile User aynı kavram değildir. Şirket/departman/pozisyon değişiklikleri tarihsel `employment` kayıtlarıyla korunur. Pasif personel hard-delete edilmez; eğitim ve atama geçmişi korunur.

## 7. Görsel dil ve responsive
Şirket ve Departman VCE'lerinde kabul edilen koyu sidebar + açık içerik + beyaz kart + mavi/mor primary accent görsel dili korunur. Desktop görsel ana referanstır; tablet/mobilde tablo ve form tek/az kolonlu responsive düzene dönüşebilir.

## 8. Onay kaydı
Kullanıcı 2026-08-27 tarihinde `Sözleşmeyi ekle` ifadesiyle Personel Yönetimi tasarımını onaylamıştır.

**Canonical reference:** `VCE-OM-PERSONNEL-001`
