# Testing Agent Todo

**Owner:** Muhammad Harun Bin Abdul Rashid  
**Date started:** 2026-08-17  
**Last updated:** 2026-08-20

## Session wrap-up

This session is now focused on turning the Testing Agent into a more modular assessment system while staying inside the current one-agent routing architecture.

## Completed recently

- [x] Re-read `src/agents/testing/README.md` and keep all changes inside Testing scope.
- [x] Review `prompts.ts` against the README rules:
  - [x] widget-first output
  - [x] original items only
  - [x] grade-band and diagnostic alignment
  - [x] no full answer key in the first paragraph
  - [x] ambiguous subject handling
- [x] Review `tools.ts` and confirm the schema matches the documented widget contract:
  - [x] MCQ: 2-6 items, 3-5 options, valid `correctOptionId`
  - [x] flashcards: 3-8 cards with `front`, `back`, `topic`
- [x] Review `index.ts` wiring and confirm the Testing agent has the expected tools only.
- [x] Tighten `prompts.ts` where README-required behaviour was missing.
- [x] Tighten `tools.ts` where schema constraints were too loose.
- [x] Sync `langflow/prompts/testing.system.md` after the prompt update.
- [x] Record the session findings in `progress.md`.
- [x] Decide the high-level architecture direction:
  - [x] keep one public Testing agent
  - [x] treat other specialist agents as black boxes
  - [x] split new work into internal Testing modules/tools instead of new top-level routed agents
- [x] Add internal scaffolding for:
  - [x] assessment planning
  - [x] Mermaid-based visual planning
  - [x] server-side Testing-performance logs under `logs/`
  - [x] reading recent Testing-performance notes back into future Testing turns

## In progress now

- [x] Build an independent Testing harness surface:
  - [x] fixture profiles
  - [x] fixture scenarios
  - [x] direct `createTestingAgent(ctx)` harness path
  - [x] `GET /api/testing-harness` fixture listing
- [ ] Run full `POST /api/testing-harness` scenario checks with `OPENAI_API_KEY`.
- [ ] Decide whether `recordPerformance` should log every generated assessment by default or only selected milestone attempts.
- [ ] Decide whether the next verification slice should focus on:
  - [ ] correctness checking for generated MCQs
  - [ ] marking reported student outcomes
  - [ ] both, if the scope stays manageable
- [ ] Decide when Mermaid output is worth surfacing in prose before any shared UI renderer exists.

## Blocked / dependent work

- [ ] Run a Testing flow for **O-Level kinematics MCQs**.
- [ ] Run a Testing flow for **chemical bonding flashcards**.
- [ ] Run a Testing flow for **JC differentiation quiz**.
- [ ] Confirm each run shows the **Testing** stamp, renders the right widget, and keeps the answer key in the widget rather than dumping it in prose.

**Blocker:** live Testing-flow validation is blocked until `OPENAI_API_KEY` is configured in the environment.

## First tasks for next session

1. Configure `OPENAI_API_KEY`.
2. Run the Testing harness scenarios through `POST /api/testing-harness`.
3. Run the three Testing scenarios from the README through the full desk only after the harness behaviour is acceptable.
4. Check whether the agent meaningfully uses:
   - `planAssessment`
   - `getRecentPerformance`
   - `recordPerformance`
5. Record live behaviour in `progress.md`:
   - correct widget chosen
   - correct **Testing** stamp shown
   - answer key kept in widget
   - grade-band / subject quality
6. If any issue appears:
   - tighten `prompts.ts` if it is an instruction-quality problem
   - tighten `tools.ts` if it is a schema problem
   - coordinate with Sritam before touching shared widget files

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
- [ ] Decide whether a combined verifier / marker module should be added next.
- [ ] Decide whether richer SVG / HTML / CSS visual generation is still needed once Mermaid-first behaviour is tested.
