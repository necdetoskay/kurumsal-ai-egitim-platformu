# VCE-OM-COMPANY-001 — Şirket Yönetimi

**Durum:** APPROVED  
**Onay tarihi:** 2026-08-27  
**Modül:** Organizasyon Yönetimi / Şirket Yönetimi  
**VCE sürümü:** 1.0  
**Görsel referans:** `../../../ui-mockups/vce/VCE-OM-COMPANY-001.svg`  
**Kaynak render gen_id:** `afcc0843-1ce0-43e6-82da-6dd4c5bf55e7`

## 1. Amaç

Bu VCE, Kurumsal AI Eğitim Platformu içindeki **Şirket Yönetimi** modülünün onaylanmış görsel ve etkileşim sözleşmesidir. Şirket liste ekranı ve şirket oluştur/düzenle CRUD formu bu sözleşmeye göre uygulanacaktır.

Bu belge ve bağlı görsel, aynı modülün ilerideki implementasyonlarında varsayılan tasarım referansıdır. Görsel yapı veya temel etkileşim modeli değiştirilecekse yeni bir VCE sürümü oluşturulmalıdır.

## 2. Kapsanan ekranlar

### VCE-OM-COMPANY-LIST
- Şirketler liste sayfası
- KPI özet kartları
- arama ve filtreleme
- tablo görünümü
- durum rozetleri
- satır bazlı görüntüle/düzenle/diğer işlemler
- sayfalama
- yeni şirket oluşturma CTA'sı

### VCE-OM-COMPANY-FORM
- Şirket oluşturma
- Şirket düzenleme
- Temel Bilgiler
- İletişim
- Adres
- Organizasyon Bağlantısı
- Notlar
- aktiflik ve eğitim atamalarında kullanılabilirlik kontrolleri
- İptal / Kaydet aksiyonları
- sağ yardımcı/önizleme alanı

## 3. Görsel dil

- Web-first kurumsal SaaS yönetim arayüzü.
- Sol tarafta koyu lacivert kalıcı ana navigasyon.
- Ana içerik açık arka plan üzerinde beyaz kartlardan oluşur.
- Birincil aksiyon ve aktif navigasyon rengi mavi.
- Başarı durumu yeşil, pasif/uyarı durumu sıcak turuncu tonuyla gösterilir.
- Kartlar düşük kontrastlı border, hafif radius ve kontrollü gölge kullanır.
- Yoğun tablo verisi korunur fakat satırlar ve filtre alanları ferah bırakılır.
- Tipografi sade sans-serif; başlık, yardımcı metin ve veri hiyerarşisi açık olmalıdır.
- Renk tek başına durum anlamı taşımamalı; metin/ikon/rozet eşlik etmelidir.

## 4. Global shell sözleşmesi

### Sidebar
Şirket Yönetimi ekranlarında aşağıdaki shell korunur:
- Ana Sayfa
- Dashboard
- Eğitim Yönetimi
- Katalog
- Kullanıcılar
- Organizasyon Yönetimi
  - Şirketler (aktif)
  - Departmanlar
  - Pozisyonlar
  - Lokasyonlar
  - Roller
  - İzin Politikaları
- Raporlar
- İletişim
- Ayarlar

Sidebar daraltılabilir olmalıdır.

### Topbar
- breadcrumb
- global arama ikonu
- bildirim ikonu + sayaç
- kullanıcı avatarı
- kullanıcı adı + rol
- hesap menüsü

## 5. Liste ekranı sözleşmesi

### Başlık alanı
- `Şirketler`
- yardımcı metin: organizasyon yapısındaki şirketleri yönetme amacı
- sağda birincil `Yeni Şirket Ekle` CTA

### KPI kartları
Minimum dört özet:
1. Toplam Şirket
2. Aktif
3. Pasif
4. Çalışan

KPI kartları liste tablosunun yerine geçmez; hızlı durum özeti sağlar.

### Filtre bölümü
- serbest metin şirket arama
- Durum
- Sektör
- Şehir
- Filtreleri Temizle
- Dışa Aktar

