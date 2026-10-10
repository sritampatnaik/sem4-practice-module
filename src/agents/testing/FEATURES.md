# Testing Agent — Good-to-Have Features

Ranked by report impact (SE principles + LLMOps story + demo-ability).

## 1. Adaptive Difficulty `[HIGH]`

**What:** Use `score-history` trend data to adjust item difficulty on the next quiz.
If trend is `regressing` or score < 60 % → emit `difficulty: easier` from `assessment-planner`.
If trend is `improving` → emit `difficulty: harder`.
Prompt instructs the agent to match difficulty to the flag.

**Why it matters:** Closes the loop between score tracking and generation.
Turns "I built logging" into "I built an adaptive system."
Directly demonstrates feedback-driven LLMOps iteration.

**Files touched:** `assessment-planner.ts`, `prompts.ts`, `tools.ts`, `score-history.ts`

---

## 2. Eval Regression Gate in CI `[HIGH]`

**What:** After each promptfoo CI run, extract pass rate per suite from
`promptfoo-results.json` and compare against a committed
`promptfoo/baseline.json`. Fail the job if any suite drops > 10 %.

**Why it matters:** Converts CI from "evals run" to "evals gate".
Demonstrates eval drift detection — the core LLMOps discipline.
Easy to explain: *if the model gets worse, the build breaks.*

**Files touched:** new `promptfoo/check-regression.ts`, `.github/workflows/build.yml`

---

## 3. Flashcard Completion Tracking `[MEDIUM]`

**What:** Extend `testing_attempts` Supabase table to log flashcard set completions
(sessionId, topic, cardCount, completedAt).
Sidebar surfaces flashcard review history alongside MCQ scores.

**Why it matters:** Score history currently only covers MCQs.
Small schema change, doubles the coverage of the persistence layer.
Good data-modelling story: *I designed for both assessment modes.*

**Files touched:** `score-history.ts`, Supabase migration, sidebar UI (coordinate with Sritam)

---

## 4. Topic Coverage Map `[MEDIUM]`

**What:** Derive from `score-history` which topics have been attempted and how recently.
Surface a "topics attempted / not yet attempted" summary in the sidebar.

**Why it matters:** Personalisation from data.
Student sees their own gaps; agent can suggest what to study next.
Strong product + LLMOps narrative: data drives the UX.

**Files touched:** `score-history.ts`, sidebar UI (coordinate with Sritam)

---

## 5. Mermaid Diagram Rendering `[MEDIUM]`

**What:** `createMermaidDiagram` tool already exists and the agent calls it.
Wire the UI component to render the output.

**Why it matters:** High demo-ability — visible feature in the chat.
Requires coordination with Sritam for the widget component.
Low effort once unblocked.

**Files touched:** `tools.ts` (already done), widget component (Sritam's side)

---

## 6. Token / Cost Logging per Assessment `[LOW]`

**What:** Append `inputTokens`, `outputTokens`, `costUsd` to each entry in
`logs/testing-performance/`.

**Why it matters:** Observability discipline — *I know what each assessment costs.*
Extends existing `performance-log.ts` with one extra field.
Useful supporting evidence in the report even if not visible in the UI.

**Files touched:** `performance-log.ts`, `index.ts` (pass usage from stream result)
