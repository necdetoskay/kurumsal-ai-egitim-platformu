# AI Acceptance Gates

## Amaç

AI capability, prompt veya model değişikliklerinin production'a çıkmadan önce geçmesi gereken minimum kalite ve governance kapılarını tanımlar.

## Hard Gates

Aşağıdaki kapılar herhangi bir weighted score ile bypass edilemez:

- tenant isolation
- privacy/data-processing policy
- safety minimum
- structured output/schema compliance
- task-specific correctness minimum
- unacceptable hallucination/unsupported claim ceiling
- critical failure-rate ceiling
- required Turkish-language minimum when capability Turkish kullanıyorsa

## Soft / Optimization Metrics

Hard gates geçildikten sonra şu metrikler trade-off için kullanılabilir:

- overall quality
- latency
- cost
- token efficiency
- reviewer acceptance rate
- cacheability
- provider reliability

## Human Review Gates

Aşağıdaki çıktı tipleri varsayılan olarak human review gerektirir:

- yayınlanacak eğitim içeriği
- yayınlanacak soru seti
- compliance/policy odaklı yüksek etkili içerik
- resmi skorlamayı etkileyebilecek açık uçlu değerlendirme önerileri

Human review kapsamı capability maturity ve ULTEF evidence ile gelecekte daraltılabilir; bu bir ayrı governance kararı gerektirir.

## Capability Release Gate

Yeni AI capability şu kanıtları sunmalıdır:

1. capability contract
2. prompt version
3. output schema
4. golden dataset version
5. ULTEF result
6. cost/latency baseline
7. failure/fallback behavior
8. observability fields
9. human review policy
10. rollback plan

## Regression Rule

Yeni model/prompt genel weighted score'u iyileştirse bile kritik bir alt metriği kabul edilemez seviyede düşürüyorsa promotion yapılmaz.

## Production Monitoring

Release sonrası en az şunlar izlenir:

- request count
- success/failure
- schema failures
- model/provider
- prompt version
- latency p50/p95
- input/output tokens
- cost
- fallback rate
- human approval/rejection
- safety rejection

Production feedback, golden dataset büyümesinin ana kaynaklarından biridir.