### Tablo
Minimum kolonlar:
- seçim
- Şirket Adı
- Kısa Kod
- Sektör
- Şehir
- Çalışan
- Durum
- İşlemler

İşlem alanında en az:
- görüntüle
- düzenle
- diğer işlemler menüsü

### Liste state'leri
Implementasyon aşağıdakileri ayrıca desteklemelidir:
- loading/skeleton
- empty
- no-filter-result
- error
- permission denied
- populated/success

## 6. CRUD form sözleşmesi

Form tek uzun düz alan listesi olarak değil, anlamlı bölümler halinde sunulur.

### 6.1 Temel Bilgiler
- Şirket Adı *
- Kısa Kod *
- Vergi No
- Durum *

### 6.2 İletişim
- E-posta
- Telefon
- Web Sitesi

### 6.3 Adres
- Ülke
- Şehir
- Adres

### 6.4 Organizasyon Bağlantısı
- Ana Organizasyon *
- Departman ağacı / başlangıç bağlamı
- Yönetici

### 6.5 Notlar
- serbest metin not alanı

### 6.6 Lifecycle kontrolleri
- Aktif
- Eğitim atamalarında kullanılabilir

### 6.7 Form aksiyonları
- `İptal` secondary
- `Kaydet` primary

Kaydet sırasında loading/disabled state zorunludur. Validation hataları ilgili field seviyesinde görünür olmalıdır.

## 7. Sağ yardımcı panel

Desktop genişliğinde formun sağında yardımcı alan kullanılabilir:
- şirket önizlemesi
- kısa kod/vergi no/organizasyon bağlantısı gibi alanlarla ilgili bağlamsal ipuçları

Dar ekranlarda bu alan ana formun altına taşınmalıdır; form genişliğini kullanılamaz hale getirmemelidir.

## 8. Veri modeli bağları

Bu VCE aşağıdaki domain varlıklarıyla uyumludur:
- `organizations`
- `companies`
- `departments`
- `employees`
- `employments`
- `positions`
- `locations`
- `groups`
- `group_memberships`

Şirket ekranında gösterilen çalışan sayısı hesaplanan/aggregate bir değerdir; şirket kaydının doğrudan mutable alanı değildir.

## 9. İş kuralları

- `tenant_id` kullanıcı girdisi olarak seçilmez; güvenlik bağlamından gelir.
- şirket bir Organization'a ait olmalıdır.
- şirket kodu kendi geçerli scope'unda benzersiz olmalıdır.
- pasife alınan şirket hard-delete edilmez; tarihsel eğitim ve çalışan kayıtları korunur.
- başka şirketlere ait departmanlar şirket formunda bağlanamaz.
- şirketin pasifliği geçmiş assignment/completion kayıtlarını değiştirmez.

## 10. Responsive davranış

### Desktop
Onaylı görsel ana referanstır.

### Tablet
- KPI kartları 2x2 olabilir.
- tablo yatay kaydırma veya kolon önceliklendirme kullanabilir.
- form sağ paneli alta taşınabilir.

### Mobile web
- sidebar drawer'a dönüşür.
- KPI kartları dikey/2 kolon akışa dönüşür.
- tablo yerine responsive row/card presentation uygulanabilir; veri anlamı değişmemelidir.
- CRUD form tek kolon olur.

## 11. VCE değişiklik politikası

Aşağıdakiler VCE değişikliği gerektirir:
- ana navigation modelinin değişmesi
- liste yerine tamamen farklı presentation pattern kullanılması
- CRUD formunun modal/drawer gibi farklı ana pattern'e taşınması
- temel renk/hiyerarşi sisteminin değiştirilmesi
- Şirket Yönetimi'nin temel bilgi mimarisinin değiştirilmesi

Küçük spacing, copy veya accessibility düzeltmeleri yeni VCE gerektirmez; ancak onaylı tasarımın genel karakterini değiştirmemelidir.

## 12. Onay kaydı

Kullanıcı tarafından 2026-08-27 tarihinde `Uygun bunu kayıt edelim` ifadesiyle onaylanmıştır.

**Canonical reference:** `VCE-OM-COMPANY-001`
