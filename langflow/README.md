# Langflow prompt logging

METS keeps **TypeScript prompts as the source of truth** in `src/agents/*/prompts.ts`. Langflow is the optional LLMOps console for prompt traces.

## What is already wired

Every routing decision and specialist generation is:

1. Appended to `logs/prompts.jsonl`
2. Shown in the right-hand **Routing log** rail
3. POSTed to Langflow `POST /api/v1/run/{LANGFLOW_LOGGER_FLOW_ID}` when env vars are set

## Run Langflow locally

```bash
docker compose -f langflow/docker-compose.yml up
```

Open http://localhost:7860

## Create the logger flow (once)

1. New flow named `METS Prompt Logger`
2. Chat Input → Prompt Template → OpenAI → Chat Output
3. Prompt Template text:

```
You are a prompt-log summariser for METS.
Summarise this agent turn in 4 bullets: agent, intent, tools likely used, any syllabus risk.
Log payload:
{input}
```

4. Copy the flow ID from the URL into `.env.local` as `LANGFLOW_LOGGER_FLOW_ID`
5. Create a Langflow API key and set `LANGFLOW_API_KEY`
6. Set `LANGFLOW_URL=http://localhost:7860`

## Per-agent prompt versions

Import the markdown files in `langflow/prompts/` into Prompt components if a teammate wants to iterate visually. After they settle a prompt, copy it back into the matching `src/agents/<agent>/prompts.ts` file and bump `*_PROMPT_VERSION`.
