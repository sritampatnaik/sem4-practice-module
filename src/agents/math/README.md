# Math Agent

**Owner:** Gu Haixiang  
**Folder:** `src/agents/math/`  
**Syllabus corpus:** `data/syllabus/math.md`

**Design and assessment plan:** [DESIGN.md](./DESIGN.md) — proposed user offering, teaching playbook, engineering requirements, team alignment, and evaluation criteria.
**Build plan:** [BUILD-PLAN.md](./BUILD-PLAN.md) — concrete, file-level tasks moving the design from prototype to integration, with acceptance checks and status.

Tell a coding agent: *You are working on the METS Math Agent only. Read this file fully. Do not edit other specialist folders. Do not build quizzes here.*

## Job

Teach Singapore mathematics at the student's band:

- Primary (including P6 model drawing / heuristics)
- Secondary O-Level Mathematics and Additional Mathematics
- JC H1/H2 Mathematics

You explain, show working, and verify numbers. If the student wants a quiz, tell them to ask for a test so Orchestration can send them to Testing. You may still help if they paste a question.

## Files you may change

| File | Purpose |
| --- | --- |
| `prompts.ts` | System prompt. Bump `MATH_PROMPT_VERSION` on every edit. |
| `index.ts` | `createMathAgent` wiring: tools, guardrails, output cap. |
| `first-step.ts` | Which tool the first step must use when the question makes it obvious. |
| `tools.ts` | `equationSolver` and `drawMathGraph` (mathjs). |
| `exam-facts.ts` | `examFacts`: checked SEAB exam-format facts, each with its source and check date. |
| `guardrails.ts` | Output repair: abuse, prompt disclosure, self-drawn images, LaTeX delimiters, cut-off replies. |
| `graph-types.ts`, `math-graph-widget.tsx` | Client rendering of `drawMathGraph` output (JSXGraph). |
| `runs/` | Eval run records and the gold-answer review. |
| `src/evals/catalog/math.ts` | Math eval cases. |
| `langflow/prompts/math.system.md` | Summary of `prompts.ts`; its version must match (tested). |

## Tools you must keep

- `equationSolver` checks arithmetic and algebra before a final answer. It solves linear, quadratic and cubic equations in one unknown and differentiates. It cannot integrate symbolically, keep surds exact, or solve simultaneous or trigonometric equations: do those by hand and say so. An integral is checked by differentiating the answer.
- `drawMathGraph` draws y = f(x). The widget gets the plotted points; the model gets only a summary, so it cannot copy the data into its reply.
- `examFacts` is the source for papers, timing, marks, calculator rules, weightings, supplied formulae and marking of working. Re-check the facts against SEAB when a new exam year is published, and update `EXAM_FACTS_CHECKED_ON`.
- `documentSearch` is shared, with subject `"math"`, and decides whether a topic is in a syllabus.
- `webSearch` is optional. Syllabus search and exam facts come first.

Add new tools in their own file or `tools.ts`, register them in `index.ts`, and add a first-step rule only when the trigger is unambiguous and tested with phrasings outside the eval set.

## Files you must not change

- Other agents under `src/agents/physics`, `chemistry`, `testing`, `orchestration`
- Quiz widgets (`src/components/quiz-widget.tsx`) unless Sritam asks; those belong to Testing + UI
- Database / Supabase code (not in this slice)

## Prompt rules

- Singapore English spelling.
- LaTeX for mathematics (`$...$` / `$$...$$`).
- Name the method (chain rule, sine rule, completing the square) before using it.
- Stay inside the band. Do not introduce university content unless the student asks.
- Quote syllabus coverage only from `documentSearch`, and exam rules only from `examFacts`.

## How to test

Ask the desk:

- "Differentiate x^2 sin x for H2."
- "What is 3/4 of 12? Show working."
- "Is Maclaurin series in O-Level?" (should check syllabus and say no)

- "Can I use a calculator in A-Math Paper 1?" (should use exam facts and say yes)
- "Sketch y = x^2 - 4x + 3" (graph with roots and turning point)

Confirm the message stamp says **Math** and that the expected tool appears as a tool line. Then run the Math suite on `/evals/scores` and compare with the latest record in `runs/`.
