# Testing Agent

**Owner:** Muhammad Harun Bin Abdul Rashid  
**Folder:** `src/agents/testing/`

Tell a coding agent: *You are working on the METS Testing Agent only. Read this file fully. You generate assessments. You do not teach full lessons. Never recreate a live SEAB paper.*

## Job

When Orchestration routes `intent: testing`, you write **original** practice items for Math, Physics, or Chemistry, matched to the student's grade band and diagnostic snapshot.

You must call a tool so the UI can render a widget:

- `createMcqSet` → interactive MCQ (`src/components/quiz-widget.tsx`)
- `createFlashcards` → flip deck (`src/components/flashcard-widget.tsx`)

Then add a short study note in prose. Do not dump the full answer key in the first paragraph; the widget holds it.

## Files you may change

| File | Purpose |
| --- | --- |
| `prompts.ts` | System prompt. Bump `TESTING_PROMPT_VERSION` on every edit. |
| `tools.ts` | Zod schemas for MCQ and flashcard payloads. |
| `index.ts` | `createTestingAgent` wiring. |
| `assessment-planner.ts` | Internal planning helpers for mode / topic / visual decisions. |
| `performance-log.ts` | Server-side Testing-performance log helpers under `logs/`. |
| `langflow/prompts/testing.system.md` | Keep in sync with `prompts.ts`. |

If the quiz **widget UI** is broken, that is `src/components/quiz-widget.tsx` / `flashcard-widget.tsx` / `message-thread.tsx`. Coordinate with the orchestration / UI owner (Sritam) before editing those.

## Tools you must keep

- `createMcqSet` — 2–6 items, 3–5 options, `correctOptionId` must match an option `id`
- `createFlashcards` — 3–8 cards with `front`, `back`, `topic`
- `documentSearchMath` / `documentSearchPhysics` / `documentSearchChemistry` — stay in-syllabus

## Internal helper tools now available

- `planAssessment` — internal planning aid for MCQ vs flashcard, topic extraction, and whether a Mermaid diagram may help
- `getRecentPerformance` — reads the latest Testing notes for the current session from `logs/testing-performance/`
- `createMermaidDiagram` — builds Mermaid text for simple labelled visuals; the current UI does **not** render Mermaid yet
- `recordPerformance` — stores a compact Testing note for later follow-up; do not invent outcomes or scores

The `execute` functions currently echo the structured input. That is enough for the UI. Do not return a different shape without updating `McqSet` / `FlashcardSet` in `src/agents/_shared/types.ts` **and** the widgets.

## Files you must not change

- Subject teaching agents (math / physics / chemistry prompts and solvers)
- Orchestration classifier unless routing to Testing is wrong (then ping Sritam)

## Assessment rules

- Original items only. No reconstructed Ten-Year Series / live paper clones.
- Distractors must be plausible misconceptions, not jokes.
- Default 3–5 items unless the student asks otherwise.
- Match Primary vs O-Level vs A-Level from the profile.
- If the subject is ambiguous, pick one and say so, or ask one clarifying question.
- Treat Math / Physics / Chemistry as black-box specialists. Testing should use its own tools and shared syllabus search rather than calling subject agents.
- Keep one public Testing agent. If you need more modularity, add helper modules/tools inside `src/agents/testing/` rather than adding new top-level routed agents.

## How to test

Ask the desk:

- "Give me five O-Level kinematics MCQs."
- "Flashcards on chemical bonding."
- "Quiz me on differentiation, H2."

Confirm the stamp says **Testing**, a widget appears, selecting an option reveals the explanation, and the Routing log shows `intent: testing`.

## How to test independently of teammate agents

Use the dedicated Testing harness instead of the full `/api/chat` route when you want to work without depending on Orchestration or the other specialist agents.

- `GET /api/testing-harness`
  - lists the built-in Testing fixture profiles and scenario IDs
- `POST /api/testing-harness`
  - runs `createTestingAgent(ctx)` directly
  - bypasses Orchestration
  - bypasses Math / Physics / Chemistry agents
  - returns text, tool calls, tool results, and step summaries as JSON

Suggested workflow:

1. start the app with `OPENAI_API_KEY`
2. call `GET /api/testing-harness` to inspect fixture IDs
3. call `POST /api/testing-harness` with either:
   - `{"scenarioId":"secondary-kinematics-mcq"}`
   - or a custom `prompt`, `profile`, and optional `recentChats`
4. inspect:
   - widget tool choice
   - prompt quality
   - Mermaid planning behaviour
   - performance-log writes

This is the preferred local structure when teammate-owned agents or routing are incomplete.
