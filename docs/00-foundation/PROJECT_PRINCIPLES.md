# Project Principles

## 1. Product before code

Kod en son gelir. Önce ürün davranışı, domain sınırları, iş kuralları, veri sözleşmeleri ve kabul kriterleri netleştirilir.

## 2. 20/80 çalışma kuralı

Dokümantasyon ve teori projeden koparmamalıdır. Yaklaşık %20 kavramsal derinlik, %80 doğrudan ürün kararına ve uygulanabilir çıktıya hizmet edecek şekilde ilerlenir.

## 3. Scope discipline

Çekirdek sürüm için gerekli olmayan yeni özellikler varsayılan olarak eklenmez. İyi fikirler backlog'a alınır; ana planı bozmaz.

## 4. AI-first, AI-only değil

AI, içerik ve soru üretimini, incelemeyi, sınıflandırmayı ve analitiği hızlandırır. Ancak kritik eğitim, değerlendirme ve kurumsal kararlar insan denetimini korur.

## 5. Domain-first architecture

Training, Content, Question, Assessment, Assignment, Attempt, Result, Certification, Analytics ve AI Processing ayrı sorumluluklara sahip domainlerdir. Modül sınırları açık tutulur.

## 6. Single source of truth

Repo içindeki kanonik belgeler ürün sözleşmesidir. Eski sohbet çıktıları veya geçici ZIP paketleri tek başına kaynak kabul edilmez.

## 7. Testability by design

Her önemli iş kuralı test edilebilir biçimde yazılır. Kritik kullanıcı akışları için unit, integration, contract ve E2E kapsaması planlanır.

## 8. Security by design

Tenant izolasyonu, güvenli token erişimi, audit, role/permission kontrolü, veri minimizasyonu ve güvenli varsayılanlar sonradan eklenen özellikler değildir.

## 9. Observability by default

Kritik işlemler correlation id, structured log, metrics ve trace ile izlenebilir olmalıdır.

## 10. Web-first

İlk ürün responsive web olarak geliştirilir. Native mobil istemci V2 kapsamındadır; API tasarımı gelecekte mobil istemciyi engellemez.

## 11. Learning notes

Önemli AI veya mimari özelliklerin yanında kısa teknik öğrenme notları hazırlanır. Amaç yalnızca ürünü yapmak değil, kullanılan yaklaşımın nedenini de anlamaktır.
