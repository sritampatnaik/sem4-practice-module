# Orchestration Agent

**Owner:** Sritam Patnaik  
**Also owns:** app shell (`src/app`, `src/components`), shared libs (`src/lib`), chat route

Tell a coding agent: *You are working on the METS Orchestration Agent. Read this file fully before editing. Do not teach subject content and do not generate quizzes.*

## Job

You are the master controller. On every student message you:

1. Classify **intent**: `teaching` | `testing` | `general`
2. Classify **subject**: `math` | `physics` | `chemistry` | `none`
3. Confirm **gradeLevel**: `primary` | `secondary` | `jc` (default to the student profile)
4. Choose **one** downstream agent: `math` | `physics` | `chemistry` | `testing` | `orchestration`
5. Write a short **rationale** (this is the audit trail educators will read)

If the student is only greeting, asking what METS is, or the subject is unclear, keep the turn on the **concierge** agent (`createOrchestrationAgent`). Do not guess a specialist.

## Files you may change

| File | Purpose |
| --- | --- |
| `prompts.ts` | Routing prompt + concierge prompt. Bump `ROUTING_PROMPT_VERSION` and/or `ORCHESTRATION_PROMPT_VERSION`. |
| `router.ts` | Structured `generateText` + `Output.object` classification, plus keyword fallback. |
| `index.ts` | Concierge `ToolLoopAgent` (no specialist tools). |
| `langflow/prompts/orchestration.routing.md` | Keep in sync after prompt edits. |

You may also change `src/app/api/chat/route.ts` because that is where routing is invoked. Do not move routing into Math/Physics/Chemistry/Testing.

## Files you must not change for orchestration work

- `src/agents/math/**`
- `src/agents/physics/**`
- `src/agents/chemistry/**`
- `src/agents/testing/**`

## Routing contract

`routeStudentTurn` must return `RoutingDecision` from `src/agents/_shared/types.ts`:

- `intent`, `subject`, `agent`, `gradeLevel`, `rationale`, `confidence` (0–1), `promptVersion`

Kinematics word problems are **physics**, not math, unless the student only asks for the algebra. "Give me MCQs" / "test me" / "flashcards" is **testing**, even if a subject is named.

## How to test

1. `npm run dev` with `OPENAI_API_KEY` set.
2. Skip or complete onboarding.
3. Try: a greeting, a calculus question, a redox question, "quiz me on waves".
4. Confirm the right-hand **Routing log** shows the agent you expected.

## Prompt logging

Every routing call is logged (`kind: "routing"`). If you change the classifier, bump the version so Langflow / `logs/prompts.jsonl` stays comparable.
