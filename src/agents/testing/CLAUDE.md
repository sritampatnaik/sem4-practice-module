# Testing Agent Working Notes

This file is for **Harun's Testing-agent context and decision log**. It can be committed so teammates can read it, but it is written primarily as a working memory and final-report aid for the Testing agent slice.

## Before and after summary

### Earlier Testing state

- Testing was already the single routed assessment agent.
- It could generate MCQ and flashcard widgets with:
  - `createMcqSet`
  - `createFlashcards`
- It also had shared syllabus-search access and internal helpers such as:
  - `planAssessment`
  - `getRecentPerformance`
  - `createMermaidDiagram`
  - `recordPerformance`
- The main weakness was that Physics assessments still depended too much on the model's **implicit subject knowledge** rather than an explicit Testing-owned subject-source contract.
- The first Testing harness version also under-reported tool activity because top-level `toolCalls` and `toolResults` could appear empty even when step data showed real tool execution.

### Current Testing state after this work

- Testing is still one routed agent and still does **not** communicate with other specialist agents.
- Testing now has **Testing-owned syllabus grounding tools for all three subjects**:
  - `getPhysicsAssessmentSource`
  - `getMathAssessmentSource`
  - `getChemistryAssessmentSource`
- Clear subject requests now follow a more explicit flow:
  1. source subject-grounded material first
  2. build exactly one widget
  3. optionally record a compact Testing note
  4. return brief prose without leaking the full answer key
- The harness now exposes:
  - top-level `toolCalls`
  - top-level `toolResults`
  - per-step tool payloads
- Physics MCQ generation has an extra validation guard for **numeric explanation vs correct-answer mismatches**
- `recordPerformance` is now treated as a **note-only tool** during assessment generation
- Signed-in students now also have **persistent MCQ score tracking** backed by Supabase:
  - scores are recorded from the UI after quiz submission
  - grouped by subject + topic/family + mode
  - surfaced in the sidebar as latest / previous / best with a simple trend state
  - this is separate from `recordPerformance`
  - initial live testing now looks good after the table was created in Supabase

## Scope

- Folder owner: **Muhammad Harun Bin Abdul Rashid**
- Main scope: `src/agents/testing/`
- Do **not** treat this as authority for other specialist folders

## Current architecture decisions

### 1. One public Testing agent only

- Testing remains the only routed assessment agent.
- It should not be split into separate top-level routed quiz agents.
- Orchestration still chooses the Testing agent through the normal app flow.

### 2. No specialist-to-specialist communication

- Testing should **not** communicate directly with Math, Physics, or Chemistry agents.
- This preserves the repository architecture rule that specialists do not call each other.
- Any subject grounding needed by Testing must come from **Testing-owned tools or helpers**, not another specialist's prompt loop.

### 3. Testing-owned subject sourcing

- Testing now uses its own source tools rather than specialist-agent communication.
- The current source-tool set is:
  - `getPhysicsAssessmentSource`
  - `getMathAssessmentSource`
  - `getChemistryAssessmentSource`
- The source packs are built in `src/agents/testing/subject-source.ts`.
- The goal is to make assessment content more explicit, testable, and less dependent on unstated model knowledge.

### 4. Separation of concerns

The intended responsibility split is:

- **subject-source tools** → gather subject-grounded content
- **assessment planner** → infer mode, topics, and visual need
- **widget tools** → produce valid MCQ / flashcard payloads
- **logging tools** → record compact Testing notes for follow-up
- **score-history persistence** → save completed signed-in MCQ attempts and summarise improvement/regression

This separation matters for the professors' software-engineering emphasis.

### 5. Validation-first debugging

- The Testing harness is a first-class debugging surface, not just a convenience endpoint.
- If Testing behaviour cannot be inspected through the harness, it is harder to justify engineering quality in the final report.
- For that reason, reliable harness visibility into source-tool calls, widget payloads, and logging calls is part of the design, not just an implementation detail.

## Current Testing tools

### Widget tools

- `createMcqSet`
- `createFlashcards`

### Subject/source tools

- `getPhysicsAssessmentSource`
- `getMathAssessmentSource`
- `getChemistryAssessmentSource`
- `documentSearchMath`
- `documentSearchPhysics`
- `documentSearchChemistry`

### Internal helper tools

- `planAssessment`
- `getRecentPerformance`
- `createMermaidDiagram`
- `recordPerformance` (assessment note only; no outcome or score fields)

## Current rollout state

- **Physics**: Testing-owned source-tool path implemented and exercised through the harness
- **Maths**: Testing-owned source-tool path implemented and exercised through the harness
- **Chemistry**: Testing-owned source-tool path implemented and exercised through the harness
- **Score tracking**: signed-in MCQ attempt persistence and sidebar trend summary are implemented and now reaching the live Supabase table in initial testing

All three now follow the same intended source-tool contract.

## Important implementation files

