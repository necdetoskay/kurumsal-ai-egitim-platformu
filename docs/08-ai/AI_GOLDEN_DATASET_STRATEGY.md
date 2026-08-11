# AI Golden Dataset Strategy

## Amaç

AI kalitesini sezgiyle değil, versionlanmış ve tekrar çalıştırılabilir veri setleriyle ölçmek.

## Dataset Domains

```text
datasets/
├─ question-generation/
│  ├─ easy/
│  ├─ medium/
│  ├─ hard/
│  └─ scenario/
├─ content-generation/
├─ transcript/
│  ├─ clean/
│  ├─ noisy/
│  └─ long/
├─ rag/
│  ├─ answerable/
│  ├─ unanswerable/
│  └─ conflicting/
├─ turkish/
│  ├─ terminology/
│  ├─ ambiguity/
│  └─ grammar/
└─ adversarial/
   ├─ prompt-injection/
   ├─ misleading-source/
   └─ unsafe-request/
```

## Başlangıç Boyutu

İlk production qualification için küçük fakat yüksek kaliteli bir set tercih edilir. Hedef başlangıç aralığı yaklaşık 100–200 dikkatle seçilmiş örnektir. Sayıdan önce örnek kalitesi gelir.

## Her Örnekte Tutulacaklar

- dataset_case_id
- capability
- language
- difficulty
- source/input
- expected constraints
- reference answer or rubric
- required evidence
- forbidden behavior
- tags
- risk class
- provenance
- created/reviewed by

## Dataset Growth

Golden set yalnızca sentetik olarak büyütülmez. Gerçek sistemden gelen:

- reviewer rejection
- production failure
- ambiguous question
- incorrect answer
- schema failure
- Turkish language problem
- RAG miss
- safety incident / near miss

örnekleri anonymize ve review edilerek regression setine eklenir.

## Dataset Versioning

Her benchmark sonucu dataset version taşır. Dataset değişmişse eski ve yeni model skorları doğrudan karşılaştırılmadan önce normalization/re-run gerekir.

## Leakage Control

Golden reference cevapları production prompt context'ine verilmez. Evaluation verisi ile production training/context ayrımı korunur.

## Human Calibration

Judge model skorlarının insan değerlendirmesiyle uyumu düzenli olarak ölçülür. Judge model tek başına mutlak doğruluk kaynağı değildir.
