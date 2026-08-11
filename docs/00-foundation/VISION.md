# Product Vision — Kurumsal AI Eğitim Platformu

**Status:** Canonical v1  
**Last reviewed:** 2026-08-11

## 1. Vision

Kurumsal AI Eğitim Platformu; kurumların eğitim içeriğini oluşturma, yönetme, sunma ve değerlendirme süreçlerini yapay zekâ ile güçlendiren; yalnızca eğitim tamamlama oranlarını değil gerçek öğrenme düzeyini ve öğrenme boşluklarını ölçmeyi hedefleyen; bu verileri kişiselleştirilmiş gelişim önerilerine ve kurumsal içgörülere dönüştüren AI-first bir kurumsal öğrenme platformudur.

Platformun amacı yalnızca bir LMS veya çevrimiçi sınav sistemi oluşturmak değildir. Eğitim, assessment, sertifika, soru bankası, video ve içerik yönetimi daha büyük bir sürekli öğrenme döngüsünün parçalarıdır.

## 2. Core Problem

Klasik kurumsal eğitim sistemleri çoğunlukla şu sorulara cevap verir:

- Eğitim kime atandı?
- Kim tamamladı?
- Sınavdan kaç puan aldı?
- Sertifika oluştu mu?

Bu platform bunların ötesinde şu sorulara cevap vermeyi hedefler:

- Çalışan gerçekten öğrendi mi?
- Hangi konularda zorlandı?
- Hangi eğitim bölümleri yeterince etkili değil?
- Hangi sorular kalitesiz, belirsiz veya yanlış zorluk seviyesinde?
- Ekip veya departman seviyesinde ortak öğrenme boşlukları var mı?
- Çalışan hangi içeriği tekrar çalışmalı?
- Eğitim içeriğinin hangi bölümleri geliştirilmelidir?

## 3. Continuous Learning Loop

```text
Kurumsal Bilgi / Eğitim Kaynağı
              │
              ▼
       Eğitim Oluşturma
              │
              ▼
        AI Destek Katmanı
       ┌──────┼──────┐
       │      │      │
     İçerik  Soru   Kalite
     üretimi üretimi analizi
       └──────┼──────┘
              ▼
        İnsan Kontrolü
              │
              ▼
       Eğitimin Yayınlanması
              │
              ▼
        Çalışanın Öğrenmesi
              │
              ▼
          Assessment
              │
              ▼
       Öğrenme Analitiği
              │
       ┌──────┴──────┐
       ▼             ▼
   Başarılı       Eksik Konu
       │             │
 Sertifika       Öneri / Tekrar
                     │
                     ▼
                Yeni Öğrenme
```

Temel ürün döngüsü:

> Eğitim oluştur → öğren → değerlendir → eksikleri belirle → geliştir → tekrar değerlendir.

## 4. AI as a Horizontal Capability

AI platformda tek bir özellik veya yalnızca “AI ile soru oluştur” butonu değildir. AI, farklı domainlerde kullanılabilen yatay bir platform kabiliyetidir.

Planlanan kullanım alanları:

- eğitim taslağı ve içerik üretimi,
- mevcut içeriği analiz etme ve geliştirme,
- özetleme,
- soru üretimi,
- soru kalite kontrolü,
- zorluk seviyesi değerlendirmesi,
- öğrenme boşluklarının belirlenmesi,
- kişiselleştirilmiş öğrenme önerileri,
- eğitim etkinliği ve kalite analizi.

### Human-in-the-Loop

Yüksek etkili eğitim ve assessment içeriklerinde temel yaklaşım:

```text
AI üretir / önerir
        ↓
Sistem doğrular
        ↓
İnsan inceler
        ↓
Yayınlanır
```

AI çıktısı ile yayınlanmış kurumsal içerik aynı şey değildir.

## 5. Value Proposition

### 5.1 Organization / Training Management

Platform yalnızca “%82 tamamlandı” gibi operasyonel metrikler üretmemelidir. Kurum şu soruların cevaplarını görebilmelidir:

