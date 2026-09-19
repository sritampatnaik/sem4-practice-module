# Guardrail Agent

**Folder:** `src/agents/guardrail/`  
**Student-facing:** no. Never route a student here.

Tell a coding agent: *You are working on the METS Guardrail Agent. It is a silent safety monitor. The student must never see it, hear it, or be routed to it. Do not import other specialists. Do not teach subject content.*

## Job

After a specialist answers, the chat route calls `monitorStudentTurn`. This agent classifies the student turn for:

- **disappointment** (failure talk, giving up on everything — not ordinary "this sum is hard")
- **self-harm**
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
| `access.ts` | `/admin` gate (`METS_ADMIN_EMAILS` / `app_metadata.role`). |
| `langflow/prompts/guardrail.system.md` | Keep in sync after prompt edits. |

You may also hook `src/app/api/chat/route.ts` (after the specialist reply) and the staff page under `src/app/admin/`. Do not add Guardrail to `createAgent` or `AGENT_IDS`.

## Files you must not change

- `src/agents/math/**`, `physics/**`, `chemistry/**`, `testing/**`, `orchestration/router.ts`
- Student desk widgets (`PromptBar`, quiz cards, flashcards)
- Do not add a second database

## Routing contract

Orchestration must never choose `guardrail`. Students stay on Math, Physics, Chemistry, Testing, or the concierge. The chat route runs this monitor in `onFinish` and swallows errors so the student stream cannot fail because of it.

## Admin page

`/admin` is staff-only. It is not linked from the student desk. Gate with `METS_ADMIN_EMAILS` (comma-separated) and/or Supabase `app_metadata.role` in `admin`, `tutor`, `parent` (override with `METS_ADMIN_ROLES`). Local bypass: `METS_ADMIN_DEV=1` when `NODE_ENV` is not production.

## How to test

1. Keyword tests: `npx tsx --test src/agents/guardrail/*.test.ts`
2. Open `/` as a guest. Confirm there is no Admin nav.
3. Open `/admin` without staff credentials. You should get a 404.
4. With `METS_ADMIN_DEV=1 npm run dev`, open `/admin` and confirm alerts render after a flagged chat turn.
