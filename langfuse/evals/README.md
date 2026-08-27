# METS evals

Source of truth is the TypeScript catalog in `src/evals/catalog/` — ten gold-scaffolded items per suite (router, concierge, Math, Physics, Chemistry, Testing). Each item has a student prompt, a sample gold reply, and checks (routing fields, required tools, must / must-not phrases).

The live desk runs those items and scores **accuracy** against the gold scaffold, plus **latency** and **estimated USD cost** from token usage.

## Run from the app

1. `npm run dev`
2. Open [/evals](http://localhost:3000/evals)
3. Run one suite or all 60 items
4. Expand a row to compare gold scaffold vs live output

The page keeps the last five runs in `localStorage` so you can compare accuracy / latency / cost after you change a prompt or model.

## Run from the CLI

```bash
npm run evals
npm run evals -- --suite=routing
```

`OPENAI_API_KEY` is required. Optional `OPENAI_MODEL` (default `gpt-4o`).

## Sync to Langfuse

Optional. The frontend does not need Langfuse.

```bash
npm run langfuse:seed-evals
```

That upserts `mets-routing`, `mets-concierge`, `mets-math`, `mets-physics`, `mets-chemistry`, and `mets-testing` from the catalog and deletes stale items.

Keys live in `.env.local` (`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` or `LANGFUSE_BASE_URL`). Do not put seed or eval commands in a Cloud Agent `install` script.
