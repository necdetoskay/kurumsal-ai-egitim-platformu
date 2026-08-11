# ULTEF AI Profile

## Amaç

ULTEF'i yalnızca genel test suite olarak değil, AI model/prompt governance ve qualification katmanı olarak kullanmak.

## Kapsam

ULTEF AI profili aşağıdaki eksenlerde benchmark üretir:

- functional correctness
- prompt regression
- model regression
- structured-output/schema compliance
- Turkish language quality
- question-generation quality
- content-generation quality
- RAG retrieval/generation quality
- judge/evaluator consistency
- safety and adversarial behavior
- latency
- cost
- failure rate

## Test Katmanları

```text
ULTEF
├─ Functional Tests
├─ Domain Tests
├─ API / Contract Tests
├─ E2E Tests
└─ AI Qualification
   ├─ Prompt Eval
   ├─ Model Eval
   ├─ RAG Eval
   ├─ Generator Eval
   ├─ Judge Eval
   ├─ Safety Eval
   ├─ Cost Eval
   └─ Latency Eval
```

## Existing ULTEF Terminology

Mevcut ULTEF L/M seviyeleri bu projede yeniden icat edilmeyecektir. Kurumsal AI Eğitim Platformu profili, kanonik ULTEF tanımındaki mevcut seviyelendirme sistemini tüketmelidir. L3/M5 gibi seviyelerin kesin anlamı ULTEF kaynağından alınır.

## Sprint Integration

ULTEF sadece release sonunda çalışmaz.

Her AI sprintinde:

1. capability golden set
2. prompt regression
3. candidate/current comparison when applicable
4. schema compliance
5. Turkish quality
6. cost/latency capture
7. safety/adversarial subset
8. sprint-specific acceptance threshold

çalıştırılır.

## Full Qualification

Release öncesi tam qualification:

- production model set
- fallback model set
- active prompt versions
- active RAG configuration
- agent workflows
- cross-tenant safety tests
- cost budget tests
- degraded-provider behavior

üzerinde gerçekleştirilir.

## Output Artifacts

ULTEF en az şu artefact'ları üretmelidir:

- machine-readable result JSON
- human-readable comparison report
- model/prompt version metadata
- dataset version
- thresholds/gates version
- cost and latency summary
- failed hard gates
- promotion recommendation

## Governance Rule

Production model veya production prompt version değişikliği, ilgili capability ULTEF gate'ini geçmeden active yapılamaz.
