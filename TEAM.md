# METS team ownership

Five people, five agents. Give a coding agent the README in **your** folder. Stay in that folder unless you are changing a shared contract.

| Person | Agent | Instructions |
| --- | --- | --- |
| Sritam Patnaik | Orchestration (master controller) + app shell | [src/agents/orchestration/README.md](./src/agents/orchestration/README.md) |
| Gu Haixiang | Math Agent | [src/agents/math/README.md](./src/agents/math/README.md) |
| Chua Hieng Weih | Physics Agent | [src/agents/physics/README.md](./src/agents/physics/README.md) |
| Lizabeth Annabel Tukiman | Chemistry Agent | [src/agents/chemistry/README.md](./src/agents/chemistry/README.md) |
| Muhammad Harun Bin Abdul Rashid | Testing Agent | [src/agents/testing/README.md](./src/agents/testing/README.md) |

System overview for anyone explaining the project: [docs/HOW-IT-WORKS.md](./docs/HOW-IT-WORKS.md) and [AGENTS.md](./AGENTS.md).

## Shared contracts (ask before changing)

- `src/agents/_shared/types.ts`
- `src/agents/index.ts`
- `src/app/api/chat/route.ts`

A specialist agent must not import another specialist. Only orchestration / the chat route may choose which agent to run.

## Prompt versioning

Each agent exports `*_PROMPT_VERSION`. Bump it when you edit `prompts.ts` so Langflow logs stay comparable. Copy the gist into `langflow/prompts/`.

## Later (not in this slice)

Supabase for student profiles, and pgvector for syllabus embeddings. RAG currently reads markdown in `data/syllabus/`.
