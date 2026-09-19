# How METS works

Use this file when a teammate or another coding agent asks what the system is doing. Implementation details for one specialist live in that agent's README under `src/agents/<name>/README.md`.

## Product

METS (Multi-Agent Educational & Testing System) is Team 5's NUS-ISS Practice Module project. A student signs in, creates an account, or continues as a guest, optionally fills name / year / diagnostics (all skippable), then chats. The desk is a **tutor**, not a search engine: it should teach or test inside the Singapore MOE bands (Primary, Secondary O-Level, JC A-Level).

## Hierarchy

```
Student UI
    → POST /api/chat
        → Orchestration router (classify only)
            → Math | Physics | Chemistry   if intent is teaching
            → Testing                      if intent is quiz / flashcards
            → Orchestration concierge      if greeting / unclear / meta
        → Guardrail monitor (silent; never answers the student)
            → parent/tutor alert on /admin (+ email if configured)
```

This is **central routing + local specialist tools**, matching the proposal. It is not a swarm of peers debating. One agent answers each turn. Guardrail is not a routing target.

## Runtime pieces

| Piece | Path | Role |
| --- | --- | --- |
| Chat API | `src/app/api/chat/route.ts` | Glue: sanitize, route, stream, log, then silent Guardrail |
| Auth API | `src/app/api/auth/route.ts` | Supabase email login, httpOnly session cookie |
| Conversations API | `src/app/api/conversations/route.ts` | List / create threads; messages under `[id]` |
| Student API | `src/app/api/student/route.ts` | Persist profile to `student_sessions` |
| Trace API | `src/app/api/traces/route.ts` | Audit rail payload |
| Agent factory | `src/agents/index.ts` | `createAgent(id, ctx)` — student-facing agents only |
| Guardrail | `src/agents/guardrail/` | Silent harm/disappointment monitor; staff page `/admin` |
| Shared types | `src/agents/_shared/types.ts` | Profile, routing, quiz shapes |
| Shared syllabus search | `src/lib/syllabus.ts` | Keyword RAG over markdown |
| Memory | `src/lib/memory.ts` | Last 10 chats per session (Supabase when configured) |
| LLM | `src/lib/llm.ts` | OpenAI via `@ai-sdk/openai`; Gemini via `@ai-sdk/google` on the eval Scores picker |
| Prompt logs | `src/lib/langflow.ts` | JSONL + optional Langflow POST |
| UI | `src/components/` | Onboarding, chat, quiz, flashcards |

## Student context passed into every specialist

`AgentRuntimeContext` always includes:

- `sessionId` (the conversation id, not the Auth user id)
- `profile` (name, `gradeLevel`, optional diagnostic mastery, notes)
- `recentChats` (up to 10 from this conversation)
- `retrievedContext` (optional pgvector hits from the student's earlier chats)

`src/agents/_shared/context.ts` turns that into a prompt block so specialists can personalise without seeing other agents' code.

## Prompts and LLMOps

- Live prompts: `src/agents/<agent>/prompts.ts`
- Langflow copies: `langflow/prompts/`
- Version strings: `MATH_PROMPT_VERSION`, etc. Bump on every prompt edit.
- Traces: `logs/prompts.jsonl` and the right-hand Routing log in the UI
- Eval catalog: `src/evals/catalog/` (ten items per suite, gold scaffolds). Desk UI: `/evals/datasets` (JSON editor), `/evals/evaluators` (code or LLM-as-judge), `/evals/scores` (previous runs). CLI: `npm run evals`. Optional Langfuse sync: `npm run langfuse:seed-evals`.

## Persistence

Login is Supabase Auth (email and password). Create-account uses public `signUp` (publishable or anon key) plus an auto-confirm trigger — not Auth Admin. There is also a guest path that does not persist. Profiles (`student_sessions`), conversations, full chat history (`chat_memory`), same-project pgvector chunks (`chat_chunks`), eval history, and Guardrail alerts (`guardrail_alerts`) persist when `SUPABASE_URL` is set with a service role / secret key, or with the publishable/anon key plus the signed-in user's JWT. Guardrail rows are service-role only so students cannot read them. Access stays server-only. Never prefix secrets with `NEXT_PUBLIC_`.

Staff open `/admin` (not linked from the student desk) with `METS_ADMIN_EMAILS` or Auth `app_metadata.role`. Email uses `METS_PARENT_NOTIFY_EMAIL`, optional `student_sessions.parent_email`, and Resend when configured.

Syllabus search is still local markdown. Chat retrieval is separate: chunk + `text-embedding-3-small` into `chat_chunks`, then `match_chat_chunks`.

## What is still later

- Web search is a Wikipedia stub.
- The browser still caches the student profile in localStorage.

When those land, keep the five-folder agent split. Do not collapse specialists into one file.
