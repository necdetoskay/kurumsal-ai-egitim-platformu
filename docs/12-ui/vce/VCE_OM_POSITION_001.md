# VCE-OM-POSITION-001 — Pozisyon Yönetimi

**Durum:** APPROVED  
**Onay tarihi:** 2026-08-27  
**Modül:** Organizasyon Yönetimi / Pozisyon Yönetimi  
**VCE sürümü:** 1.0  
**Görsel referans:** `VCE-OM-06`  
**Kaynak görsel:** `VCE-OM-06-Pozisyon-Yonetimi.png`

## 1. Amaç

Bu VCE, Kurumsal AI Eğitim Platformu içindeki **Pozisyon Yönetimi** modülünün onaylanmış görsel ve etkileşim sözleşmesidir. Pozisyon liste ekranı, pozisyon özet/detay alanı ve pozisyon oluştur/düzenle CRUD formları bu sözleşmeye göre uygulanacaktır.

## 2. Kapsanan ekranlar

### VCE-OM-POSITION-LIST
- Pozisyon liste sayfası
- KPI özet kartları
- arama ve filtreleme
- tablo görünümü
- seviye, yönetici pozisyonu, çalışan sayısı, scope ve durum kolonları
- satır bazlı görüntüle/düzenle/diğer işlemler
- sayfalama
- `Yeni Pozisyon` CTA

### VCE-OM-POSITION-SUMMARY
- seçili pozisyon özet/detay kartı
- pozisyon adı ve kodu
- seviye
- yönetici pozisyonu bilgisi
- atanmış personel sayısı
- scope
- açıklama
- durum

### VCE-OM-POSITION-FORM
- pozisyon oluşturma
- pozisyon düzenleme
- pozisyon adı
- kod
- seviye
- durum
- yönetici pozisyonu kontrolü
- scope
- açıklama
- İptal / Kaydet / Güncelle / Sil aksiyonları

## 3. Görsel dil

- Kurumsal SaaS admin arayüzü.
- Sol tarafta koyu lacivert kalıcı navigasyon.
- Açık arka plan ve beyaz kart sistemi.
- Mor/mavi vurgu rengi birincil aksiyonlarda ve aktif navigasyonda kullanılır.
- Aktif durum yeşil, pasif durum kırmızı/pembe rozet ile gösterilir.
- Kartlar hafif border, yumuşak radius ve kontrollü gölge kullanır.
- Yoğun tablo verisi okunabilir spacing ile sunulur.
- Önceki onaylı Organization Management VCE referanslarının shell ve component dili korunur.

## 4. Liste ekranı sözleşmesi

### KPI kartları
Minimum dört özet:
1. Toplam Pozisyon
2. Aktif Pozisyon
3. Yönetici Pozisyonu
4. Atanmış Personel

### Filtreler
- serbest metin arama
- Seviye
- Durum
- Scope
- Filtrele
- Yenile
- Dışa Aktar

### Tablo minimum kolonları
- Pozisyon Adı
- Kod
- Seviye
- Yönetici?
- Çalışan
- Scope
- Durum
- İşlemler

## 5. CRUD form sözleşmesi

### Temel alanlar
- Pozisyon Adı *
- Kod *
- Seviye *
- Durum *
- Yönetici Pozisyonu *
- Scope
- Açıklama

### Aksiyonlar
- `İptal`
- `Kaydet`
- düzenleme modunda `Güncelle`
- düzenleme modunda `Sil`

Kaydet/Güncelle sırasında loading ve disabled state zorunludur. Validation hataları ilgili field seviyesinde gösterilmelidir.

## 6. Veri modeli bağları

Bu VCE aşağıdaki veri modeline bağlıdır:
- `positions`
- `organizations`
- `companies`
- `employees`
- `employments`

Atanmış personel sayısı aggregate bir değerdir; `positions` tablosunda manuel mutable sayaç olarak tutulmamalıdır.

## 7. İş kuralları

- Pozisyon bir Organization kapsamına aittir.
- Gerekiyorsa scope şirket seviyesine daraltılabilir.
- `code` geçerli scope içinde benzersiz olmalıdır.
- `level` organizasyon içi seviye/seniority ve dinamik grup kurallarında kullanılabilir.
- `is_managerial` / yönetici pozisyonu niteliği yetkilendirme ve dinamik grup senaryolarını besleyebilir.
- Pasife alınan pozisyon hard-delete edilmez.
- Tarihsel employment kayıtlarının pozisyon referansları korunur.
- Pozisyon silme, bağlı aktif employment varsa doğrudan fiziksel silme şeklinde uygulanmamalıdır.

## 8. Responsive davranış

### Desktop
`VCE-OM-06` ana görsel referanstır.

### Tablet
- KPI kartları 2x2 olabilir.
- tablo kolon önceliklendirme/yatay kaydırma kullanabilir.
- özet kartı listenin altına taşınabilir.

### Mobile web
- sidebar drawer olur.
- liste responsive card/row görünümüne dönüşebilir.
- CRUD formu tek kolon olur.
- veri anlamı ve aksiyon hiyerarşisi korunmalıdır.

## 9. VCE değişiklik politikası

Aşağıdakiler yeni VCE sürümü gerektirir:
- ana liste presentation pattern'inin değiştirilmesi
- pozisyon özet/detay panelinin kaldırılması
- CRUD yapısının modal/drawer gibi farklı ana pattern'e taşınması
- temel navigation veya görsel hiyerarşinin değiştirilmesi
- seviye/scope/yönetici pozisyonu bilgi mimarisinin değiştirilmesi

Küçük spacing, metin ve accessibility iyileştirmeleri yeni VCE gerektirmez.

## 10. Onay kaydı

Kullanıcı tarafından 2026-08-27 tarihinde `Sözleşme olarak kaydedelim sıradakine geçelim` ifadesiyle onaylanmıştır.

**Canonical reference:** `VCE-OM-POSITION-001`
