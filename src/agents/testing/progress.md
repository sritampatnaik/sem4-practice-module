# Testing Agent Progress

**Owner:** Muhammad Harun Bin Abdul Rashid  
**Folder:** `src/agents/testing/`  
**Last updated:** 2026-09-26

## Purpose

Use this file as the Testing Agent handoff note. At the end of each work session, update:

- what changed
- what was validated
- what is blocked
- what to start with next

Future chat sessions can read this file first to resume work quickly.

## Scope and boundaries

- I own the **Testing Agent** only.
- Main files in scope:
  - `src/agents/testing/prompts.ts`
  - `src/agents/testing/tools.ts`
  - `src/agents/testing/index.ts`
  - `langflow/prompts/testing.system.md`
- If a quiz or flashcard **widget UI** is broken, coordinate with Sritam before editing:
  - `src/components/quiz-widget.tsx`
  - `src/components/flashcard-widget.tsx`
  - `src/components/message-thread.tsx`
- Do not change subject specialist agents unless explicitly coordinated.

## Current repo state

- METS is a hierarchical multi-agent tutor for Singapore Primary, O-Level, and A-Level students.
- Student turns flow through `/api/chat` -> orchestration router -> one specialist agent.
- The Testing Agent handles `intent: testing`.
- Current Testing-agent behaviour already includes:
  - `createMcqSet` tool for interactive MCQ widgets
  - `createFlashcards` tool for interactive flashcard widgets
  - subject-specific document search tools for Math, Physics, and Chemistry
  - prompt guidance to generate original, syllabus-aligned assessments
  - Testing-local guardrails for prompt-disclosure resistance, live-paper wording refusal, and answer-key-dump blocking in prose
  - Testing-owned Maths / Physics / Chemistry source-tool paths for grounding assessments before widget generation
  - signed-in MCQ score tracking backed by Supabase, with sidebar history summaries in the UI

## What is already implemented for Testing

- `prompts.ts`
  - tells the agent to always call `createMcqSet` or `createFlashcards`
  - keeps output brief and widget-first
  - avoids dumping the full answer key in prose
  - now treats student/context/source text as untrusted data and explicitly refuses hidden-instruction requests
- `tools.ts`
  - MCQ schema: 2-6 items, 3-5 options per item
  - flashcard schema: 3-8 cards
  - current `execute` functions echo structured input for the UI
  - `recordPerformance` now uses a strict note-only input contract
- `index.ts`
  - wires the Testing Agent with both widget tools
  - includes syllabus search tools for all three subjects
  - now forces a subject-matched sourcing step for clear Maths / Physics / Chemistry requests
  - now wraps the model with Testing-local guardrails before streaming prose
  - uses `ToolLoopAgent` and `stepCountIs(10)`
- `guardrails.ts`
  - blocks obvious hidden-prompt disclosures, live-paper wording leaks, and full answer-key dumps in prose
  - preserves tool calls/results and replaces interrupted streamed text with a short fallback
- `subject-source.ts`
  - builds structured Maths, Physics, and Chemistry source packs from the syllabus search layer
  - returns support status, source excerpts, learning outcomes, key concepts, formula hints, misconception seeds, question angles, and optional visual cues
- unit tests
  - now cover planner behaviour, guardrail behaviour, tool/schema validation, source-pack grounding, and score-history summaries
- `score-history.ts` + testing-progress route/helpers
  - normalise repeated MCQ attempts into subject + topic/family + mode history buckets
  - summarise latest / previous / best attempts with improving / regressing / stable trend states
  - persist signed-in MCQ attempts into Supabase and surface them in the student sidebar

## Proposal mapping

My work aligns most directly with **Phase 3: Testing Module & Tool Development** in `METS_Proposal.md`:

- **3.1** Flashcard Creation tool and Testing Agent integration
- **3.2** MCQ Creation tool, answer-key generation, and formatting constraints

Related support work for reporting:

- confirm the Testing flow works end-to-end
- improve prompt quality and output consistency
- verify tool schemas match UI/widget expectations

## Session status

### Completed / known

- Ownership and scope confirmed from `TEAM.md` and `src/agents/testing/README.md`.
- Testing-agent files and boundaries identified.
- Testing prompt and schema review has started.
- The Testing prompt now more explicitly covers:
  - widget selection
  - ambiguous-subject handling
  - syllabus-fit checking
  - concise, widget-first answer behaviour
