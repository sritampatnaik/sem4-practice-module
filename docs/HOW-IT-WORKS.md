# How METS works

Use this file when a teammate or another coding agent asks what the system is doing. Implementation details for one specialist live in that agent's README under `src/agents/<name>/README.md`.

## Product

METS (Multi-Agent Educational & Testing System) is Team 5's NUS-ISS Practice Module project. A student opens a foolscap-style desk, optionally fills name / grade / diagnostics (all skippable), then chats. The desk is a **tutor**, not a search engine: it should teach or test inside the Singapore MOE bands (Primary, Secondary O-Level, JC A-Level).

## Hierarchy

```
Student UI
    → POST /api/chat
        → Orchestration router (classify only)
            → Math | Physics | Chemistry   if intent is teaching
            → Testing                      if intent is quiz / flashcards
            → Orchestration concierge      if greeting / unclear / meta
```

This is **central routing + local specialist tools**, matching the proposal. It is not a swarm of peers debating. One agent answers each turn.

## Runtime pieces

| Piece | Path | Role |
| --- | --- | --- |
| Chat API | `src/app/api/chat/route.ts` | Glue: sanitize, route, stream, log |
| Trace API | `src/app/api/traces/route.ts` | Audit rail payload |
| Agent factory | `src/agents/index.ts` | `createAgent(id, ctx)` |
| Shared types | `src/agents/_shared/types.ts` | Profile, routing, quiz shapes |
| Shared syllabus search | `src/lib/syllabus.ts` | Keyword RAG over markdown |
| Memory | `src/lib/memory.ts` | Last 10 chats per session |
| LLM | `src/lib/llm.ts` | OpenAI via `@ai-sdk/openai` |
| Prompt logs | `src/lib/langflow.ts` | JSONL + optional Langflow POST |
| UI | `src/components/` | Onboarding, chat, quiz, flashcards |

## Student context passed into every specialist

`AgentRuntimeContext` always includes:

- `sessionId`
- `profile` (name, `gradeLevel`, optional diagnostic mastery, notes)
- `recentChats` (up to 10)

`src/agents/_shared/context.ts` turns that into a prompt block so specialists can personalise without seeing other agents' code.

## Prompts and LLMOps

- Live prompts: `src/agents/<agent>/prompts.ts`
- Langflow copies: `langflow/prompts/`
- Version strings: `MATH_PROMPT_VERSION`, etc. Bump on every prompt edit.
- Traces: `logs/prompts.jsonl` and the right-hand Routing log in the UI
- Langfuse eval skeleton (datasets + example judges, not live tracing): `langfuse/evals/`. Seed with `npm run langfuse:seed-evals`. Run the judges against real agents with `npm run langfuse:run-evals`.

## What is deliberately unfinished

- No Supabase. No pgvector. Syllabus search is local markdown.
- Web search is a Wikipedia stub.
- Auth is localStorage, not login.

When those land, keep the five-folder agent split. Do not collapse specialists into one file.
