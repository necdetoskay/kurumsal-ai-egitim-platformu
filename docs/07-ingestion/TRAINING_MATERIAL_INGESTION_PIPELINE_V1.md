# Training Material Ingestion & Processing Pipeline — V1

Status: Canonical backend design
Related issue: #15

## 1. Goal

Eğitim üretiminde kullanılabilecek kaynakları tek bir güvenilir pipeline üzerinden almak, normalize etmek, kalite/provenance bilgisiyle saklamak ve Content Intelligence / Training Authoring için evidence-aware hale getirmek.

Pipeline yalnız kullanıcı upload'larını değil gelecekte discovered external sources (#18) ve YouTube transcript gibi kaynakları da destekleyecek biçimde tasarlanır.

## 2. Source Classes

- uploaded PDF
- DOCX / office document
- TXT / Markdown / HTML
- pasted text
- URL/web document
- YouTube/video transcript
- audio transcript
- image/scanned document
- discovered external source
- manually curated internal knowledge source

Her source için original artifact/reference korunur.

## 3. Core Data Model

### SourceAsset
- id
- tenant_id
- source_type
- original_uri/storage_key
- original_filename/title
- mime_type
- source_language
- acquisition_method
- acquisition_timestamp
- source_author/channel/publisher where known
- external_url where applicable
- checksum
- copyright/license metadata where known
- status

### ExtractionRun
- id
- source_asset_id
- extractor/provider/version
- extraction_mode
- started_at/completed_at
- status
- cost/latency metadata
- error classification

### ExtractedDocument
- source_asset_id
- extraction_run_id
- detected_language
- normalized_text
- structural representation
- page/segment map
- quality metrics

### EvidenceSegment
- source_asset_id
- locator (page/time/section/url fragment)
- text/content representation
- language
- checksum
- quality/confidence

### DerivedChunk
- evidence references
- normalized content
- semantic metadata
- embedding/index version

DerivedChunk authoritative source değildir; EvidenceSegment'e geri izlenebilir.

## 4. Pipeline

`Acquire -> Validate -> Classify -> Extract -> OCR/Transcribe if needed -> Normalize -> Structure -> Quality Gate -> Evidence Segmentation -> Chunk/Index -> Ready`

### 4.1 Acquire

Source kaydedilir, tenant ownership atanır, checksum oluşturulur. External source ise URL/publisher/language/acquisition timestamp saklanır.

### 4.2 Validate

- supported type
- size/page/duration limits
- malware/file safety integration point
- duplicate checksum
- tenant authorization
- external URL policy where applicable

### 4.3 Classify

Belgenin native text içerip içermediği, scan/image-heavy olup olmadığı, dil, layout complexity ve transcription gereksinimi belirlenir.

## 5. Extraction / OCR Router

OCR bir agent değil, deterministic/service capability'dir.

### D0 — Native Extraction

Öncelik her zaman native/deterministic extraction'dır:
- PDF text layer
- DOCX structure
- HTML
- TXT/Markdown
- available transcript

LLM kullanılmaz.

### D1 — OCR / Transcription

Native extraction yetersizse OCR/transcription tool kullanılır.

Provider implementation replaceable olmalıdır. Cloud OCR, local OCR veya specialized OCR provider seçimi routing policy ile yapılır.

Routing inputs:
- page count
- image ratio
- native text quality
- language
- table/layout complexity
- cost budget
- latency target
- privacy/data policy

### D2 — Vision Understanding

Yalnız OCR'ın semantik olarak yetersiz kaldığı karmaşık tablo, grafik, diagram veya layout için multimodal vision understanding kullanılır.

D2 normal OCR yerine varsayılan yol değildir.

### Escalation

`D0 -> quality check -> D1 -> quality check -> D2 selective -> human review/quarantine`

Tüm sayfayı pahalı modele göndermek yerine mümkün olduğunda problemli page/region selective escalation yapılır.

## 6. Extraction Quality Gate

Örnek ölçümler:
- extracted character/text density
- empty-page ratio
- language confidence
- replacement/garbage character rate
- repeated header/footer noise
- structural consistency
- OCR confidence where provider exposes it
- page coverage

Quality sonucu:
- PASS
- PASS_WITH_WARNINGS
- REPROCESS_REQUIRED
- HUMAN_REVIEW_REQUIRED
- REJECTED

## 7. Normalization

Normalization source meaning'i değiştirmez.

