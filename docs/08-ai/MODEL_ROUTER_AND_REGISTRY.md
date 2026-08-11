# Model Router & Model Registry

## Amaç

Feature ve agent kodunun belirli provider/model isimlerine bağımlı olmasını engellemek; model seçimini ölçülebilir politika haline getirmek.

## Model Router

Agent capability talep eder:

```text
question_generation
required_tier = 2
language = tr
structured_output = required
max_latency = policy
budget_class = standard
```

Router şu sırayla karar verir:

1. capability uyumu
2. tenant/provider policy uyumu
3. data/privacy uygunluğu
4. required hard gates
5. tier eligibility
6. ULTEF qualification durumu
7. availability / health
8. cost-latency-quality routing policy
9. fallback sırası

## Model Registry Kaydı

Her deployment/model için en az şu metadata tutulur:

```text
model_id
provider
provider_model_name
provider_version/deployment
status
eligible_tiers
capabilities
structured_output_support
tool_use_support
context_window
language_support
turkish_score
question_generation_score
content_score
rag_score
judge_score
safety_score
schema_compliance
latency_p50
latency_p95
input_cost
output_cost
failure_rate
last_ultef_run
qualification_version
approved_use_cases
forbidden_use_cases
data_processing_policy
```

## Registry Lifecycle

```text
Discovered
  ↓
Candidate
  ↓
Evaluating
  ↓
Qualified
  ↓
Canary
  ↓
Active
  ↓
Deprecated
  ↓
Retired
```

## Routing Example

Tier 2 question-generation adayları:

```text
Model A: quality 91, cost 0.28, latency 1.8s
Model B: quality 89, cost 0.11, latency 0.9s
Model C: quality 94, cost 0.70, latency 2.4s
```

Minimum quality = 88 ise üçü de kalite açısından uygun olabilir. Cost-priority routing için B seçilebilir; fakat yalnızca hard gates ve ULTEF qualification geçilmişse.

## Critical Rule

En ucuz model otomatik olarak seçilmez. En güçlü model de otomatik olarak seçilmez. Router, capability-specific minimum quality'yi geçen uygun adaylar arasından policy'ye göre seçim yapar.