- `src/agents/testing/index.ts`
- `src/agents/testing/prompts.ts`
- `src/agents/testing/tools.ts`
- `src/agents/testing/subject-source.ts`
- `src/agents/testing/harness.ts`
- `src/agents/testing/assessment-planner.ts`
- `src/agents/testing/performance-log.ts`
- `src/agents/testing/score-history.ts`
- `src/agents/testing/fixtures/scenarios.ts`
- `src/agents/testing/score-history.test.ts`
- `src/agents/testing/subject-source.test.ts`
- `src/agents/testing/progress.md`

## Testing harness notes

- The main debug surface is `POST /api/testing-harness`.
- The harness now surfaces **actual tool calls and tool results**, not just final text.
- A previous issue was that top-level `toolCalls` / `toolResults` appeared empty even when step data showed tool execution.
- That was fixed by deriving tool-call and tool-result payloads from `result.steps` and returning them in the harness response for reliable debugging.

## What was tested and what we found

### Harness scenarios exercised

- `secondary-kinematics-mcq`
- `secondary-kinematics-followup`
- `secondary-physics-waves-flashcards`
- `jc-differentiation-quiz`
- `secondary-bonding-flashcards`

### Initial live findings before the harness/debug fix

1. Physics-first sourcing was being triggered correctly.
2. The step trace showed the intended order:
   - `getPhysicsAssessmentSource`
   - then one widget tool
3. The follow-up kinematics scenario adapted towards velocity-time graphs, which was good.
4. However, the harness response was incomplete because top-level tool payloads were missing.

### Findings after the harness/debug fix

1. Top-level `toolCalls` and `toolResults` became visible again.
2. The actual Physics source-pack payloads, widget payloads, and `recordPerformance` payloads could now be inspected directly.

### Findings after the quality fixes

1. **All-subject source-tool routing is working for clear prompts**
   - obvious Physics requests source through `getPhysicsAssessmentSource` first
   - obvious Maths requests source through `getMathAssessmentSource` first
   - obvious Chemistry requests source through `getChemistryAssessmentSource` first
   - then each flow calls exactly one widget tool

2. **Harness debugging is working**
   - top-level and per-step payloads are visible
   - easier to justify the design and debug behaviour

3. **Physics numeric MCQ validation improved**
   - added a guard so a Physics explanation's final numeric answer should match the marked correct option

4. **`recordPerformance` behaviour improved**
   - it now behaves as a note-only tool in the successful reruns
   - invented outcome fields were removed from the later successful runs

5. **Source-pack heuristics improved, but are still somewhat coarse**
   - wave prompts now suggest a **wave diagram** instead of an irrelevant force diagram
   - source chunks, key concepts, and hints can still be broader than ideal because they come from syllabus excerpts

6. **Remaining limitation**
   - the contract exists for all three subjects, but source-pack quality and follow-up behaviour still need refinement
   - harness coverage should keep expanding for more mixed, follow-up, and unsupported-topic cases

## Software-engineering points to highlight in the final report

### Architecture and modularity

- Preserved one-agent routing architecture
- Avoided specialist-to-specialist communication
- Introduced Testing-owned subject sourcing instead of informal cross-agent coupling
- Kept sourcing, planning, rendering, and logging separate

### Validation and contracts

- Zod-backed tool schemas for widget contracts
- Validation for duplicate IDs and invalid `correctOptionId`
- Physics MCQ validation for explanation-vs-answer numeric mismatches
- Structured source-pack contract for Maths, Physics, and Chemistry
- Harness-based debugging surface for Testing in isolation

### Safety and guardrails

- API keys stay in environment variables
- Input still passes through existing guardrails
- Live-paper cloning remains disallowed
- `recordPerformance` is note-only during assessment generation, so invented outcome fields are disallowed
- Physics source-tool failures should surface explicitly rather than silently invent content

### Maintainability

- Prompt versioning is tracked in `TESTING_PROMPT_VERSION`
- Langflow prompt copy is kept in sync
- Fixture scenarios support repeatable harness runs
- Progress and architecture notes are documented in-repo
- `CLAUDE.md` now also acts as a running Testing-agent decision log for later reporting

## Open follow-up work

1. Improve source-pack quality for Maths, Physics, and Chemistry so outcomes, concepts, hints, and misconceptions are less coarse
2. Do a more thorough signed-in score-tracking pass across multiple topics and repeated attempts
3. Confirm live UI behaviour after the auth/login path, including sidebar score-history updates after MCQ submission
4. Extend eval coverage for source-tool ordering, note-only logging, unsupported-topic failures, and follow-up prompts
5. Decide whether Testing follow-up logic should also consume the stored score summaries later
6. Decide whether harness output should include even richer debugging metadata

## Suggested final-report framing

If you need a concise explanation of your design choices:

> The Testing agent was refactored to stay self-contained and software-engineering-driven. Instead of depending on direct communication with subject agents, it now uses Testing-owned subject-sourcing tools for Maths, Physics, and Chemistry. This preserves modular boundaries, improves testability, makes failures more explicit, and aligns better with the project's emphasis on maintainable architecture rather than only raw feature output.
