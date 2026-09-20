# Guardrail Agent

**Folder:** `src/agents/guardrail/`  
**Student-facing:** no. Never route a student here.

Tell a coding agent: *You are working on the METS Guardrail Agent. It is a silent safety monitor. The student must never see it, hear it, or be routed to it. Do not import other specialists. Do not teach subject content.*

## Job

The chat route starts `monitorStudentTurn` as soon as the student message is stored, then awaits it after the specialist reply. Keyword hits persist immediately so a staff alert exists even if the LLM classifier is slow or misses.

This agent classifies the student turn for:

- **disappointment** (failure talk, giving up on everything — not ordinary "this sum is hard")
- **self-harm** (including "I want to give up on life" and similar hopelessness about living)
- **distress** (panic, breakdown, acute crisis)

On a hit it stores an alert (student, snippet, reason, time) in the existing Supabase project and notifies a parent or tutor: in-app on `/admin`, and email when `parent_email`, `METS_PARENT_NOTIFY_EMAIL`, or `METS_ADMIN_EMAILS` is set and Resend is configured.

Escalate. Do not give harmful instructions, methods, or a student-facing reply.

## Files you may change

| File | Purpose |
| --- | --- |
| `prompts.ts` | Classifier prompt. Bump `GUARDRAIL_PROMPT_VERSION` on every edit. |
| `classify.ts` | Structured `generateText` + keyword fallback. |
| `index.ts` | `monitorStudentTurn` — the only entry the chat route should call. |
| `store.ts` | `guardrail_alerts` in Supabase (service role). In-memory fallback if the secret key is unset. |
| `notify.ts` | Optional Resend email. |
| `access.ts` | `/admin` gate (`app_metadata.role === "admin"` only). |
| `langflow/prompts/guardrail.system.md` | Keep in sync after prompt edits. |

You may also hook `src/app/api/chat/route.ts` (after the specialist reply) and the staff page under `src/app/admin/`. Do not add Guardrail to `createAgent` or `AGENT_IDS`.

## Files you must not change

- `src/agents/math/**`, `physics/**`, `chemistry/**`, `testing/**`, `orchestration/router.ts`
- Student desk widgets (`PromptBar`, quiz cards, flashcards)
- Do not add a second database

## Routing contract

Orchestration must never choose `guardrail`. Students stay on Math, Physics, Chemistry, Testing, or the concierge. The chat route starts the monitor after the student turn is stored, awaits it in `onFinish`, and swallows errors so the student stream cannot fail because of it. Escalate only — never methods or a student-facing safety reply.

## Admin page

`/admin` is admin-only. It is not linked from the student desk. Gate on Supabase Auth `app_metadata.role === "admin"` (never `user_metadata`). Anyone else, including signed-in students, gets a 404. `METS_ADMIN_EMAILS` is only for optional alert email, not access.

## How to test

1. Keyword tests: `npx tsx --test src/agents/guardrail/*.test.ts`
2. Open `/` as a guest. Confirm there is no Admin nav.
3. Open `/admin` as a guest or a student. You should get a 404.
4. Sign in as the admin Auth user (`app_metadata.role = admin`) and open `/admin`. Alerts should render after a flagged chat turn.
