# V1 Scope — Kurumsal AI Eğitim Platformu

Status: Canonical for v1 planning

## Purpose

V1'in amacı tüm LMS pazarını kapsamak değil; bir kurumun eğitim içeriği oluşturabildiği, çalışanlara eğitim atayabildiği, öğrenme ilerlemesini takip edebildiği, assessment yapabildiği ve AI ile içerik/soru üretimini kontrollü biçimde kullanabildiği uçtan uca çalışan bir AI-first kurumsal öğrenme döngüsü oluşturmaktır.

Temel döngü:

`Content -> Training -> Assignment -> Learning -> Assessment -> Result -> Learning Insight -> Recommendation/Repeat`

## Scope Principles

- AI-first, AI-dependent değil.
- Kritik AI çıktılarında Human-in-the-Loop korunur.
- Domain-first tasarım uygulanır.
- V1 web-first'tür; native mobile sonraki sürümdedir.
- 20/80 ilkesi geçerlidir: tasarım implementasyonu hızlandırmalı, geciktirmemelidir.
- Multi-tenancy V1 mimarisinin temelidir; tenant isolation sonradan eklenmeye bırakılmaz.
- Learning Objective, içerik -> soru -> sonuç -> öğrenme içgörüsü zincirinin merkezindedir.

# In Scope

## 1. Organization, Identity and Access

- Tenant / kurum yapısı ve gerçek tenant isolation
- Kullanıcı yönetimi ve kullanıcı daveti
- Aktif/pasif kullanıcı durumu
- Rol bazlı yetkilendirme
- Temel roller: Admin, eğitim yöneticisi/eğitmen, Reviewer, Learner
- Temel organizasyon, grup ve departman ilişkileri
- Kritik işlemler için audit trail

V1 tam bir HR sistemi olmayacaktır.

## 2. Training and Content Management

- Eğitim oluşturma ve düzenleme
- Draft, review, published ve archived yaşam döngüsü
- Modüller ve modül sıralaması
- Metin içerikleri
- Video ve video transcript kullanımı
- Doküman/kaynak materyali
- Eğitim önizleme
- Human review
- Yayınlama ve arşivleme
- Eğitim atama
- Yayındaki içerik değişikliklerinin güvenli biçimde ele alınması için temel versioning davranışı

## 3. Learning Objective

Learning Objective V1 domain modelinin birinci sınıf kavramıdır.

Temel bağlantı:

`Training -> Learning Objective -> Content -> Question -> Assessment Result -> Learning Insight`

Bu ilişki gelecekteki gerçek öğrenme analitiğinin temelidir ve V1'den çıkarılmayacaktır.

## 4. Learner Experience and Progress

- Atanmış eğitimler
- Devam eden eğitimler
- Tamamlanan eğitimler
- Training player
- Modül ilerlemesi
- Video ilerlemesi
- Kaldığı yerden devam
- Eğitim tamamlanma durumu
- Son tarih
- Zorunlu/opsiyonel eğitim ayrımı

## 5. Question Bank

- Manuel soru oluşturma
- AI ile soru oluşturma
- Çoktan seçmeli sorular
- Doğru cevap ve açıklama
- Zorluk seviyesi
- Etiketler
- Learning Objective bağlantısı
- Source/evidence bağlantısı
- Draft/approved yaşam döngüsü
- Soru düzenleme
- Question Bank'ten assessment'a soru ekleme

İki çalışma yolu desteklenir:

1. `Question Bank -> Assessment`
2. `Source -> AI -> Questions -> Review -> Assessment`

## 6. Assessment

- Assessment oluşturma
- Soru seçimi
- Soru sayısı
- Süre
- Geçme puanı
- Başlangıç/bitiş zamanı
- Attempt modeli
- Kullanıcıya özgü güvenli assessment erişimi
- Assessment'ı yarıda bırakıp devam edebilme
- Otomatik puanlama desteklenen soru tiplerinde deterministic scoring
- Başarılı/başarısız sonucu
- Retake
- Retake request
- Attempt geçmişi

## 7. Certification

V1 temel sertifika kabiliyetini içerir:

`Training + required completion conditions + Assessment passed -> Certificate`

- Sertifika oluşturma
- Kullanıcının sertifikalarını görüntüleme
- Sertifika tarihi
- Training bağlantısı
- Temel doğrulama kimliği

Advanced credential ecosystem V1 dışındadır.

## 8. AI Runtime Harness

V1 AI altyapısının zorunlu parçaları:

- Provider abstraction
- Model Router
- Model Registry
- Model Tier Policy
- Prompt Registry
- Structured output contracts
- Schema validation
- Retry
- Timeout
- Fallback
- Usage/token metering
- Cost tracking
- AI tracing / observability
- Guardrails
- ULTEF integration

## 9. V1 Logical Agents

Kanonik logical agent seti:

