# AI Prompt Library — Project Baseline V1

Status: Canonical project profile
Global standards: STD-AI-001, STD-AI-006
Related issue: #5

## Principles
- Prompt is a versioned contract, not an ad-hoc string.
- Capability, schema, evidence, language, safety and refusal/insufficient-evidence behavior are explicit.
- Prompt version and model version are independently traceable.
- Domain truth comes from provided authoritative/evidence context, never model memory.
- Structured outputs are schema validated before evaluation or domain use.

## Prompt Families

### CI-001 Content Intelligence / Source Analysis
Purpose: analyze READY source evidence and produce concepts, sections, candidate learning objectives and coverage gaps.
Inputs: training brief, target audience, target language, evidence segments, optional existing objectives.
Output: structured JSON with concepts, objective_candidates, outline_candidates, evidence_refs, gaps, confidence.
Hard rules: no unsupported claims; evidence refs required for substantive source-derived findings; report gaps instead of inventing.

### QG-001 Question Generation
Purpose: generate assessment/question-bank candidates grounded in evidence and aligned to approved Learning Objectives.
Inputs: approved objective, evidence segments, question type/difficulty policy, language, quantity.
Output: structured JSON question candidates with stem/options/correct answer/explanation/objective_id/evidence_refs/difficulty rationale.
Hard rules: answer must be supported; no trick ambiguity; no answer-key leakage fields outside protected schema; insufficient evidence returns gap/status rather than fabricated question.

### QE-001 Quality Evaluator
Purpose: independently evaluate generated content/questions.
Inputs: candidate artifact, objective, evidence, rubric version.
Output: dimension scores/findings, hard_gate_results, recommendation PASS/REPAIR/HUMAN_REVIEW/REJECT.
Dimensions: grounding, correctness, ambiguity, objective alignment, difficulty fit, distractor quality where applicable, duplication, language quality, safety.
Hard rules: evaluator cannot publish/commit; deterministic validator results are authoritative where applicable.

### LI-001 Learning Insight
Purpose: produce bounded learner-facing insight from assessment evidence.
Inputs: assessment result, objective-level evidence aggregation, available training content mappings.
Output: weak_areas, strengths when sufficiently evidenced, confidence/evidence, recommended existing content.
Hard rules: no HR/career/disciplinary inference; no broad competency claim from insufficient evidence; no mutation of official result.

## Versioning
Prompt IDs are stable. Semantic behavior/schema changes increment version. Every runtime generation stores prompt_id, prompt_version, model/provider identity, schema version and evaluation profile.

## Promotion
A new prompt version is not production-ready until golden/regression evaluation passes the project ULTEF AI profile and no applicable hard gate regresses.
