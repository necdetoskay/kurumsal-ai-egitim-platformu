# AI Architecture — Canonical Index

Bu klasör Kurumsal AI Eğitim Platformu'nun AI runtime, agent, model governance ve ULTEF değerlendirme kararlarını içerir.

## Kanonik İlkeler

- AI, tek bir özellik değil platformun yatay yeteneğidir.
- Agent ile model aynı şey değildir; agent görevi sabit kalabilir, altında kullanılan model değişebilir.
- Model/provider isimleri domain veya feature koduna gömülmez.
- Mümkün olan işlerde LLM kullanılmaz; deterministic kurallar önceliklidir.
- AI çıktıları structured output ve schema validation üzerinden geçer.
- Yüksek etkili içerikler human-in-the-loop onayı gerektirir.
- Model/prompts production'a ULTEF qualification gate olmadan alınmaz.
- Model değişimi kod değişikliği değil, kontrollü governance/configuration işlemi olmalıdır.

## V1 Logical Agents

1. AI Orchestrator
2. Content Intelligence Agent
3. Question Generation Agent
4. Quality Evaluator Agent
5. Learning Insight Agent

V1 dışında bırakılanlar: autonomous AI tutor, autonomous curriculum agent, autonomous compliance agent ve benzeri geniş kapsamlı agent'lar.

## Belgeler

- `AI_RUNTIME_HARNESS.md`
- `AGENT_CATALOG.md`
- `MODEL_TIER_POLICY.md`
- `MODEL_ROUTER_AND_REGISTRY.md`
- `MODEL_PROMOTION_POLICY.md`
- `ULTEF_AI_PROFILE.md`
- `AI_GOLDEN_DATASET_STRATEGY.md`
- `AI_ACCEPTANCE_GATES.md`
