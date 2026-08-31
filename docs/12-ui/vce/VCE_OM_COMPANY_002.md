# VCE-OM-COMPANY-002 — Şirket Yönetimi Birleşik Görünüm

**Durum:** APPROVED  
**Onay tarihi:** 2026-08-27  
**Modül:** Organizasyon Yönetimi / Şirket Yönetimi  
**VCE sürümü:** 1.0  
**Kaynak render gen_id:** `db3e4748-df76-411e-b2df-a83f068279e3`  
**İlişkili VCE:** `VCE-OM-COMPANY-001`

## 1. Amaç

Bu VCE, Şirket Yönetimi modülünün kullanıcı tarafından onaylanan ikinci görsel kompozisyonunu kaydeder. Referans; şirket liste ekranı ile `Yeni Şirket Ekle` ve `Şirket Düzenle` CRUD formlarını aynı tasarım panosunda birlikte gösterir.

`VCE-OM-COMPANY-001` temel şirket yönetimi görsel dilini tanımlar. Bu belge ise liste + create + edit görünümünün birlikte nasıl sunulacağını kanonikleştirir. İki VCE birbiriyle çelişmez; 002, özellikle birleşik CRUD kompozisyonu için ek referanstır.

## 2. Kapsanan ekranlar

### VCE-OM-COMPANY-LIST
- Şirketler liste sayfası
- üst KPI kartları
- şirket arama ve filtreleme
- dışa aktarma
- satır bazlı görüntüle / düzenle / diğer işlemler
- durum rozetleri
- sayfalama
- `Yeni Şirket` birincil CTA

### VCE-OM-COMPANY-CREATE
- `Yeni Şirket Ekle`
- Genel Bilgiler
- Şirket Adı
- Kısa Kod
- Resmi Unvan
- Vergi Numarası
- Kuruluş Tarihi
- Durum
- İletişim Bilgileri
- Adres Bilgileri
- İptal / Kaydet

### VCE-OM-COMPANY-EDIT
- `Şirket Düzenle`
- create form ile aynı temel alan grupları
- mevcut verilerin prefilled gösterimi
- `Pasifleştir` destructive secondary action
- `İptal` / `Güncelle`

## 3. Yerleşim sözleşmesi

Desktop ana referansında:

1. Sol tarafta koyu lacivert kalıcı uygulama navigasyonu bulunur.
2. Üst bölümde şirket liste ekranı tam genişliğe yakın ana çalışma alanını kullanır.
3. Liste altında iki eş ağırlıklı form paneli yan yana gösterilir:
   - sol: Yeni Şirket Ekle
   - sağ: Şirket Düzenle
4. Liste ekranında sağ tarafta bağlamsal `Şirket Yönetimi Hakkında` yardım kartı bulunabilir.
5. Oluşturma ve düzenleme formu aynı alan sırasını mümkün olduğunca paylaşır; kullanıcı create/edit arasında yeni bir form mantığı öğrenmez.

Gerçek uygulamada create/edit aynı anda açık olmak zorunda değildir. Bu VCE panosu, iki CRUD state'inin ortak görsel sözleşmesini tek referansta göstermek amacıyla birleştirilmiştir.

## 4. Görsel dil

- Kurumsal, temiz, modern SaaS admin arayüzü.
- Açık gri/beyaz içerik zemini.
- Koyu lacivert sidebar.
- Birincil aksiyonlarda lacivert/mavi.
- Aktif durumlarda açık yeşil badge.
- Pasif/destructive işlemlerde kontrollü kırmızı veya nötr pasif ton.
- Kartlar ince border ve hafif radius kullanır.
- Form alanları sade, label-first ve grid hizalıdır.
- Veri tablolarında yüksek okunabilirlik ve düşük görsel gürültü esastır.

## 5. Sidebar bilgi mimarisi

Organizasyon bölümü minimum olarak:
- Genel Bakış
- Şirketler
- Organizasyon Ağacı / Departmanlar
- Personeller
- Gruplar
- Pozisyonlar
- Lokasyonlar

Ayarlar bölümü minimum olarak:
- Entegrasyonlar
- Kullanıcılar ve Roller
- Sistem Ayarları

İsimlendirme implementasyon sırasında uygulama genel navigasyon sözleşmesi ile normalize edilebilir; ana bilgi mimarisi korunmalıdır.

## 6. Liste veri sözleşmesi

Minimum kolonlar:
- Şirket Adı
- Kısa Kod
- Vergi Numarası
- Kuruluş Tarihi
- Çalışan Sayısı
- Durum
- İşlemler

Minimum KPI'lar:
- Toplam Şirket
- Aktif Şirket
- Pasif Şirket
- Toplam Çalışan

`Çalışan Sayısı` aggregate/read-model değeridir; şirket kaydının doğrudan düzenlenebilir alanı değildir.

## 7. CRUD davranışları

### Create
- zorunlu alanlar açıkça işaretlenir
- validation field seviyesinde gösterilir
- save sırasında buton disabled/loading olur
- başarılı kayıtta liste/read-model yenilenir

### Edit
- mevcut değerler formda yüklenir
- değişmeyen alanlar gereksiz şekilde yeniden yazılmaz
- pasifleştirme hard-delete değildir
- pasifleştirme için confirmation gerekir
- tarihsel eğitim/personel ilişkileri korunur

## 8. Responsive kural

- Desktop: VCE ana referansı.
- Tablet: create/edit form grid'i tek kolona veya ardışık panellere düşebilir.
- Mobile web: sidebar drawer olur; tablo responsive card/list biçimine dönüşebilir; CRUD form tek kolondur.

## 9. Uygulama önceliği

Şirket Yönetimi implementasyonu yapılırken sıralama:
1. Shell/navigation
2. Liste + KPI + filtre
3. Create form
4. Edit form
5. destructive lifecycle aksiyonları
6. loading/empty/error/permission states

## 10. Onay kaydı

Kullanıcı tarafından 2026-08-27 tarihinde `Bunuda sözleşme olarak ekleyip sıradaki ne gecelim` ifadesiyle onaylanmıştır.

**Canonical reference:** `VCE-OM-COMPANY-002`
