# Issue Done & ULTEF Qualification Standard

Status: Canonical project standard
Version: 1.0

## Purpose

Bu standart GitHub Issue'larının yalnızca "iş yapıldı" beyanıyla değil, doğrulanabilir acceptance criteria ve uygun ULTEF qualification gate'leri ile kapatılmasını tanımlar.

Amaçlar:

- Session bağımsız çalışma hafızası oluşturmak.
- Yapılan işin neden tamamlanmış kabul edildiğini kanıtlamak.
- Documentation, architecture, implementation ve AI işlerinde ortak bir Definition of Done sağlamak.
- Regression ve eksik implementasyon riskini azaltmak.
- Issue -> implementation -> test -> evidence -> close zincirini standartlaştırmak.

## Core Rule

Bir issue, kendisine uygulanabilir ULTEF gate'leri PASS olmadan `completed` olarak kapatılmaz.

İstisna yalnızca `cancelled`, `duplicate`, `won't do`, `superseded` gibi tamamlanma dışı kapanış nedenleridir; bunların nedeni issue üzerinde açıkça belgelenmelidir.

## Canonical Workflow

`Issue -> Work -> Validation -> ULTEF Qualification -> Evidence -> PR/Merge (if applicable) -> Closure Summary -> CLOSED`

Kod değişikliği içeren işler için tercih edilen akış:

`Issue -> Branch -> Implementation -> PR -> CI -> ULTEF -> PASS -> Merge -> Closure Evidence -> Issue Close`

## Issue Classes

### 1. Documentation / Design

Örnekler:
- Domain model
- Architecture specification
- Permission matrix
- ADR
- User flow
- API/event design

Uygulanabilir gate'ler:
- Required sections/completeness
- Canonical scope consistency
- Cross-document consistency
- Domain terminology consistency
- Broken reference/link checks
- Architecture/business-rule contradiction checks
- Acceptance criteria coverage

Bu profil `ULTEF Design Gate` olarak uygulanabilir.

### 2. Implementation

Uygulanabilir gate'ler ihtiyaca göre:
- Unit
- Integration
- Database
- API/contract
- Domain invariant
- Security
- Tenant isolation
- Idempotency
- E2E
- Regression
- Performance

Her issue bütün test türlerini gerektirmez; gerekli profil issue'nun risk ve kapsamına göre belirlenir.

### 3. AI / Model / Prompt

Normal software gate'lerine ek olarak uygulanabilir ölçümler:
- Golden Dataset
- Prompt regression
- Model regression
- Structured-output compliance
- Grounding/correctness
- Ambiguity
- Duplicate/near-duplicate rate
- Turkish quality
- Safety hard gates
- Latency budget
- Cost budget
- Failure/fallback behavior

Model veya prompt yalnız "çalışıyor" olması nedeniyle tamamlanmış sayılmaz.

### 4. Bug / Regression

En az:
- Reproduction test
- Fix verification
- Regression test
- İlgili üst-seviye ULTEF profile

Bug fix testi mümkünse önce fail eden senaryoyu yeniden üretmeli, fix sonrasında pass etmelidir.

### 5. Backlog / Discovery

Backlog issue normalde açık kalır. Implementasyona alınırken daha küçük delivery issue'larına bölünebilir.

Discovery issue kapatılacaksa kod testi zorunlu değildir; fakat beklenen araştırma çıktıları, karar/evidence ve gerekiyorsa ADR/documentation gate tamamlanmalıdır.

## Hard Gates

Aşağıdaki gate'ler ilgili issue için uygulanıyorsa weighted score ile bypass edilemez:

- Security
- Tenant isolation
- Data integrity
- Authorization
- Safety
- Required schema/contract compliance
- Critical business invariants

Bir hard gate FAIL ise issue completed değildir.

## Required Closure Evidence

Completed olarak kapatılan issue üzerinde mümkün olduğunca aşağıdaki qualification özeti bulunmalıdır:

```text
ULTEF Qualification
Profile: <profile-name/version>
Commit: <sha>
Run: <CI/run identifier>
Result: PASS

Tests:
<passed> passed
<failed> failed
<skipped> skipped

Artifacts:
- <report/artifact>
- <report/artifact>

Acceptance Criteria: PASS
Regression: PASS
```

Documentation/design işlerinde CI run bulunmuyorsa repository commit + design-gate evidence kullanılabilir.

## Issue Done Policy

Bir issue `completed` olarak kapatılmadan önce:

1. Acceptance criteria tamamlanmıştır.
2. İlgili implementation veya documentation repository'dedir.
3. Gerekli testler/gate'ler tanımlanmış ve çalıştırılmıştır.
4. Uygulanabilir ULTEF profile PASS olmuştur.
5. Hiçbir applicable hard gate FAIL değildir.
6. Kritik regression yoktur.
7. Qualification evidence/artifact kaydedilmiştir.
8. Kod işi ise gerekli PR review/merge süreci tamamlanmıştır.
9. Issue üzerinde closure summary/evidence bulunur.
10. Ancak bundan sonra issue `completed` olarak kapatılır.

## PR Rule

Kod işi için PR mümkün olduğunda ilgili issue'yu referanslar (`Closes #N` veya eşdeğeri).

Uzun vadeli hedef: kritik ULTEF workflow'larını GitHub branch protection / required status check olarak zorunlu hale getirmek.

## Test Ownership

Issue implementasyonu test üretme sorumluluğunu da taşır. Testler sonradan yapılacak ayrı bir "kalite işi" olarak varsayılan biçimde ertelenmez.

Test edilebilirlik acceptance criteria'nın parçasıdır.

## Regression Rule

Her önemli bug, production incident veya AI quality failure mümkün olduğunda ULTEF regression corpus'una eklenir. Aynı hata sınıfının gelecekte yeniden ortaya çıkması otomatik olarak yakalanmalıdır.

## AI Model Promotion Link

Model/prompt değişikliği issue kapanışından önce `MODEL_PROMOTION_POLICY` ve `ULTEF_AI_PROFILE` gereksinimlerini karşılamalıdır. Yeni modelin varlığı veya daha düşük maliyet tek başına promotion gerekçesi değildir.

## Session Independence

Issue; yeni bir ChatGPT/Coding Agent session'ının konuşma geçmişi olmadan işi anlayabilmesi için yeterli context, dependency, acceptance criteria ve test beklentisi taşımalıdır.

Kanonik kararlar issue body'de kopyalanmak yerine mümkün olduğunda repository documentation'a referans verilerek korunur.

## Applicability Across Projects

Bu standart Kurumsal AI Eğitim Platformu'nda ilk kanonik uygulamasını bulur. ULTEF kullanılan diğer projelerde de aynı temel workflow tercih edilir; proje-specific test profilleri ve hard gate'ler ilgili repository tarafından genişletilebilir.

## Governance

Bu standardın gevşetilmesi sıradan issue kapsamında yapılamaz. Değişiklik gerekiyorsa açık bir architecture/quality decision olarak belgelenmeli ve regression riskleri değerlendirilmelidir.