- Hangi departmanlarda öğrenme problemi var?
- Hangi eğitimler yeterince etkili değil?
- Hangi konular anlaşılmıyor?
- Hangi sorular problemli?
- Zorunlu eğitimleri kim tamamlamadı?
- Organizasyonun öğrenme ve ileride yetkinlik boşlukları nerede?

Hedef analitik zinciri:

> Veri → İçgörü → Öneri → Aksiyon

### 5.2 Instructor / Content Author

Eğitmen için hedeflenen döngü:

> Eğitim oluştur → AI ile geliştir → soru oluştur → kalite kontrolü → yayınla → sonuçları incele → içeriği geliştir.

Eğitim içeriği statik bir dosya değil, ölçülen ve zaman içinde geliştirilen yaşayan bir öğrenme varlığıdır.

### 5.3 Learner

Çalışan kendi:

- eğitimlerini,
- ilerlemesini,
- sınavlarını,
- sonuçlarını,
- sertifikalarını,
- önerilerini,
- öğrenme boşluklarını

görebilmelidir.

Uzun vadeli hedef yalnızca “62 puan aldın” demek değil, hangi konuların iyi öğrenildiğini ve hangi konuların tekrar çalışılması gerektiğini açıklayabilmektir.

## 6. Existing Capabilities to Preserve

Yeni ürün tasarımı mevcut yararlı davranışları kaybetmemelidir. Korunması hedeflenen kabiliyetler:

- yönetici/eğitmen paneli,
- çalışan/öğrenci paneli,
- eğitim atama,
- eğitim ve video ilerlemesi,
- materyal kullanımı,
- soru havuzu,
- AI ile soru üretimi,
- sınav oluşturma,
- kişiye özel güvenli sınav erişimi,
- yarıda kalan sınava devam,
- yarıda kalan eğitim/video ilerlemesine devam,
- sınav sonuçları,
- tekrar sınav akışı,
- sertifika.

Bu davranışlar yeni domain modelinin içine temiz sınırlarla yerleştirilecektir.

## 7. Product Principles

### AI-first, not AI-dependent

AI ürünü güçlendirir; temel kurumsal eğitim işlemleri tek bir AI sağlayıcısının çalışmasına bağımlı olmamalıdır.

### Human-controlled AI

Kritik eğitim ve assessment içeriğinde insan kontrolü korunur.

### Domain-first

Sistem ekranlara göre değil iş alanlarına göre modellenir. Başlıca domain adayları Identity, Organization, Training, Learning, Assessment, Certification, AI, Analytics ve Notification'dır. Nihai domain sınırları ayrıca kanonik domain dokümantasyonunda doğrulanacaktır.

### Web-first

İlk ürün web tabanlıdır. Responsive web desteklenir; native mobil uygulama ilk sürümün hedefi değildir.

### 20/80 execution rule

Dokümantasyon ve mimari tasarım geliştirmeyi desteklemeli, geliştirmeyi geciktiren teorik bir çalışma haline gelmemelidir. Yeterli mimari netlik sağlandıktan sonra çalışan yazılım üzerinden doğrulamaya geçilir.

## 8. Long-Term Direction

Ürün evrimi şu yönde düşünülmektedir:

```text
Kurumsal Eğitim Platformu
          ↓
AI Destekli Kurumsal Eğitim Platformu
          ↓
Kurumsal Öğrenme ve Yetkinlik Platformu
```

İlk ürünün merkezi eğitim ve öğrenmedir. Yetkinlik yönetimi uzun vadeli yön olarak kabul edilir; v1 kapsamına otomatik olarak dahil edilmez.

Uzun vadede öğrenme sinyalleri kişi, ekip, departman ve organizasyon seviyelerinde anlamlı bir öğrenme/yetkinlik görünümüne dönüşebilir.

## 9. Vision Boundary

Bu vizyon gelecekte yapılabilecek her özelliği v1 kapsamına sokmaz. Vision ürünün yönünü tanımlar; sürüm kapsamı `SCOPE`, roadmap ve sprint dokümanları tarafından belirlenir.
