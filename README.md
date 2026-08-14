# METS

Multi-Agent Educational & Testing System for the NUS-ISS Practice Module (Team 5). A Singapore-aligned tutor that routes each student question to one of five agents: Orchestration, Math, Physics, Chemistry, or Testing.

## Run it

```bash
cp .env.example .env.local
# paste OPENAI_API_KEY into .env.local
npm install
npm run dev
```

Open http://localhost:3000. You can skip onboarding, or fill name, grade band, and three diagnostics, then ask to learn or to be tested.

## How the desk works

See [docs/HOW-IT-WORKS.md](./docs/HOW-IT-WORKS.md) for the full walkthrough. Short version:

1. Student message lands on `/api/chat`.
2. Orchestration classifies intent, subject, and grade band.
3. The matching specialist streams a reply, using its own tools.
4. Routing and prompts are logged to `logs/prompts.jsonl`, the UI audit rail, and optionally Langflow.

Database and pgvector are intentionally not wired yet. Syllabus RAG is keyword search over `data/syllabus/*.md`.

## Team folders

Each person has a dedicated instruction file. Open yours before editing, and point a coding agent at it:

| Person | Agent | Instructions |
| --- | --- | --- |
| Sritam Patnaik | Orchestration + UI | [src/agents/orchestration/README.md](./src/agents/orchestration/README.md) |
| Gu Haixiang | Math | [src/agents/math/README.md](./src/agents/math/README.md) |
| Chua Hieng Weih | Physics | [src/agents/physics/README.md](./src/agents/physics/README.md) |
| Lizabeth Annabel Tukiman | Chemistry | [src/agents/chemistry/README.md](./src/agents/chemistry/README.md) |
| Muhammad Harun Bin Abdul Rashid | Testing | [src/agents/testing/README.md](./src/agents/testing/README.md) |

Also see [TEAM.md](./TEAM.md) and [AGENTS.md](./AGENTS.md) (what Cursor/other agents read).

## Langflow

Optional prompt-log console. See [langflow/README.md](./langflow/README.md).

```bash
docker compose -f langflow/docker-compose.yml up
```

## Stack

- Next.js App Router + TypeScript
- Vercel AI SDK (`ToolLoopAgent`, `useChat`)
- OpenAI (model configurable via `OPENAI_MODEL`, default `gpt-4o`)
- Local syllabus markdown as a RAG stand-in
- Langflow for prompt traces when configured
