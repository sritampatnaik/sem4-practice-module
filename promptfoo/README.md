# Promptfoo in METS

Promptfoo is set up here as a **second evaluation interface** over the existing METS eval system.

It does **not** replace:

- the existing TypeScript eval catalog in `src/evals/catalog/`
- the in-app eval desk at `/evals`
- the current CLI runner `npm run evals`
- the optional Langfuse sync path in `langfuse/evals/`

Instead, Promptfoo reuses the current METS eval items and scoring flow so the project can also benefit from Promptfoo's:

- local eval runner
- filtering by suite metadata
- HTML / JSON / CSV / JUnit outputs
- Promptfoo web viewer
- future CI-friendly reporting path

Sharing is disabled in the checked-in config, so local runs stay local unless someone explicitly overrides that behaviour.

## How the integration works

1. `npm run promptfoo:prepare`
   - reads the current live METS eval catalog
   - writes `promptfoo/tests.generated.json`

2. `promptfooconfig.yaml`
   - loads those generated tests
   - uses a custom `exec:` provider that runs `node --import tsx promptfoo/run-eval.ts`

3. `promptfoo/run-eval.ts`
   - looks up the current eval item by `itemId`
   - reuses the existing METS eval runtime in `src/evals/runner.ts`
   - outputs the structured `EvalItemResult` as JSON
   - loads `.env.local` / `.env` first so the existing evaluator keys are available during Promptfoo runs

4. `promptfoo/assertions/eval-result.cjs`
   - parses that JSON result
   - converts the existing METS pass/fail + checks into Promptfoo assertion results

This means Promptfoo is reporting on the same project-defined contracts instead of inventing a disconnected second scoring system.

## Commands

Run all suites:

```bash
npm run promptfoo:eval
```

Validate config only:

```bash
npm run promptfoo:validate
```

Open the Promptfoo viewer:

```bash
npm run promptfoo:view
```

Run a single suite:

```bash
npm run promptfoo:prepare
npx promptfoo eval -c promptfooconfig.yaml --filter-metadata suiteId=testing
```

Replace `testing` with one of:

- `routing`
- `concierge`
- `math`
- `physics`
- `chemistry`
- `testing`

## Environment notes

- Promptfoo itself does not replace the provider keys required by the existing METS eval runtime.
- In normal local use, you still need the same model keys the project evals already need, such as `OPENAI_API_KEY`.
- The checked-in Promptfoo helper scripts now load `.env.local` and `.env` automatically before running the METS eval runtime.
- Your Promptfoo CLI login is useful for Promptfoo cloud/sharing workflows, but local evals here are primarily driven by the checked-in config plus the repo's own runtime.

## Future CI path

Promptfoo is now wired into the existing GitHub Actions quality-gate workflow.

The workflow runs:

```bash
npm ci
npm run promptfoo:validate
npm run promptfoo:ci
```

and exports machine-readable artifacts:

- `promptfoo/promptfoo-results.json`
- `promptfoo/promptfoo-results.junit.xml`

### Required GitHub Actions secret

Set this repository or organisation secret before expecting Promptfoo CI to pass:

```text
OPENAI_API_KEY
```

Without it, the wrapped METS eval runtime cannot run the active LLM judges.

### Current CI behaviour

- Promptfoo runs inside the existing `.github/workflows/build.yml` quality-gate workflow
- it runs on the same PR/push triggers as the other checks job
- results are uploaded as workflow artifacts for inspection
