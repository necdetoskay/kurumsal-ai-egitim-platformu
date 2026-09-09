# START HERE

Bu dosya Kurumsal AI Eğitim Platformu için güncel ana giriş noktasıdır.

## 1. Ürünün temel amacı

Platform yalnız eğitim atama, sınav puanı veya sertifika üretme sistemi değildir.

Temel ürün döngüsü:

`Source -> Training -> Assignment -> Learning -> Assessment -> Result -> Learning Objective Evidence -> Learning Insight -> Recommendation / Repeat -> Organization Learning Action`

Amaç, kurumun eğitim içeriği oluşturmasını ve çalışanlara sunmasını sağlarken **çalışanın gerçekten ne öğrendiğini**, hangi öğrenme hedeflerinde zorlandığını ve hangi aksiyonun alınması gerektiğini güvenilir evidence ile gösterebilmektir.

## 2. İlk sürümün ana kullanıcıları

- Tenant / Organization Admin
- Eğitmen / Content Author
- Reviewer
- Learner / Personel
- gerekli audit/operasyon rolleri

## 3. Ana ürün akışı

1. Tenant, kullanıcı ve gerekli organizasyon yapısı hazırlanır.
2. Kurumsal kaynak/material sisteme alınır ve provenance/evidence korunur.
3. Eğitmen Learning Objective ve eğitim içeriğini manuel veya kontrollü AI yardımıyla oluşturur.
4. AI çıktıları validation/evaluation ve gerektiğinde human review'dan geçer.
5. Eğitim immutable/versioned sınırla yayınlanır.
6. Organization / Company / Department / Group / Employee hedefleri deterministik biçimde çözülür ve eğitim atanır.
7. Learner eğitimi tüketir; progress/resume korunur.
8. Assessment server-authoritative attempt ve deterministic scoring ile tamamlanır.
9. Sonuçlar Learning Objective seviyesinde evidence üretir.
10. Yeterli evidence varsa bounded weak-area insight ve ilgili içerik önerisi üretilir; yetersiz evidence varsa sistem abstain eder.
11. Completion policy uygunsa sertifika üretilir.
12. Yönetici, gizlilik ve tenant sınırlarını koruyan toplulaştırılmış öğrenme sinyallerini görür.

## 4. V1 temel kararları

- AI-first, AI-dependent değildir.
- Kritik AI çıktıları kontrolsüz biçimde production'a yayınlanmaz.
- Multi-tenancy ve tenant isolation V1 hard gate'tir.
- Learning Objective, content -> question -> result -> insight zincirinin merkezindedir.
- Assessment state/scoring/completion server-authoritative'dir.
- Published/versioned ve historical evidence destructively overwrite edilmez.
- Employee ve User farklı kavramlardır.
- Organization Management'in V1 amacı eğitim hedefleme, authorization/history ve learning analytics bağlamını sağlamaktır; V1 full HRIS değildir.
- Responsive web V1'dir; native mobile Later'dır.

## 5. Güncel kanonik okuma sırası

### Ürün amacı ve kapsam
1. `docs/00-foundation/VISION.md`
2. `docs/00-foundation/SCOPE.md`
3. `docs/00-foundation/PROJECT_PRINCIPLES.md`
4. `docs/00-foundation/PROJECT_CONTEXT.md`

### Domain ve ürün davranışı
5. `docs/02-domain/DOMAIN_MAP.md`
6. `docs/02-domain/BOUNDED_CONTEXTS.md`
7. `docs/03-business-rules/CORE_BUSINESS_RULES.md`
8. `docs/04-access/ROLES_AND_PERMISSION_MATRIX.md`
9. `docs/05-flows/PRIMARY_USER_FLOWS.md`

### Mimari / backend / data
10. `docs/06-architecture/`
11. `docs/06-backend/`
12. `docs/07-data/`
13. `docs/07-ingestion/`
14. `docs/09-api/`
15. `docs/10-events/`
16. `docs/11-adr/`

### AI / authoring
17. `docs/08-ai/`
18. `docs/09-authoring/`
19. `evals/golden/`

### UI
20. `docs/12-ui/`
21. `ui-mockups/`

### Execution / quality / governance
22. `DESIGN_FREEZE_v1.md`
23. `docs/10-sprints/BACKEND_FIRST_SPRINT_ROADMAP_V1.md` — **canonical implementation order**
24. `docs/17-quality/`
25. `artifacts/ultef/`
26. `docs/13-governance/aegis-mur/` — AEGIS MUR mission recovery/governance overlay

`docs/18-sprints/SPRINT_ROADMAP_V1.md` historical/superseded bir roadmap'tir; yeni execution seçimi için kullanılmaz.

## 6. AEGIS MUR current state

Tracking epic: **#105 — V1 Mission Realignment & Recovery Gate**

Current MUR verdict:

**MISSION ALIGNED / EXECUTION DRIFTED**

Önemli baseline gerçeği:

- `main` tek V1 release baseline olarak kalır.
- `design/organization-management-canonical-v1` Organization Management için önemli kabul edilmiş work line'ıdır.
- Bu branch'teki tamamlanmış işleri yeniden yazmak yerine review + qualification sonrası `main` baseline'a promote etmek hedeflenir.

MUR recovery order:

`M0 Canonical Truth`
→ `M1 Organization Audience Promotion`
→ `M2 Learner Core`
→ `M3 Assessment/Result/Certificate`
→ `M4 Objective Evidence`
→ `M5 Learning Insight/Recommendation`
→ `M6 Organization Learning Analytics`
→ `M7 Mission E2E`
→ `M8 Release Hardening`

## 7. Çalışma ilkesi

Repo içindeki kanonik dokümantasyon ürün sözleşmesidir; fakat bir belgenin eski veya başka branch'te kalmış olması otomatik olarak güncel truth olduğu anlamına gelmez.

Kritik kararlar için kanıt zinciri:

`Purpose -> canonical docs -> issue -> PR -> target branch -> merge commit -> tests/runtime evidence -> declared V1 baseline`

Kod, issue veya branch bu zincirin dışında tek başına “V1 tamamlandı” kanıtı sayılmaz.
