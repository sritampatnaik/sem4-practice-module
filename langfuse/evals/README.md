# METS Langfuse eval skeleton

Offline evaluation structure for the five METS agents. This folder is the source of truth; `seed.mjs` upserts it into the Langfuse project.

METS chat is **not** traced to Langfuse yet. These datasets are for later experiments. Do not attach online evaluation rules until traces exist.

## What we evaluate

Each turn should use **exactly one** agent, and that agent should follow its contract.

| Dataset | Agent | What “good” means |
| --- | --- | --- |
| `mets-orchestration-routing` | Router | `{agent, intent, subject}` matches the gold label (kinematics is physics, not math) |
| `mets-orchestration-concierge` | Concierge | Greet or clarify; do not teach or write a quiz |
| `mets-math-teaching` | Math | Working + `equationSolver`; syllabus search before coverage claims |
| `mets-physics-teaching` | Physics | Principle → formula → SI units |
| `mets-chemistry-teaching` | Chemistry | `periodicTable` / `reactionBalancer` before quoting data |
| `mets-testing-assessment` | Testing | Exactly one of `createMcqSet` / `createFlashcards`; original items |

Shared score configs: `mets-routing-correct`, `mets-grade-band-ok`, `mets-syllabus-grounded`, `mets-teaching-quality` (1–5), `mets-widget-valid`.

Example judges (no online rules):

- `mets-judge-routing` — boolean routing match
- `mets-judge-singapore-tutor` — 1–5 teaching quality, including grade band
- `mets-judge-testing-widget` — boolean widget validity

This is a skeleton: a few README / Testing-fixture examples, not the full suite.

## Seed Langfuse

Keys live in `.env.local` (never commit them). The CLI expects `LANGFUSE_HOST`; METS also accepts `LANGFUSE_BASE_URL`.

```bash
# .env.local
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://us.cloud.langfuse.com
```

```bash
node langfuse/evals/seed.mjs
```

Score configs and evaluators are created only if the name is missing. Dataset items upsert on stable ids (`mets-item-*`).

Evaluator prompts use `{{input}}`, `{{output}}`, and `{{expected_output}}`. Default create-time mappings only allow observation fields (`input` / `output` / `metadata` / `tool_calls`). When you run an experiment, map `expected_output` to the dataset item expected output in the Langfuse UI.

## Run the evaluators

This runs the real METS router and specialists on each seeded item, then the three judge prompts from `seed.json` (plus a concierge check). Scores are written onto Langfuse dataset runs. Hosted Langfuse LLM-as-judge rules are not required; the same prompts run locally via `OPENAI_API_KEY`.

```bash
# .env.local also needs OPENAI_API_KEY (same key the chat desk uses)
npx tsx --tsconfig tsconfig.json langfuse/evals/run-experiment.ts
# or: npm run langfuse:run-evals
```

Do not put this command in a Cloud Agent `install` script. Seed and experiments are one-off; install should stay `npm ci`.
