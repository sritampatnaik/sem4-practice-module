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
| `langflow/prompts/testing.system.md` | Keep in sync with `prompts.ts`. |

If the quiz **widget UI** is broken, that is `src/components/quiz-widget.tsx` / `flashcard-widget.tsx` / `message-thread.tsx`. Coordinate with the orchestration / UI owner (Sritam) before editing those.

## Tools you must keep

- `createMcqSet` — 2–6 items, 3–5 options, `correctOptionId` must match an option `id`
- `createFlashcards` — 3–8 cards with `front`, `back`, `topic`
- `documentSearchMath` / `documentSearchPhysics` / `documentSearchChemistry` — stay in-syllabus

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

## How to test

Ask the desk:

- "Give me five O-Level kinematics MCQs."
- "Flashcards on chemical bonding."
- "Quiz me on differentiation, H2."

Confirm the stamp says **Testing**, a widget appears, selecting an option reveals the explanation, and the Routing log shows `intent: testing`.
