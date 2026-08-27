# VCE-OM-DEPARTMENT-001 — Departman Yönetimi

**Durum:** APPROVED  
**Onay tarihi:** 2026-08-27  
**Modül:** Organizasyon Yönetimi / Departman Yönetimi  
**VCE sürümü:** 1.0  
**Görsel referans:** `../../../ui-mockups/vce/VCE-OM-DEPARTMENT-001.jpg`  
**Görsel etiketi:** `VCE-OM-03`  
**Kaynak render gen_id:** `8c7aa96d-9f45-4bd5-af29-0e9099d32aed`

## 1. Amaç
Bu VCE, şirket içindeki departmanların hiyerarşik biçimde görüntülenmesi, oluşturulması, düzenlenmesi ve yönetilmesi için onaylanmış görsel/etkileşim sözleşmesidir.

## 2. Kapsanan ekranlar
- Departman listesi
- Hiyerarşik departman ağacı
- Departman özet/detay paneli
- Yeni Departman Ekle formu
- Departman Düzenle formu

## 3. Liste ve ağaç sözleşmesi
Liste alanında en az Departman Adı, Kod, Üst Departman, Çalışan Sayısı, Durum ve İşlemler bulunur. Hiyerarşi expand/collapse destekler; şirket seçimiyle departman ağacı scope'lanır. Arama, filtreleme, yenileme, dışa aktarma ve sayfalama desteklenir.

Departman ağacı aynı verinin hiyerarşik temsilidir; bir departmanın parent ilişkisi açıkça görünür. Sürükle-bırak gibi yeniden sıralama davranışları uygulanacaksa parent/company bütünlüğü korunmalıdır.

## 4. CRUD form sözleşmesi
Form minimum şu alanları içerir:
- Departman Adı *
- Kod *
- Üst Departman
- Durum *
- Açıklama
- Sıralama
- Departman Yöneticisi

Aksiyonlar: İptal, Kaydet; düzenlemede Güncelle ve kontrollü Sil/Pasifleştir. Form validation field seviyesinde görünür olmalı; kaydetme sırasında loading/disabled state zorunludur.

## 5. Veri ve iş kuralları
İlgili varlıklar: `companies`, `departments`, `employments`, `positions`, `employees`. `parent_department_id` recursive hiyerarşiyi kurar. Bir departmanın parent'ı başka şirkete ait olamaz. Kullanım geçmişi bulunan departman hard-delete edilmez; pasifleştirilir ve tarihsel kayıtlar korunur.

## 6. Görsel dil
Koyu lacivert sidebar, açık ana zemin, beyaz kartlar, mavi/mor primary accent, yeşil aktif state, kontrollü border/radius/gölge kullanılır. Şirket Yönetimi VCE'lerinde kabul edilen global shell ve tipografi korunur.

## 7. Responsive
Desktop onaylı görsel ana referanstır. Tablet ve mobilde tablo kolonları önceliklendirilebilir; ağaç, özet ve form panelleri alt alta akabilir. Veri ilişkileri ve hiyerarşik anlam değişmemelidir.

## 8. Onay kaydı
Kullanıcı 2026-08-27 tarihinde departman tasarımını `Kaydedelim ve sonrakine geçelim` ifadesiyle onaylamıştır.

**Canonical reference:** `VCE-OM-DEPARTMENT-001`
