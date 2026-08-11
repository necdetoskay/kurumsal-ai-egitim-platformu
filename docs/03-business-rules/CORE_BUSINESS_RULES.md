# Core Business Rules — V1

Status: Canonical for V1 design freeze

Bu belge V1'in temel domain invariant'larını tanımlar. UI, API, database veya AI implementasyonu bu kuralları aşamaz.

## 1. Global Invariants

1. Her tenant-owned kayıt bir `tenant_id` ile ilişkilidir.
2. Cross-tenant okuma/yazma varsayılan olarak yasaktır.
3. Authorization yalnız UI görünürlüğüne bırakılamaz; server-side enforce edilir.
4. Kritik state transition'lar audit edilebilir olmalıdır.
5. Bir bounded context başka bir context'in verisini doğrudan değiştirmez; application contract/event kullanır.
6. Deterministic çözülebilen business rule için LLM kullanılmaz.
7. AI çıktısı domain gerçeği değildir; doğrulama ve gerekli durumda human approval sonrasında domain'e commit edilir.

## 2. Training Lifecycle

Temel yaşam döngüsü:

`DRAFT -> IN_REVIEW -> PUBLISHED -> ARCHIVED`

Kurallar:

- Yeni eğitim `DRAFT` başlar.
- Draft eğitim learner'a atanabilir bir yayın olarak kabul edilmez.
- `IN_REVIEW` içeriği yayın öncesi kontrol aşamasıdır.
- `PUBLISHED` eğitim learner tarafından tüketilebilir ve assignment'a konu olabilir.
- `ARCHIVED` yeni assignment için kullanılamaz; tarihsel kayıtlar korunur.
- Yayın için en az bir aktif modül, gerekli metadata ve geçerli Learning Objective bağlantıları bulunmalıdır.
- AI tarafından oluşturulan kritik içerik human-review gerektiriyorsa review tamamlanmadan publish edilemez.
- Yayındaki eğitimin learner sonuçlarını anlamsızlaştıracak biçimde sessizce değiştirilmesine izin verilmez.
- Material değişikliklerde yeni training/content version oluşturulmalıdır.
- Eski version'a bağlı attempt, progress, certificate ve audit kayıtları tarihsel olarak korunur.

## 3. Learning Objective Rules

- Learning Objective Training context tarafından sahiplenilir.
- Bir Learning Objective tenant ve training sınırı içinde tanımlanır.
- Content ve Question, ölçtüğü/desteklediği Learning Objective'lere explicit olarak bağlanabilir.
- Learning Insight yalnız ilişkilendirilmiş ve yeterli evidence bulunan objective'ler için iddia üretmelidir.
- Bir objective'in silinmesi geçmiş assessment/result izlerini bozamaz; kullanılmış objective hard-delete edilmez.

## 4. Assignment Rules

- Assignment yalnız erişilebilir/published training version'a bağlanır.
- Assignment bir kullanıcıya veya desteklenen organizasyon hedef grubuna verilebilir.
- Due date opsiyonel olabilir; zorunlu eğitimlerde policy ile zorunlu kılınabilir.
- Assignment training version referansını korur.
- Assignment'ın kaldırılması geçmiş learner progress/result kayıtlarını silmez.
- Aynı learner için duplicate aktif assignment oluşması idempotent biçimde engellenmeli veya açık policy ile merge edilmelidir.

## 5. Learning Progress and Completion

- Progress server-side kaydedilir.
- Learner eğitim/video/modül içinde kaldığı yerden devam edebilmelidir.
- Progress monotonik olmalıdır; normal akışta tamamlanmış içerik kendiliğinden tamamlanmamış duruma dönmez.
- Video seek davranışı UI özelliğidir; completion hesabı yalnız client'ın bildirdiği yüzdeye güvenmez.
- Training completion koşulları training policy/version ile belirlenir.
- Gerekli modüller tamamlanmadan training complete sayılamaz.
- Training assessment zorunlu ise gerekli assessment başarıyla tamamlanmadan final completion verilemez.
- Completion olayı idempotent olmalıdır.

## 6. Question Bank Rules

- Question Bank soru için source-of-truth'tur.
- Soru `DRAFT` ve `APPROVED` en az durumlarını destekler.
- Assessment'ta kullanılacak production soru geçerli schema'ya uymalıdır.
- AI-generated soru kaynak/evidence metadata'sını mümkün olan her durumda korur.
- AI-generated olması soruyu otomatik approved yapmaz.
- Doğru cevap ve scoring bilgisi learner'a assessment tamamlanmadan sızdırılamaz.
- Kullanılmış sorunun material edit'i tarihsel assessment bütünlüğünü bozamaz; snapshot/version yaklaşımı uygulanır.
- Near-duplicate tespiti kalite sinyalidir; kesin business karar gerektiğinde deterministic rule/human review kullanılır.

## 7. Assessment Lifecycle and Attempts

Assessment lifecycle en az `DRAFT -> PUBLISHED -> CLOSED/ARCHIVED` davranışını destekler.

Attempt lifecycle örneği:

`CREATED -> IN_PROGRESS -> SUBMITTED -> SCORED -> COMPLETED`

Ek terminal durumlar policy gereği `EXPIRED` veya `INVALIDATED` olabilir.

Kurallar:

- Learner yalnız yetkili olduğu published assessment'a attempt başlatabilir.
- Attempt tenant, learner, assessment ve assessment version'a bağlanır.
- Aynı request retry edildiğinde istemeden birden fazla attempt oluşmaması için idempotency uygulanır.
- In-progress attempt resume edilebilir.
- Süreli assessment'ta zaman hesabının authoritative kaynağı server'dır.
- Submit edilmiş attempt normal kullanıcı akışında tekrar düzenlenemez.
- Assessment soruları attempt sırasında immutable snapshot/version referansı ile korunur.
- Attempt sonucu tarihsel olarak yeniden üretilebilir/audit edilebilir olmalıdır.

