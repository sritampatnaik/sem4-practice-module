<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# METS (read this before changing anything)

METS is a **hierarchical multi-agent tutor** for Singapore Primary, O-Level, and A-Level Mathematics, Physics, and Chemistry. Five people own five agents. If someone asks you to explain the project, start here, then open the README in the relevant agent folder.

## What happens on one student turn

1. The UI (`src/app/page.tsx` → `StudioShell`) POSTs messages, `profile`, and `sessionId` to `/api/chat`.
2. `src/app/api/chat/route.ts` sanitizes the text and loads the last 10 chats.
3. **Orchestration** (`src/agents/orchestration/router.ts`) classifies intent, subject, grade band, and target agent.
4. `createAgent(routing.agent, ctx)` builds **one** specialist `ToolLoopAgent`.
5. That agent streams the reply. Testing tools render as quiz / flashcard widgets.
6. The turn is logged to `logs/prompts.jsonl`, the audit rail, and optionally Langflow.

Specialists never call each other. Only the chat route picks the agent.

## Five agents (open the matching README)

| Owner | Agent | Instructions |
| --- | --- | --- |
| Sritam Patnaik | Orchestration | `src/agents/orchestration/README.md` |
| Gu Haixiang | Math | `src/agents/math/README.md` |
| Chua Hieng Weih | Physics | `src/agents/physics/README.md` |
| Lizabeth Annabel Tukiman | Chemistry | `src/agents/chemistry/README.md` |
| Muhammad Harun Bin Abdul Rashid | Testing | `src/agents/testing/README.md` |

Also read `TEAM.md` and `docs/HOW-IT-WORKS.md`.

## Hard rules for any coding agent

- Stay inside the folder of the agent you were asked to change.
- Do not import Math from Physics, Testing from Chemistry, etc.
- Do not add a database. Profiles and memory are in-memory / localStorage until the team wires Supabase.
- RAG corpus is **syllabus maps** in `data/syllabus/`, not encyclopedic subject notes.
- When you edit a system prompt, bump `*_PROMPT_VERSION` in that agent's `prompts.ts` and copy the gist into `langflow/prompts/`.
- Use Vercel AI SDK: `ToolLoopAgent`, `tool({ inputSchema })`, `stepCountIs`. Do not use the raw OpenAI SDK.
- Keep Singapore English spelling and grade-band limits in prompts.