- The Testing tool schemas now reject:
  - blank strings in required fields
  - duplicate MCQ item / option IDs
  - duplicate flashcard IDs
  - MCQs whose `correctOptionId` does not match a real option ID
- `index.ts` wiring still matches the documented Testing scope and tool set.

### Not yet validated in-app

- Whether the current Testing prompt reliably calls the correct widget tool for varied requests.
- Whether generated MCQs and flashcards consistently match grade band and diagnostics.
- Whether the rendered widgets behave correctly in the live app for the three planned scenarios.
- Whether broader repeated-attempt flows across several topics continue to summarise trends correctly.
- End-to-end app checks still depend on `OPENAI_API_KEY` when live Testing-agent generation is needed.

## 2026-08-20 architecture update

- **Decision:** keep one public Testing agent and treat the other specialist agents as black boxes unless a shared contract needs coordination.
- **Added internal scaffolding:**
  - `src/agents/testing/assessment-planner.ts`
  - `src/agents/testing/performance-log.ts`
- **Expanded Testing tools:**
  - `planAssessment`
  - `getRecentPerformance`
  - `createMermaidDiagram`
  - `recordPerformance`
- **Persistence direction:** Testing-performance notes now target server-side files under `logs/testing-performance/`, which stays aligned with the repo's no-database rule.
- **Prompt direction:** the Testing prompt now supports modular internal planning, Mermaid-first visual planning, and reusable Testing notes while still requiring exactly one widget tool per assessment response.

### Why this matters

- This gives Harun a modular Testing subsystem without changing the top-level routing architecture.
- It establishes a reusable path for future MCQ / flashcard / verifier / logger work inside `src/agents/testing/`.
- It avoids taking on shared UI work too early, since the current UI still only renders MCQ and flashcard widgets directly.

## 2026-08-20 independent harness update

- **Added Testing-owned fixture data:**
  - `src/agents/testing/fixtures/profiles.ts`
  - `src/agents/testing/fixtures/scenarios.ts`
- **Added direct Testing harness logic:**
  - `src/agents/testing/harness.ts`
  - `src/app/api/testing-harness/route.ts`
- **Independent structure now available:**
  - `GET /api/testing-harness` lists canonical Testing profiles and scenarios
  - `POST /api/testing-harness` runs `createTestingAgent(ctx)` directly
  - this bypasses Orchestration and does not depend on Math / Physics / Chemistry agents being ready

### Why this matters

- Harun can now test the Testing subsystem in isolation instead of waiting for teammate-owned routing or specialist agents.
- The new harness creates a cleaner boundary between **Testing-owned validation** and **shared end-to-end validation**.
- Fixture scenarios now give a repeatable baseline for future verifier / marker work.

## Likely gaps to investigate next

1. Confirm the model consistently uses the matching subject source pack rather than falling back to vague generic content.
2. Improve source-pack precision so learning outcomes, concepts, and hints are less broad.
3. Run live Testing-agent checks for the new local guardrails once `OPENAI_API_KEY` is available.
4. Add more harness scenarios for all-subject ambiguity, unsupported topics, and follow-up prompts if the new guardrail contract needs richer runtime evidence.
5. Confirm whether `recordPerformance` still produces useful notes without too much tool chatter after the source step.
6. If any widget-rendering issue appears during live checks, coordinate with Sritam before touching shared UI files.

## 2026-09-26 guardrails and unit-test update

- **Changed:**
  - `src/agents/testing/guardrails.ts`
  - `src/agents/testing/guardrails.test.ts`
  - `src/agents/testing/assessment-planner.test.ts`
  - `src/agents/testing/tools.test.ts`
  - `src/agents/testing/index.ts`
  - `src/agents/testing/prompts.ts`
  - `src/agents/testing/tools.ts`
  - `src/agents/testing/subject-source.test.ts`
  - `src/evals/catalog/testing.ts`
  - `langflow/prompts/testing.system.md`
  - Testing context/docs files
- **Validated:**
  - `npx tsx --test src/agents/testing/assessment-planner.test.ts src/agents/testing/guardrails.test.ts src/agents/testing/tools.test.ts src/agents/testing/subject-source.test.ts src/agents/testing/score-history.test.ts`
  - `npx eslint src/agents/testing/index.ts src/agents/testing/prompts.ts src/agents/testing/tools.ts src/agents/testing/guardrails.ts src/agents/testing/guardrails.test.ts src/agents/testing/assessment-planner.ts src/agents/testing/assessment-planner.test.ts src/agents/testing/tools.test.ts src/agents/testing/subject-source.test.ts src/evals/catalog/testing.ts`
  - `npm run typecheck`