1. Orchestrator
2. Content Intelligence Agent
3. Question Generation Agent
4. Quality Evaluator Agent
5. Learning Insight Agent

Production core:
- Orchestrator
- Content Intelligence
- Question Generation
- Quality Evaluator

Learning Insight V1'de bounded capability olarak uygulanır; tam bir AI Tutor veya otonom öğrenme yöneticisi değildir.

## 10. Content Intelligence

V1 hedefleri:

- Transcript analizi
- Metin analizi
- Topic extraction
- Learning Objective önerisi/çıkarımı
- Outline üretimi
- Özetleme
- İçerik bölümleme

## 11. AI Question Generation

AI soru üretimi aşağıdaki kaynaklardan çalışabilmelidir:

- Training content
- Text
- Transcript
- Document-derived text
- Learning Objective

Çıktılar versioned structured schema'ya uymalı ve evidence/source bağlantısını korumalıdır.

## 12. AI Quality Evaluation

V1 quality evaluation en az şu kontrolleri kapsar:

- Correctness
- Ambiguity
- Duplicate / near duplicate
- Answerability
- Source grounding
- Option quality
- Difficulty suitability
- Learning Objective alignment
- Schema compliance

AI evaluation human review yerine geçmez.

## 13. Human-in-the-Loop

Kritik AI içerik akışının temel politikası:

`AI Generation -> Automated Validation -> AI Quality Evaluation -> Human Review -> Approved -> Published`

Assessment içeriğinin AI tarafından kontrolsüz biçimde doğrudan yayınlanması V1 politikasına aykırıdır.

## 14. Learning Analytics and Bounded Learning Insight

V1 analytics:

- Eğitim tamamlanma oranları
- Assessment başarı oranları
- Kullanıcı ilerlemesi
- Temel grup/departman görünümü
- Soru performansı
- Eğitim performansı

V1 Learning Insight:

`Assessment Results -> Learning Objectives -> Weak Areas -> Relevant Training Content`

Amaç yalnızca puan göstermek yerine kullanıcının zayıf olduğu öğrenme hedeflerini belirleyebilmek ve ilgili içeriğe yönlendirebilmektir.

## 15. ULTEF

ULTEF V1 geliştirme ve release sürecinin parçasıdır.

Her sprint uygun test gate'lerinden geçmelidir. AI sprintlerinde ayrıca:

- Golden Dataset
- Prompt regression
- Model regression
- Turkish quality
- Structured-output compliance
- Grounding/correctness
- Cost
- Latency
- Safety
- Regression

ölçümleri uygulanır.

# Out of Scope for V1

- Native mobile application
- Tam HRIS
- Payroll
- Recruitment
- Genel performance management
- Career planning
- Tam competency management platformu
- External training marketplace
- Social learning/community/forum
- Tam gamification engine
- Points/badges/leaderboards sistemi
- AI avatar instructor
- AI video generation
- Voice cloning
- Autonomous curriculum management
- Autonomous compliance agent
- Fully autonomous publishing
- Advanced credential ecosystem
- Genel amaçlı AI Tutor

Responsive web V1 kapsamındadır; native mobile değildir.

# Later / Backlog

- AI Tutor
- Recommendation Agent
- Advanced Learning Insight
- Competency Graph
- Skill Gap Analysis
- Adaptive Learning Paths
- Personalized Curriculum
- AI-generated remediation paths
- Advanced Organization Analytics
- External LMS integrations
- SCORM/xAPI interoperability
- Native Mobile
- Gamification
- Advanced certificates/credentials
- Geniş multilingual capabilities
- AI video/voice capabilities
- Enterprise HR integrations

# Explicit V1 Decisions

## Multi-tenancy

Gerçek tenant isolation V1'de olacaktır. Tenant sınırları veri modeli, authorization, query filtering, test ve audit katmanlarında doğrulanacaktır.

## Learning Objective

Learning Objective V1'in merkezindedir ve Training, Content, Question, Assessment Result ve Learning Insight arasında izlenebilir bağlantı sağlar.

## Certification

Temel sertifika V1 kapsamındadır. İleri credential/verification ekosistemi değildir.

## Learning Insight

V1'de sınırlı ama gerçek bir Learning Insight capability bulunur. Bu capability assessment sonuçlarını Learning Objective seviyesinde analiz ederek weak-area görünümü ve ilgili içerik yönlendirmesi sağlar.

# Scope Change Rule

Design Freeze sonrasında yeni bir fikir için varsayılan davranış:

1. V1 blocker mı?
2. Mevcut kabul kriterlerinden birini karşılamak için zorunlu mu?
3. Güvenlik, veri bütünlüğü veya temel kullanıcı akışını etkiliyor mu?

Bu soruların cevabı hayır ise fikir V1'e doğrudan eklenmez; backlog'a alınır.

Bu kural 20/80 ilkesini ve scope disiplinini korur.
