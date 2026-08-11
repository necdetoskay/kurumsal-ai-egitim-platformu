# V1 Agent Catalog

## Karar

V1 için 5 logical agent kullanılacaktır. Amaç agent sayısını artırmak değil, sorumlulukları net tutmaktır.

## 1. AI Orchestrator

### Sorumluluk
- capability seçimi
- deterministic/LLM kararı
- model tier seçimi
- RAG gereksinimi
- synchronous/asynchronous execution
- human review gereksinimi
- bütçe ve policy kontrolü

### Önemli Not
Orchestrator her istekte güçlü LLM çağırmak zorunda değildir. Routing'in büyük kısmı explicit rule/policy ile çalışabilmelidir.

## 2. Content Intelligence Agent

### Girdi
Metin, PDF'den çıkarılmış metin, transcript, eğitim notu, politika veya diğer onaylı kaynaklar.

### Görevler
- özetleme
- konu ve anahtar kavram çıkarımı
- learning objective çıkarımı
- bölümleme
- eğitim outline hazırlama
- soru üretimi için kaynak/context hazırlama

### Normal Tier
Tier 1 veya Tier 2; karmaşık kaynaklarda Tier 3 escalation.

## 3. Question Generation Agent

### Görevler
- kaynağa dayalı soru üretme
- soru tipi dağılımına uyma
- difficulty hedefini gözetme
- learning objective ile eşleme
- cevap, açıklama ve source evidence üretme

### Zorunlu Çıktı
Makine tarafından doğrulanabilir structured JSON.

### Normal Tier
Tier 2; zor senaryo ve düşük kalite durumlarında Tier 3.

## 4. Quality Evaluator Agent

### Görevler
- doğruluk
- tek/çoklu doğru cevap tutarlılığı
- kaynak desteği
- ambiguity
- difficulty uygunluğu
- option quality
- duplicate/near-duplicate kalite kontrolü
- instructional alignment
- safety/policy kalite sinyalleri

### Bağımsızlık İlkesi
Generator'ın kendi çıktısını tek başına onaylaması tercih edilmez. Mümkün olduğunda evaluator farklı model/model-family veya bağımsız evaluation yaklaşımı kullanır.

### Normal Tier
Tier 2/3; benchmark/judge görevlerinde Tier 4.

## 5. Learning Insight Agent

### Görevler
- sonuçları concept/topic bazında yorumlama
- öğrenme boşluklarını belirleme
- mevcut eğitim içeriği ile ilişkilendirme
- açıklanabilir gelişim önerileri üretme

### V1 Sınırı
Autonomous adaptive tutor değildir. Öneri üretir; learning policy ve resmi sonuçları kendisi değiştirmez.

## V1 Dışında

- Autonomous AI Tutor
- Autonomous Curriculum Agent
- Autonomous Compliance Agent
- Genel amaçlı serbest çalışan multi-agent swarm

Bunlar gerçek kullanım ve ihtiyaç doğrulanmadan mimariye eklenmeyecektir.
