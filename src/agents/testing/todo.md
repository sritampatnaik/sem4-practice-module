# Testing Agent Todo

**Owner:** Muhammad Harun Bin Abdul Rashid  
**Date started:** 2026-08-17  
**Last updated:** 2026-09-26

## Session wrap-up

The first score-tracking slice is now wired and has passed initial signed-in live checks against the real Supabase table.

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

## Blocked / dependent work

- [ ] Run a signed-in Testing flow for **O-Level kinematics MCQs** and confirm repeated attempts update the same topic bucket.
- [ ] Run a signed-in Testing flow for **JC differentiation quiz** and confirm repeated attempts update the same topic bucket.
- [ ] Confirm guest behaviour stays safe and simply does **not** persist score history.

**Blockers:**
- live Testing-flow generation still depends on `OPENAI_API_KEY`
- richer evidence is still needed for repeated-attempt trend behaviour beyond the first successful manual score-history checks

## First tasks for next session

1. Configure `OPENAI_API_KEY` if needed for live desk checks.
2. Run a signed-in MCQ flow and confirm:
   - correct **Testing** stamp shown
   - answer key stays in the widget
   - score save succeeds
   - sidebar updates immediately
3. Repeat the same topic with different questions and confirm the history bucket shows improvement/regression correctly.
4. Test at least one second subject/topic so the progress feature is not only verified on one path.
5. Record the live results and any blockers in `progress.md`.
6. If score tracking keeps working, decide whether the next slice is:
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
- [ ] Decide whether a combined verifier / marker module should be added next.
- [ ] Decide whether richer SVG / HTML / CSS visual generation is still needed once Mermaid-first behaviour is tested.