- **Findings:**
  - Testing previously relied on prompt wording for several assessment-integrity boundaries that are now backed by deterministic local middleware
  - a strict `recordPerformance` input schema is a better enforcement point than documentation alone for the note-only rule
  - planner/topic extraction benefited from trimming polite trailing filler such as "for me please", which also makes unit tests less brittle
  - the existing Physics source-pack test was too tied to the word "kinematics" even though the current syllabus chunk is phrased in terms of motion graphs, velocity, and acceleration
- **Blockers:**
  - live model evidence for the new guardrails still depends on `OPENAI_API_KEY`
  - repeated-attempt score-history checks across more topics are still pending
- **Next:**
  - run at least one live Testing harness or desk scenario that tries to reveal hidden instructions
  - run one live answer-key-dump attempt and confirm the prose fallback appears without breaking the widget flow
  - continue the repeated-attempt score-history validation pass

## 2026-09-18 architecture update

- **Decision:** keep Testing fully self-contained and do not let it communicate with the Math / Physics / Chemistry agents.
- **Physics-first implementation added:**
  - `src/agents/testing/subject-source.ts`
  - `getPhysicsAssessmentSource` tool in `src/agents/testing/tools.ts`
  - Testing prompt guidance that Physics requests must source content first
  - a first-step tool choice in `src/agents/testing/index.ts` for obvious Physics requests
- **Engineering rationale:**
  - preserves the one-agent routing model
  - keeps subject sourcing, assessment planning, widget generation, and logging separated
  - makes Physics support explicit and testable rather than implicit model knowledge

### Why this matters

- This keeps the Testing subsystem aligned with the repository rule that specialists do not talk to each other.
- It gives Harun a cleaner software-engineering story for the professors: explicit contracts, explicit failures, and narrower responsibilities.
- It creates a reusable pattern for future Maths and Chemistry source tools without changing teammate-owned agent code.

## 2026-09-18 session update

- **Changed:**
  - `src/agents/testing/index.ts`
  - `src/agents/testing/prompts.ts`
  - `src/agents/testing/tools.ts`
  - `src/agents/testing/subject-source.ts`
  - `src/agents/testing/harness.ts`
  - `src/agents/testing/CLAUDE.md`
  - `src/agents/testing/README.md`
  - `src/agents/testing/fixtures/scenarios.ts`
  - `langflow/prompts/testing.system.md`
- **Validated:**
  - targeted lint for the edited Testing files
  - direct TypeScript load check for the new Physics source tool path
  - live harness requests on `http://localhost:3000/api/testing-harness`
- **Findings:**
  - the previous Testing flow still relied too much on the model's implicit Physics knowledge
  - a Testing-owned source pack is a cleaner compromise than specialist-to-specialist communication
  - Physics is a safe first slice because its prompts and harness scenarios are already well represented
  - the harness originally under-reported tool activity because top-level `toolCalls` / `toolResults` were empty even when `steps` showed tool execution
  - the harness should derive debug payloads from `result.steps` so Testing tool inputs and outputs are inspectable
  - Physics MCQ generation can still produce correctness mistakes unless the marked answer is checked against the explanation
  - `recordPerformance` should stay note-only so the agent cannot invent an outcome field during assessment generation
- **Blockers:**
  - live model validation still depends on `OPENAI_API_KEY`
  - Maths and Chemistry still need equivalent Testing-owned source tools if the architecture is extended consistently
- **Next:**
  - rerun the Physics harness scenarios and confirm top-level tool payloads now match step activity
  - decide whether to add Maths or Chemistry next
  - add eval coverage for source-tool ordering and unsupported-topic failures

## 2026-09-19 session update

- **Changed:**
  - `src/agents/testing/subject-source.ts`
  - `src/agents/testing/tools.ts`
  - `src/agents/testing/index.ts`
  - `src/agents/testing/prompts.ts`
  - `src/agents/testing/README.md`
  - `src/agents/testing/subject-source.test.ts`
  - `langflow/prompts/testing.system.md`
- **Validated:**
  - `npx tsx --test src/agents/testing/subject-source.test.ts`
  - targeted lint for the edited Testing files
