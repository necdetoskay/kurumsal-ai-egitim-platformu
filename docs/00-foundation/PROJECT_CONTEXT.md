# Project Context

## 1. Köken

Proje, daha önce çalışan bir kurumsal sınav uygulamasının yeniden ve daha yönetilebilir biçimde tasarlanması ihtiyacından doğdu. Eski sistem zaman içinde çok sayıda özellik eklenmesi nedeniyle kod ve modül sınırları açısından yönetilmesi zor hale geldi. Yeni proje, eski sistemin işe yarayan davranışlarını koruyup mimariyi baştan kurmayı hedefler.

## 2. Çözülen temel problem

Kurumlarda eğitmenler çalışanlara eğitim verdikten sonra sınav hazırlamak, kişilere atamak, güvenli erişim sağlamak, sınav sürecini takip etmek, sonuçları analiz etmek ve sertifika üretmek için birden fazla manuel veya dağınık süreç kullanabilmektedir.

Platform bu süreci tek ürün altında birleştirir.

## 3. Eski sistemde doğrulanmış ürün davranışları

### Eğitmen tarafı

- Güvenli giriş ve dashboard.
- Personel modülü; personel bilgileri ve e-posta adresleri.
- Soru havuzu oluşturma sihirbazı.
- Konu, soru sayısı, soru tipi dağılımı ve zorluk seviyesi seçimi.
- AI yardımıyla JSON formatında yapılandırılmış soru üretimi.
- Bir veya birden fazla eğitim videosundan soru üretimi.
- Video transcript'inin otomatik veya manuel eklenmesi.
- Düz metinden soru üretimi.
- Sınav oluşturma sihirbazı.
- Sınav adı, süre, geçme notu, zorunlu video ve soru seçimi.
- Sınava girecek personellerin seçilmesi.
- Kişiye özel sınav linki gönderimi.
- Sınava giren, tamamlayan ve not alan personellerin dashboard üzerinden takibi.

### Personel / learner tarafı

- Kişiye özel güvenli link ile parola girmeden ilgili learner alanına erişim.
- Atanmış sınavları görme.
- Önceki sınavları, notları ve sertifikaları görme.
- Yarım kalan sınava devam edebilme.
- Başarısız sınav sonrası yeniden sınav talebinde bulunabilme.
- Zorunlu videoyu kaldığı yerden devam ettirebilme.

### Sınav güvenliği ve süreklilik

- Her sınav-personel eşleşmesi için özel token/key.
- Sınav sırasında sorun olursa kaldığı yerden devam.
- Sınav sayfasından çıkıldığında sınav davranışının güvenlik politikasıyla yönetilmesi.
- Soruların görünürlüğünün sınav oturum durumuna göre korunması.

## 4. Yeni sürümde korunacak temel fikir

Eski sistemde önce soru havuzu, sonra sınav oluşturuluyordu. Yeni ürün iki yolu da desteklemelidir:

1. Klasik yol: Kaynak → Soru Havuzu → Sınav.
2. Hızlı yol: Tek Sınav Sihirbazı içinde kaynak seçimi → AI soru üretimi → insan gözden geçirmesi → sınav oluşturma.

Soru bankası/havuzu kaldırılmaz; hızlı oluşturma yalnızca kullanıcı deneyimini kısaltan alternatif bir akıştır.

## 5. AI-first yaklaşım

Platform, güncel AI yeteneklerinden yararlanacak ancak AI'ı bağımsız karar verici olarak konumlandırmayacaktır.

Temel ilkeler:

- Structured output.
- Prompt versioning.
- Model/provider abstraction.
- Human review.
- Evaluation datasets.
- Cost tracking.
- RAG only when useful.
- Explainability and auditability.

## 6. Öğrenme / ders notu yaklaşımı

Proje aynı zamanda AI teknolojilerini öğrenmek için bir çalışma alanı olarak kullanılacaktır. Önemli AI modülleri için geliştiriciye özel kısa öğrenme notları hazırlanacaktır:

- Bu özellikte hangi AI yaklaşımı kullanılıyor?
- Temelinde hangi kavram var?
- Geçmişte benzer problem nasıl çözülüyordu?
- Yeni yaklaşımın avantaj ve sınırları neler?
- Bu projede neden bu yaklaşım seçildi?

Bu belgeler üretim dokümanlarından ayrılacak fakat ilgili modüle çapraz referans verecektir.

## 7. Scope disiplini

Yeni özellik eklemek varsayılan davranış değildir. Öncelik, tanımlanan çekirdek ürünün doğru, test edilebilir ve yönetilebilir şekilde tamamlanmasıdır. Yeni fikirler gerekli olmadıkça mevcut sürüme eklenmez; backlog veya sonraki sürüme taşınır.

## 8. Platform yönü

- İlk sürüm: responsive web.
- Native mobil: V2.
- API-first yapı korunur.
- Multi-tenant kurumsal kullanım hedeflenir.
- Sürdürülebilir domain sınırları temel önceliktir.
