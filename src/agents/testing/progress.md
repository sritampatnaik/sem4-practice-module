# Testing Agent Progress

**Owner:** Muhammad Harun Bin Abdul Rashid  
**Folder:** `src/agents/testing/`  
**Last updated:** 2026-09-18

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
  - a Physics-first Testing-owned source-tool path for grounding Physics assessments before widget generation

## What is already implemented for Testing

- `prompts.ts`
  - tells the agent to always call `createMcqSet` or `createFlashcards`
  - keeps output brief and widget-first
  - avoids dumping the full answer key in prose
- `tools.ts`
  - MCQ schema: 2-6 items, 3-5 options per item
  - flashcard schema: 3-8 cards
  - current `execute` functions echo structured input for the UI
- `index.ts`
  - wires the Testing Agent with both widget tools
  - includes syllabus search tools for all three subjects
  - now forces a Physics-first sourcing step for obvious Physics requests
  - uses `ToolLoopAgent` and `stepCountIs(10)`
- `subject-source.ts`
  - builds a structured Physics source pack from the syllabus search layer
  - returns support status, source excerpts, key concepts, formula hints, misconception seeds, question angles, and optional visual cues

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
- End-to-end app checks are currently blocked because `OPENAI_API_KEY` is not configured in this environment.

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

1. Run Physics harness scenarios once an `OPENAI_API_KEY` is available and confirm `getPhysicsAssessmentSource` is called before the Physics widget tool.
2. Confirm the model actually uses the Physics source pack rather than falling back to vague generic content.
3. Decide how quickly Maths and Chemistry should get equivalent Testing-owned source tools.
4. Confirm whether `recordPerformance` still produces useful notes without too much tool chatter after the extra sourcing step.
5. Add direct tool-contract checks around the source-pack shape and the harness output order.
6. If any widget-rendering issue appears during live checks, coordinate with Sritam before touching shared UI files.

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

## Suggested next-session start

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