- **Findings:**
  - Maths and Chemistry now have Testing-owned source packs parallel to Physics
  - weak syllabus matches return `supported: false` with empty outcomes instead of inventing content
  - the prompt now grounds quiz generation in the matching source tool, not raw `documentSearchMath` / `documentSearchChemistry`
- **Blockers:**
  - live model validation still depends on `OPENAI_API_KEY`
  - richer official syllabus maps will improve learning-outcome quality later
- **Next:**
  - run harness scenarios once an API key is available and confirm the matching source tool is called before the widget

## 2026-09-20 all-subject harness update

- **Validated:**
  - `npx tsx --test src/agents/testing/subject-source.test.ts`
  - live harness requests on `http://localhost:3000/api/testing-harness` for:
    - `secondary-kinematics-mcq`
    - `secondary-kinematics-followup`
    - `secondary-physics-waves-flashcards`
    - `jc-differentiation-quiz`
    - `secondary-bonding-flashcards`
- **Findings:**
  - clear Maths, Physics, and Chemistry prompts now call their matching source tool before widget generation
  - `recordPerformance` stayed note-only in the successful harness runs
  - the all-subject source-tool contract is now present in code, tests, and runtime behaviour
  - source-pack quality is still uneven; some `learningOutcomes`, `keyConcepts`, and `formulaHints` remain broader than ideal
  - follow-up prompts can fail closed too aggressively, which is safe but may need refinement for better user experience
- **Blockers:**
  - the local dev server reports an unrelated `shadow-plugin/unprefixed` module-resolution error under `src/app/beautifui`, even though the Testing harness endpoint still responds
  - richer official syllabus maps will improve learning-outcome quality later
- **Next:**
  - refine all-subject source-pack quality
  - add more harness and eval coverage for unsupported topics and follow-up prompts
  - keep docs aligned with the all-subject source-tool architecture

## 2026-09-22 score-tracking update

- **Changed:**
  - `src/agents/testing/score-history.ts`
  - `src/agents/testing/score-history.test.ts`
  - `src/lib/testing-progress.ts`
  - `src/app/api/testing-progress/route.ts`
  - `src/components/quiz-widget.tsx`
  - `src/components/message-thread.tsx`
  - `src/components/student-sidebar.tsx`
  - `src/components/testing-progress-panel.tsx`
  - `src/components/studio-shell.tsx`
  - `src/lib/database.types.ts`
  - `supabase/migrations/20260922145000_testing_attempts.sql`
  - `src/agents/testing/README.md`
- **Validated:**
  - score-history unit tests
  - targeted lint/type checks for the new Testing progress files
- **Findings:**
  - quiz scores previously existed only in `QuizWidget` client state and disappeared after the turn
  - `recordPerformance` should stay note-only; score persistence is cleaner as a separate Supabase-backed attempt model
  - signed-in MCQ attempts can now be grouped by subject + topic/family + mode to show latest, previous, best, and trend in the UI
- **Blockers:**
  - Supabase migration must be applied before live score tracking works end-to-end
  - guest users are intentionally out of scope for persistent score history in this first slice
- **Next:**
  - apply the new Supabase migration
  - run signed-in end-to-end MCQ checks and confirm the sidebar updates after submission
  - decide whether Testing-agent follow-up tools should also consume the stored score summaries later

## 2026-09-26 signed-in score-tracking check

- **Validated:**
  - Supabase `public.testing_attempts` table is now present in the dashboard
  - initial signed-in score-tracking checks look good so far in the live UI
- **Findings:**
  - the earlier schema-cache error was environmental, not a code-path bug; once the table existed, the score-history flow could proceed normally
  - the Testing sidebar can now read back persisted MCQ progress from Supabase in initial manual checks
  - this gives a stronger software-engineering story: migration-defined schema, server route for writes/reads, grouped summaries, and a visible UI consumer
- **Blockers:**
  - broader repeated-attempt testing is still needed for stronger evidence on improving/regressing trend behaviour across multiple topics
  - full live Testing-agent generation checks still depend on `OPENAI_API_KEY` when the quiz itself must be generated on demand
- **Next:**
  - run a more deliberate same-topic repeated-attempt check and capture the trend behaviour
  - test at least one more subject/topic path besides the first successful score-tracking case
  - decide whether to surface score history back into future Testing-agent adaptation



