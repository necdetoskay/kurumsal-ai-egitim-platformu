# Model Tier Policy

## Amaç

Model seçimini belirli provider/model isimlerine bağlamadan kalite, maliyet, latency ve risk seviyesine göre standartlaştırmak.

## Tier 0 — No LLM

Öncelikli tercih. LLM gerektirmeyen işler burada çözülür.

Örnekler:
- authorization
- scoring
- deterministic routing
- schema validation
- state machine validation
- exact duplicate detection
- hesaplamalar

## Tier 1 — Fast / Cheap

Yüksek hacim, düşük karmaşıklık.

Örnekler:
- classification
- tagging
- basit özet
- metadata extraction
- query rewrite
- basit topic extraction

## Tier 2 — Balanced

Platformun varsayılan production AI seviyesi.

Örnekler:
- soru üretimi
- eğitim outline
- transcript analysis
- learning objective generation
- content transformation

## Tier 3 — Reasoning / High Quality

Daha pahalı fakat daha güçlü modeller. Default değildir.

Örnekler:
- karmaşık senaryo soruları
- düşük kalite Tier 2 çıktısının yeniden üretimi
- karmaşık kaynak sentezi
- ileri pedagojik değerlendirme

## Tier 4 — Judge / Benchmark

Production trafik modeli değildir. Evaluation ve qualification amaçlıdır.

Örnekler:
- ULTEF benchmark judge
- prompt/model comparison
- difficult golden-set evaluation
- regression judge

## Escalation Policy

```text
Tier 2 execution
      ↓
Quality gate passed?
  ├─ Yes → continue
  └─ No  → Tier 3 candidate
                ↓
          still insufficient?
                ↓
           Human Review / fail safely
```

Tier escalation sadece kalite için değil, policy tarafından izin verilen capability'lerde yapılır.

## Capability Matrix

| Capability | Normal | Escalation |
|---|---|---|
| Orchestrator | Tier 0/1 | Tier 2 |
| Content Intelligence | Tier 1/2 | Tier 3 |
| Question Generation | Tier 2 | Tier 3 |
| Quality Evaluation | Tier 2/3 | Tier 4 |
| Learning Insights | Tier 2 | Tier 3 |
| Classification | Tier 1 | Tier 2 |
| RAG query rewrite | Tier 1 | Tier 2 |
| High-risk final decision | AI önerisi | Human |

## Kural

Tier bir model adı değildir. Registry içindeki modeller capability ve ULTEF qualification sonuçlarına göre tier'lara atanır.
