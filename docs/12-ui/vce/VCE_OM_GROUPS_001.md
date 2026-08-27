# VCE-OM-GROUPS-001 — Gruplar Yönetimi

**Durum:** APPROVED  
**Onay tarihi:** 2026-08-27  
**Modül:** Organizasyon Yönetimi / Gruplar Yönetimi  
**VCE sürümü:** 1.0  
**Görsel referans:** `../../../ui-mockups/vce/VCE-OM-GROUPS-001.jpg`  
**Görsel etiketi:** `VCE-OM-05`  
**Kaynak render gen_id:** `d70cc044-978d-44b6-abf5-30029acb9f43`

## 1. Amaç
Bu VCE, organizasyon yapısından bağımsız eğitim/iş gruplarının oluşturulması, üyelerinin yönetilmesi ve manuel/dinamik üyelik modelinin kullanılabilmesi için onaylanmış görsel/etkileşim sözleşmesidir.

## 2. Kapsanan ekranlar
- Grup listesi
- Grup özet/detay paneli
- Yeni Grup Ekle formu
- Grup Düzenle formu
- Üye seçimi/yönetimi
- Dinamik grup kural tanımı

## 3. Liste sözleşmesi
KPI alanında en az Toplam Grup, Aktif Grup, Dinamik Grup ve Toplam Üye bulunur. Arama/filtrelerde Tür, Durum ve Şirket desteklenir. Tabloda en az Grup Adı, Tür, Şirket, Üye Sayısı, Durum, Güncelleme ve İşlemler gösterilir.

Grup türleri UI'da açıkça ayırt edilir. V1 veri modelindeki temel tipler `MANUAL`, `DYNAMIC`, `SYSTEM` olmakla birlikte ürün sunumunda Departman Grubu, Komite Grubu veya Eğitim Grubu gibi iş etiketleri kullanılabilir; bunlar domain tipiyle karıştırılmamalıdır.

## 4. Grup özeti
Seçili grup için ad, durum, tür, şirket/scope, üye sayısı, açıklama, oluşturulma tarihi, son güncelleme, etiketler ve üye önizlemesi gösterilir.

## 5. CRUD form sözleşmesi
Minimum alanlar:
- Grup Adı *
- Tür *
- Şirket/scope
- Durum *
- Açıklama
- Etiketler
- Manuel Üye Ekle
- Dinamik grup için Kural Tanımı

Aksiyonlar: İptal, Kaydet; düzenlemede Güncelle ve kontrollü Sil/Pasifleştir.

## 6. Dinamik grup davranışı
`DYNAMIC` gruplarda kullanıcı koşulları tanımlar; sistem eşleşen personelleri otomatik olarak üyeliğe alır/çıkarır. Kural kaynaklı üyelik ile manuel üyelik kaynağı audit edilebilir olmalıdır. Dinamik kurallar daha sonra genişletilebilir fakat VCE'de kural ekleme alanı için yer ayrılmıştır.

## 7. Veri ve iş kuralları
İlgili varlıklar: `groups`, `group_memberships`, `employees`, `companies`, `departments`, `positions`, ileride `dynamic_group_rules`. Bir personel birden fazla gruba üye olabilir. Üyelik kaldırıldığında geçmiş kayıt silinmez; geçerlilik sonu ile kapanır. Eğitim atamaları grup hedefini kullanabilir.

## 8. Görsel dil ve responsive
Önceki Organization Management VCE'lerinde kabul edilen koyu lacivert sidebar, açık zemin, beyaz kartlar ve mavi/mor accent korunur. Desktop görsel ana referanstır; tablet/mobilde liste, özet ve form panelleri responsive olarak alt alta akabilir.

## 9. Onay kaydı
Kullanıcı 2026-08-27 tarihinde `Sözleşme olarak kaydet sıradakine geçelim` ifadesiyle Gruplar Yönetimi tasarımını onaylamıştır.

**Canonical reference:** `VCE-OM-GROUPS-001`