Allowed:
- whitespace cleanup
- repeated header/footer detection
- encoding normalization
- deterministic hyphenation repair
- structural heading/list/table representation

Original extraction immutable/auditable tutulur; normalized form derived artifact'tır.

## 8. Evidence & Provenance

Training generation'ın temel kuralı: derived claim/content kaynak evidence'a geri izlenebilmelidir.

Evidence locator examples:
- PDF page 14
- DOCX heading + paragraph index
- YouTube 00:12:30–00:13:08
- Web URL + section locator

Translation/localization original evidence'ın yerine geçmez. Source language korunur.

## 9. Multilingual Handling

- source language detection
- original text preservation
- optional translated working representation
- cross-language retrieval metadata
- target-language generation independent from source language

Örneğin İngilizce evidence kullanılarak Türkçe eğitim hazırlanabilir; lineage her zaman İngilizce original source'a döner.

## 10. Chunking & Indexing

Chunking retrieval optimizasyonudur; domain truth değildir.

Rules:
- semantic/structural boundaries preferred
- page/time evidence refs preserved
- overlap controlled and versioned
- chunker version stored
- embedding model/version stored
- reindex without destroying original evidence

## 11. Reprocessing & Versioning

Extraction/OCR/chunk/embedding pipeline versiyonları değişebilir.

SourceAsset immutable identity taşır; yeni processing run eski sonucu overwrite etmez.

Reprocessing reasons:
- extractor upgrade
- OCR quality improvement
- language model change
- chunking strategy change
- embedding model change
- manual quality failure

Active derived representation pointer/version policy ile seçilir.

## 12. External / Untrusted Content Security

Web, YouTube transcript ve uploaded documents untrusted input kabul edilir.

- embedded prompt/instruction agent system instruction değildir
- tool call talimatları kaynak içeriğinden yürütülmez
- source content tool permissions genişletemez
- tenant secrets source context'e eklenmez
- malicious prompt-injection patterns security/evaluation pipeline'da ele alınır

## 13. Copyright / Licensing Boundary

System source metadata ve mümkünse license/use metadata saklar. External content ingestion kullanım hakkı anlamına gelmez.

Training authoring mümkün olduğunda source'u kopyalamak yerine evidence-grounded synthesis üretir. Uzun verbatim reproduction policy-controlled olmalıdır.

## 14. Failure Model

- UNSUPPORTED_TYPE
- FILE_TOO_LARGE
- DUPLICATE_SOURCE
- EXTRACTION_FAILED
- OCR_FAILED
- TRANSCRIPTION_FAILED
- LOW_EXTRACTION_QUALITY
- LANGUAGE_UNSUPPORTED
- INDEXING_FAILED
- EXTERNAL_FETCH_FAILED
- SOURCE_POLICY_BLOCKED

Retry yalnız transient failure'da uygulanır. Permanent quality/policy failure human review veya rejection'a gider.

## 15. Observability

Her processing run:
- tenant/source/run correlation
- provider/tool/version
- stage latency
- pages/minutes processed
- token/API usage if any
- cost
- quality result
- retry/fallback path
- final status

kaydetmelidir.

## 16. Integration Boundaries

### Content Intelligence
Yalnız `READY` veya policy'nin izin verdiği warning state source'ları kullanır.

### Training Authoring (#17)
Source/evidence seçimi üzerinden çalışır; raw storage object doğrudan prompt'a verilmez.

### External Discovery (#18)
Discovered source aynı ingestion contract'a girer; özel bypass yolu yoktur.

### AI Quality (#16)
Generated claim/question için evidence/grounding değerlendirmesinde provenance graph kullanılır.

## 17. ULTEF Ingestion Profile

Required design/runtime test classes:
- native text extraction
- scanned PDF OCR fallback
- selective D2 escalation
- multilingual source preservation
- page/time locator integrity
- normalization non-corruption
- duplicate handling
- reprocessing/version coexistence
- failed OCR recovery
- indexing failure recovery
- tenant isolation
- malicious document/prompt-injection isolation
- provenance round-trip: generated artifact -> evidence -> original source
- cost/latency telemetry

Hard gates:
- tenant isolation
- provenance integrity
- original artifact/evidence preservation
- untrusted-content privilege isolation
- no silent low-quality extraction promotion to READY

## 18. Definition of Done

Pipeline source acquisition'dan retrieval-ready evidence'a kadar provider-independent olarak tanımlı; OCR routing, quality, provenance, multilingual handling, security, versioning, failure recovery ve ULTEF hard gates açıktır.