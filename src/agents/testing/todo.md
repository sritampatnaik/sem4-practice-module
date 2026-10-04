# Testing Agent Todo

**Owner:** Muhammad Harun Bin Abdul Rashid  
**Date started:** 2026-08-17  
**Last updated:** 2026-10-04

## Session wrap-up

Testing now has a first Testing-local guardrail layer plus stronger deterministic unit coverage, while the earlier score-tracking slice remains wired and passing its initial signed-in live checks. Follow-up quiz planning now uses persisted topic summaries first and deterministic score bands, but it still needs fuller live evidence.

## Completed recently

- [x] Keep score tracking separate from the note-only `recordPerformance` tool.
- [x] Add a dedicated score-history model for repeated MCQ attempts:
  - [x] topic/family key normalisation
  - [x] latest / previous / best summary
  - [x] improving / regressing / stable trend state
- [x] Add persistent signed-in MCQ attempt storage via Supabase:
  - [x] new `testing_attempts` migration
  - [x] `src/lib/testing-progress.ts`
  - [x] `src/app/api/testing-progress/route.ts`
- [x] Wire quiz submission to save completed scores from the UI:
  - [x] `src/components/quiz-widget.tsx`
  - [x] `src/components/message-thread.tsx`
  - [x] `src/components/studio-shell.tsx`
- [x] Add a first student-visible UI surface for progress:
  - [x] `src/components/testing-progress-panel.tsx`
  - [x] `src/components/student-sidebar.tsx`
- [x] Add score-history unit coverage and pass targeted lint/type checks.
- [x] Update Testing docs/context files with the score-tracking architecture and current blockers.
- [x] Add Testing-local guardrails for prompt-disclosure resistance, live-paper wording refusal, and answer-key-dump blocking in prose.
- [x] Add deterministic unit coverage for:
  - [x] `assessment-planner.ts`
  - [x] `guardrails.ts`
  - [x] `tools.ts` validation paths
- [x] Tighten `recordPerformance` with a strict note-only input contract.
- [x] Add a Testing eval item for ignore-instructions / hidden-rules resistance.
- [x] Add `getTopicScoreContext` so follow-up quizzes can look up topic-scoped score notes before planning.
- [x] Extend `assessment-planner.ts` with `easier` / `standard` / `harder` difficulty planning.
- [x] Add a Testing adaptive-difficulty eval for a regressing kinematics student.
- [x] Upgrade adaptive lookups so persisted `testing_attempts` summaries are the source of truth before falling back to profile-note hints.
- [x] Make adaptive difficulty deterministic:
  - [x] below 60% => `easier`
  - [x] 60% to 79% => `standard`
  - [x] 80% and above => `harder`
- [x] Add project-wide Promptfoo smoke-subset regression gating that now includes Testing smoke evals in the accepted CI baseline.
- [x] Add a minimum data-ethics / student-privacy slice:
  - [x] explicit non-disclosure rules in orchestration / Testing prompts
  - [x] narrow student-privacy detector in `src/lib/guardrails.ts`
  - [x] chat-route refusal path for obvious requests about another student's private data or learning records
  - [x] Promptfoo-covered privacy refusal eval in the smoke subset
- [x] Add token / cost logging per assessment:
  - [x] extend the existing Testing performance log schema
  - [x] capture `inputTokens`, `outputTokens`, and `costUsd`
  - [x] keep the implementation local to the Testing slice

## In progress now

- [x] Apply the new Supabase migration for `testing_attempts`.
- [x] Run initial signed-in end-to-end MCQ checks after the migration:
  - [x] submit a quiz
  - [x] confirm the save succeeds
  - [x] confirm the sidebar refreshes with latest / previous / best
- [ ] Run a stronger repeated-attempt validation pass:
  - [ ] same topic, different score
  - [ ] confirm improving/regressing/stable behaviour
  - [ ] check another subject/topic case
