# Math Agent

**Owner:** Gu Haixiang  
**Folder:** `src/agents/math/`  
**Syllabus corpus:** `data/syllabus/math.md`

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
| `tools.ts` | `equationSolver` (mathjs evaluate / simplify). |
| `index.ts` | `createMathAgent` wiring. |
| `data/syllabus/math.md` | Curriculum map for RAG (topics, not worked solutions). |
| `langflow/prompts/math.system.md` | Keep in sync with `prompts.ts`. |

## Tools you must keep

- `equationSolver` — verify arithmetic and simple algebra before a final answer
- `documentSearch` — from `../_shared/tools` with subject `"math"`
- `webSearch` — optional Wikipedia stub; syllabus search comes first

Add new math tools in `tools.ts` and register them on the `ToolLoopAgent` in `index.ts`. Use AI SDK `tool({ inputSchema: z.object(...) })`.

## Files you must not change

- Other agents under `src/agents/physics`, `chemistry`, `testing`, `orchestration`
- Quiz widgets (`src/components/quiz-widget.tsx`) unless Sritam asks; those belong to Testing + UI
- Database / Supabase code (not in this slice)

## Prompt rules

- Singapore English spelling.
- LaTeX for mathematics (`$...$` / `$$...$$`).
- Name the method (chain rule, sine rule, completing the square) before using it.
- Stay inside the band. Do not introduce university content unless the student asks.
- Quote syllabus coverage only from `documentSearch` results.

## How to test

Ask the desk:

- "Differentiate x^2 sin x for H2."
- "What is 3/4 of 12? Show working."
- "Is Maclaurin series in O-Level?" (should check syllabus and say no)

Confirm the message stamp says **Math** and that `equationSolver` / `documentSearch` appear as tool lines when relevant.
