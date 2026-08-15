# Sprint 16 Question Bank & Assessment UI Qualification

Issue: #47

Implemented boundaries:
- instructor question bank and assessment workspace
- AI-generated questions remain proposals until explicit approval
- reviewer-facing evidence lineage visibility
- assessment publish requires approved QuestionVersion ids
- published assessment boundary is represented as immutable snapshot semantics
- learner projection strips answerKey and reviewer-only evidence detail
- responsive layout for question and assessment surfaces

Executable evidence:
- `apps/web/src/assessment-ui.test.ts`
- learner projection answer-key secrecy
- AI proposal publish blocking
- approved-only snapshot publish eligibility
- empty/already-published publish blocking

Generic extraction candidate:
- UI publish surfaces for immutable/versioned domain aggregates should expose the snapshot boundary explicitly and tests should verify that mutable draft entities cannot silently alter published projections.

Closure gate:
- GitHub Actions typecheck/test/build PASS required before merge.
