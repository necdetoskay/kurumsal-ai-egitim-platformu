# AI Runtime & Evaluation Harness

## Amaç

AI ile ilgili tüm yetenekleri provider bağımsız, ölçülebilir, maliyet kontrollü, güvenli ve test edilebilir bir runtime altında toplamak.

## Ana Bileşenler

```text
Application Features
       ↓
AI Orchestrator
       ↓
Capability / Agent Layer
       ↓
AI Runtime Harness
 ├─ Model Router
 ├─ Model Registry
 ├─ Prompt Registry
 ├─ Context Builder / RAG
 ├─ Structured Output Validator
 ├─ Guardrails
 ├─ Cache
 ├─ Cost Controller
 ├─ Observability
 ├─ Human Review Adapter
 └─ ULTEF Adapter
       ↓
Provider Adapters
```

## Sorumluluklar

### Orchestrator
İsteğin hangi capability tarafından işleneceğini, LLM gerekip gerekmediğini, hangi model tier'ının yeterli olduğunu, RAG ve human review gereksinimini belirler.

### Harness
Provider çağrısını standartlaştırır; timeout, retry, fallback, schema validation, telemetry, token/cost ölçümü ve güvenlik politikalarını merkezi olarak uygular.

### Provider Adapters
Provider-specific SDK ve API farklarını izole eder. Feature kodu doğrudan provider SDK çağırmaz.

## Temel Kural

Önce deterministic çözüm değerlendirilir. Aşağıdaki tür işler mümkün olduğunda Tier 0 / no-LLM olmalıdır:

- permission ve authorization
- routing'in basit kuralları
- schema validation
- duplicate detection'ın deterministik kısmı
- scoring
- hesaplama
- state transition validation
- business rule enforcement

## Execution Flow

```text
Request
  ↓
Policy + capability resolution
  ↓
Tier resolution
  ↓
Model Router
  ↓
Prompt + Context
  ↓
Provider call
  ↓
Structured validation
  ↓
Automated quality/safety evaluation
  ↓
Human review if required
  ↓
Persist + observe + audit
```

## Failure Policy

- transient provider failure → bounded retry
- capability compatible alternative available → fallback candidate
- structured output invalid → repair/retry policy
- quality gate failure → escalation tier veya human review
- privacy/safety failure → fail closed, fallback ile bypass edilmez
- budget exhausted → explicit controlled failure/defer policy

## Mimari Hedef

Model değişimi feature kodunu değiştirmemelidir. Agent/capability aynı kalırken Model Registry ve routing policy güncellenebilmelidir.