Start with:

1. read `src/agents/testing/README.md`
2. read this `progress.md`
3. open `src/agents/testing/todo.md`
4. inspect `prompts.ts` and `tools.ts`
5. run a few Testing-agent scenarios and record findings back here

## Fortnightly report notes

### Safe points to report now

- The Testing Agent exists and is wired into the orchestration-based architecture.
- Interactive assessment generation is already scaffolded through MCQ and flashcard tools.
- My scope is clearly separated from the teaching agents.
- Current work focus is on Testing-agent behaviour quality, schema correctness, and end-to-end validation.

### Good evidence to collect next

- screenshots or notes from successful quiz / flashcard runs
- examples of grade-band-aligned outputs
- fixes or refinements made in `prompts.ts` / `tools.ts`
- any blockers that require coordination with shared UI or routing owners

## 2026-08-18 session update

- **Changed:**
  - `src/agents/testing/prompts.ts`
  - `src/agents/testing/tools.ts`
  - `langflow/prompts/testing.system.md`
- **Validated:**
  - `npx eslint src/agents/testing/prompts.ts src/agents/testing/tools.ts src/agents/testing/index.ts`
  - direct schema checks through Node TypeScript stripping for valid and invalid MCQ / flashcard payloads
- **Findings:**
  - the prompt was missing several README-level rules before this session
  - the schema previously allowed invalid `correctOptionId` values and duplicate IDs
  - project-wide `npx tsc --noEmit -p tsconfig.json` is currently blocked by a pre-existing unrelated error in `src/app/layout.tsx` (`LayoutProps` not found)
- **Blockers:**
  - live Testing-flow validation is blocked until `OPENAI_API_KEY` is configured
  - if live checks reveal shared widget issues, coordinate with Sritam before editing shared UI files
- **Next:**
  - configure `OPENAI_API_KEY`
  - run the O-Level kinematics, chemical bonding flashcards, and JC differentiation Testing scenarios
  - record the live results and any routing/widget issues here

## 2026-08-20 session update

- **Changed:**
  - `src/app/api/testing-harness/route.ts`
  - `src/agents/testing/assessment-planner.ts`
  - `src/agents/testing/fixtures/profiles.ts`
  - `src/agents/testing/fixtures/scenarios.ts`
  - `src/agents/testing/harness.ts`
  - `src/agents/testing/performance-log.ts`
  - `src/agents/testing/tools.ts`
  - `src/agents/testing/prompts.ts`
  - `src/agents/testing/index.ts`
  - `src/agents/testing/README.md`
  - `src/agents/testing/todo.md`
  - `langflow/prompts/testing.system.md`
- **Validated:**
  - architectural review against `AGENTS.md`, `TEAM.md`, `docs/HOW-IT-WORKS.md`, and `src/agents/testing/README.md`
  - tool wiring review to keep one public Testing agent and confine new modularity inside `src/agents/testing/`
  - `npx eslint src/agents/testing/fixtures/profiles.ts src/agents/testing/fixtures/scenarios.ts src/agents/testing/harness.ts src/app/api/testing-harness/route.ts`
  - `GET http://localhost:3020/api/testing-harness` returns the Testing fixture catalog
  - `POST http://localhost:3020/api/testing-harness` correctly blocks on missing `OPENAI_API_KEY`
- **Findings:**
  - the codebase supports internal Testing modularity more safely than adding new top-level routed agents
  - current UI still only renders MCQ and flashcard widgets directly, so Mermaid support is planning-first for now
  - a server-side file log fits the current repo better than introducing a database
  - a dedicated Testing harness route is a practical way to validate Testing without waiting for teammate-owned routing
- **Blockers:**
  - live model validation is still blocked until `OPENAI_API_KEY` is configured
  - richer visual rendering would require shared UI coordination if Mermaid should become truly visual in-app
- **Next:**
  - run live Testing harness scenarios once `OPENAI_API_KEY` is available
  - add direct tool-contract checks around harness outputs and log reads
  - run full-desk Testing scenarios only after the harness behaviour is acceptable
  - decide whether the next slice is verifier/marker logic or richer visual support

## End-of-session update checklist

Before ending a work session, update:

- **Changed:** files edited
- **Validated:** commands or manual scenarios run
- **Findings:** important behaviour or bugs discovered
- **Blockers:** anything needing teammate coordination
- **Next:** the first concrete task for the next session