## 8. Scoring Rules

- Deterministic puanlanabilen soru tiplerinde scoring LLM'e bırakılmaz.
- Passing score assessment version'da sabitlenir.
- Score hesaplama aynı input için aynı sonucu vermelidir.
- Score ile pass/fail sonucu ayrı alanlar olarak izlenebilir ancak birbiriyle tutarlı olmak zorundadır.
- Scoring policy değişirse eski attempt sonuçları sessizce yeniden yazılmaz.
- Manuel değerlendirme gerektiren gelecekteki soru tipleri ayrı review lifecycle kullanmalıdır; V1 otomatik puanlanabilir çekirdeği önceler.

## 9. Retake Rules

- Retake policy assessment tarafından belirlenir.
- Retake otomatik izinli, approval-required veya kapalı olabilir.
- Retake yeni bir Attempt üretir; eski attempt değiştirilmez.
- Retake request kendi state lifecycle'ına sahiptir.
- Maximum attempt/retake limiti varsa server-side enforce edilir.
- Certificate eligibility hesaplanırken hangi attempt'ın authoritative olduğu policy ile belirlenir; geçmiş attempt'lar korunur.

## 10. Certification Eligibility

Sertifika yalnız policy koşulları sağlandığında üretilebilir.

Tipik V1 koşulu:

`required training completion + required assessment pass -> certificate eligibility`

Kurallar:

- Certificate tenant, learner, training ve ilgili version/eligibility evidence ile ilişkilidir.
- Aynı eligibility için duplicate certificate üretimi idempotent olmalıdır.
- Certificate geçmişi training daha sonra archive edilse bile korunur.
- Sertifika doğrulama kimliği tahmin edilmesi kolay sequential public identifier olmamalıdır.
- Certificate iptali gerekiyorsa hard-delete yerine revocation state tercih edilir.

## 11. AI Generation Rules

- Agent logical capability'dir; provider/model değildir.
- Agent doğrudan provider-specific model çağırmaz; AI Runtime Harness kullanır.
- Routing önce Tier 0/no-LLM seçeneğini değerlendirir.
- Her AI request en az capability, tenant, prompt version, model identity/version ve usage metadata ile trace edilebilir olmalıdır.
- Structured output beklenen işlerde schema validation zorunludur.
- Invalid output retry/repair/escalation policy'ye girer; sessizce domain'e yazılmaz.
- Model fallback kalite veya safety gate'lerini bypass edemez.

## 12. AI Review and Approval

Kritik akış:

`AI Generation -> Automated Validation -> Quality Evaluation -> Human Review -> Approved -> Domain Commit/Publish`

- AI Question Generation çıktıları human approval olmadan production question olarak yayınlanmaz.
- Quality Evaluator karar destek sağlar; nihai approval otoritesi değildir.
- Generator ve evaluator mümkün olduğunda bağımsız değerlendirme sinyalleri üretmelidir.
- Review kararı reviewer, timestamp, prompt/model lineage ve değişikliklerle audit edilir.
- Reviewer AI çıktısını edit edebilir; final approved içerik ile raw AI output birbirinden ayrılmalıdır.

## 13. Learning Insight Rules

V1 Learning Insight bounded'dır.

- Kaynak veri Assessment Result ve Learning Objective ilişkileridir.
- Weak-area iddiası yeterli evidence olmadan üretilmemelidir.
- Tek sorudan geniş yetkinlik sonucu çıkarılmamalıdır.
- Insight confidence/evidence bilgisi korunmalıdır.
- V1 insight kullanıcıya zayıf alan ve ilgili training content yönlendirmesi sunabilir.
- Insight otomatik HR performance kararı, disiplin kararı veya kariyer kararı üretmez.

## 14. Tenant Isolation Rules

- Tenant context authentication/session sonrasında güvenilir server-side kaynaktan çözülür.
- Client tarafından gönderilen `tenant_id` tek başına güvenilir kabul edilmez.
- Repository/query katmanı tenant scope'u varsayılan olarak uygular.
- Unique constraint'ler gerektiğinde tenant-scoped tasarlanır.
- Cache key, object storage path, background job, event payload ve AI trace tenant boundary'yi korur.
- Cross-tenant administrative operasyonlar özel platform-level permission ve audit gerektirir.
- ULTEF tenant-isolation negatif testleri release gate'in parçasıdır.

## 15. Audit Rules

En az şu olaylar audit edilmelidir:

- Role/permission değişiklikleri
- User activation/deactivation
- Training publish/archive
- Assessment publish/close
- Human AI approval/rejection
- Retake approval/rejection
- Certificate issue/revoke
- Model/prompt production promotion
- Tenant-boundary veya privileged administrative işlemler

Audit log normal business entity gibi kullanıcı tarafından düzenlenemez.

## 16. Failure and Idempotency

- Publish, assignment, attempt creation, submit, scoring, certificate issue ve event consumption gibi kritik işlemler retry-safe tasarlanmalıdır.
- External AI/provider timeout domain state'i belirsiz bırakmamalıdır.
- Async job tekrar çalıştığında duplicate side effect üretmemelidir.
- Partial failure durumları observable olmalı ve gerektiğinde recovery/reconciliation mümkün olmalıdır.

## 17. Scope Protection

Bu kurallar V1'in çekirdeğini tanımlar. Yeni business rule Design Freeze sonrasında ancak güvenlik, veri bütünlüğü, kanonik scope veya temel kullanıcı akışının gerektirdiği ölçüde V1'e alınır; aksi halde backlog'a gider.
