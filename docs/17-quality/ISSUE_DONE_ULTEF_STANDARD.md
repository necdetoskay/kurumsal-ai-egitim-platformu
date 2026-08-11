# Project Adoption — ULTEF Issue Done Standard

Status: Project adoption profile

## Global Source of Truth

Bu proje global engineering standardını uygular:

- Repository: `necdetoskay/engineering-standards`
- Standard: `STD-TEST-001 — ULTEF Issue Done & Qualification Standard`
- Baseline: `v1.0.0`
- Canonical path: `standards/testing/ULTEF_ISSUE_DONE_STANDARD_v1.md`

Global standardın metni bu repository'de kopyalanmaz. Çelişki halinde bu proje açıkça eski bir baseline'a pin edilmemişse global standard esas alınır.

## Project-Specific Extensions

Kurumsal AI Eğitim Platformu için uygulanabilir ek hard gate/profile alanları:

- Tenant isolation
- Authorization / IDOR / BOLA
- Assessment integrity
- Historical version/snapshot integrity
- Human-in-the-Loop AI approval
- Structured AI output contracts
- Turkish AI quality
- AI grounding/correctness
- AI cost and latency budgets

## Evidence Location

Design/qualification evidence varsayılan olarak:

`artifacts/ultef/`

altında tutulur ve ilgili GitHub issue üzerinde referanslanır.

## Closure Rule

Bir issue ancak `STD-TEST-001` ve bu proje profilindeki uygulanabilir gate'ler PASS olduğunda `completed` olarak kapatılır.