- [ ] Decide whether Testing follow-up logic should later read the persistent score summaries as well as note-only performance logs.
- [ ] Run live harness or desk checks for the new Testing-local guardrails once `OPENAI_API_KEY` is available.
- [ ] Run at least one live or harness follow-up quiz that proves the adaptive-difficulty signal actually changes the generated question style.
- [ ] Run signed-in repeated-topic checks to confirm persisted summaries are actually picked up by adaptive follow-up generation in realistic flows.
- [ ] Run one live Testing generation and confirm the saved `logs/testing-performance/` entry now includes token/cost fields.

## Blocked / dependent work

- [ ] Run a signed-in Testing flow for **O-Level kinematics MCQs** and confirm repeated attempts update the same topic bucket.
- [ ] Run a signed-in Testing flow for **JC differentiation quiz** and confirm repeated attempts update the same topic bucket.
- [ ] Confirm guest behaviour stays safe and simply does **not** persist score history.

**Blockers:**
- live Testing-flow generation still depends on `OPENAI_API_KEY`
- richer evidence is still needed for repeated-attempt trend behaviour beyond the first successful manual score-history checks
- live model evidence is still needed for the new guardrails because the current session only validated deterministic local tests, type-checking, and eval-catalog wiring
- adaptive difficulty now prefers persisted topic summaries, but broader repeated-attempt evidence is still needed across more subjects and topic buckets
- project-wide Promptfoo regression gating now means Testing smoke regressions can block CI, so prompt/guardrail changes need extra care even when the feature work is local
- the new privacy/data-ethics slice is intentionally minimal and still only covers obvious requests for another student's data
- token/cost logging is implemented, but still needs a real generated assessment log inspected as evidence

## First tasks for next session

1. Configure `OPENAI_API_KEY` if needed for live desk checks.
2. Run a signed-in MCQ flow and confirm:
   - correct **Testing** stamp shown
   - answer key stays in the widget
   - score save succeeds
   - sidebar updates immediately
3. Repeat the same topic with different questions and confirm the history bucket shows improvement/regression correctly.
4. Test at least one second subject/topic so the progress feature is not only verified on one path.
5. Run one prompt-injection or answer-key-dump harness scenario and confirm the new guardrail prose fallback appears while tool calls remain intact.
6. Run one adaptive follow-up scenario and confirm a regressing topic produces an easier quiz plan without affecting unrelated topics.
7. Run a signed-in repeated-topic scenario and confirm the persisted summary path, not just note fallback, is what drives the next quiz.
8. Run one live generation and inspect `logs/testing-performance/` for token/cost fields.
9. Record the live results and any blockers in `progress.md`.
10. If score tracking keeps working, decide whether the next slice is:
   - agent-side use of stored score summaries
   - richer filtering/history UI
   - or more harness/eval coverage

## Fortnightly report prep

- [x] Write safe points on what is already implemented for the Testing Agent.
- [ ] Write 3-5 bullets on what was validated in live app runs.
- [x] Write 2-3 bullets on remaining work for Phase 3.
- [x] Write down blockers, dependencies, or teammate coordination points.

## Nice follow-up improvements after live validation

- [ ] Check whether the prompt consistently chooses MCQs vs flashcards from user intent.
- [ ] Improve guidance for mixed-subject or unclear-subject Testing requests if needed.
- [ ] Check whether the short study note after widget creation is consistently concise and useful.
- [ ] Add direct tool-contract checks for the Testing harness and logging flow.
- [ ] Decide whether persistent score summaries should inform future Testing-agent adaptation.
- [ ] Decide whether adaptive lookups should later include non-MCQ persisted history signals rather than only MCQ summaries.
- [ ] Decide whether the minimum privacy/data-ethics slice should later expand to cover more PII patterns and policy wording.
- [ ] Decide whether token/cost logging should stay file-based or later feed a richer engineering dashboard.
- [ ] Decide whether a combined verifier / marker module should be added next.
- [ ] Decide whether richer SVG / HTML / CSS visual generation is still needed once Mermaid-first behaviour is tested.
- [ ] Decide whether Testing needs any additional guardrail-specific harness fixtures beyond the new eval and unit-test coverage.
