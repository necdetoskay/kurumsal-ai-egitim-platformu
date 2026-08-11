# Model Promotion Policy

## Amaç

Yeni bir model çıktığı için production modelini değiştirmemek; model değişimini ölçülebilir ve geri alınabilir bir operasyon haline getirmek.

## Promotion Pipeline

```text
Discovered Model
   ↓
Candidate Registry
   ↓
ULTEF Benchmark
   ↓
Golden Dataset
   ↓
Task-Specific Evaluation
   ↓
Cost + Latency + Safety
   ↓
Current Production Comparison
   ↓
Shadow Mode
   ↓
Canary
   ↓
Production
```

## Hard Gates

Weighted score hesaplanmadan önce aşağıdaki kapılar geçilmelidir:

- safety minimum threshold
- structured-output/schema compliance threshold
- privacy/data-processing policy
- Turkish capability minimum threshold when Turkish use case is required
- task-specific correctness minimum threshold
- unacceptable failure-rate ceiling

Hard gate başarısızsa düşük maliyet veya yüksek genel skor promotion için yeterli değildir.

## Weighted Score

Her capability ayrı ağırlık kullanabilir. Question Generation için başlangıç profili:

| Metric | Weight |
|---|---:|
| Overall quality | 30% |
| Correctness | 20% |
| Instruction adherence | 10% |
| JSON/schema compliance | 10% |
| Turkish quality | 10% |
| Cost | 10% |
| Latency | 5% |
| Safety | 5% |

Bu ağırlıklar ULTEF verisine göre versionlanır; sabit evrensel değer kabul edilmez.

## Promotion Decisions

Candidate aşağıdaki sonuçlardan birini alır:

- Reject
- Continue Evaluation
- Qualified but not preferred
- Shadow Eligible
- Canary Eligible
- Production Preferred

## Shadow Mode

Production isteği mevcut model ile işlenirken candidate aynı normalize edilmiş girdiyi bağımsız olarak işler. Candidate çıktısı kullanıcıya gösterilmez; kalite, latency ve maliyet karşılaştırılır.

## Canary

Sadece düşük riskli ve kontrollü trafik yüzdesine candidate atanır. Abort koşulları önceden tanımlıdır.

## Rollback

Model routing config önceki qualified modele geri çevrilebilmelidir. Model rollback için feature deployment gerekmez.

## Review Cadence

- yeni ciddi candidate çıktığında ad-hoc benchmark
- periyodik benchmark (başlangıçta aylık önerilir)
- prompt veya dataset major değişikliğinde yeniden qualification
- provider pricing/capability değişikliğinde cost rerun

Periyot implementasyon sırasında operasyon ihtiyacına göre kesinleştirilir.
