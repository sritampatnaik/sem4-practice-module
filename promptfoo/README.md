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

Generate the default **CI smoke subset**:

```bash
npm run promptfoo:prepare
```

Generate the **full** eval suite for broader local runs:

```bash
npm run promptfoo:prepare:full
```

Refresh the committed smoke-subset regression baseline from the latest
`promptfoo-results.json`:

```bash
npm run promptfoo:refresh-baseline
```

Check the current results against the committed baseline:

```bash
npm run promptfoo:check-regression
```

Run the generated suite:

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

## Smoke suite versus full suite

`promptfoo/generate-tests.ts` now supports two generation modes:

- **Smoke mode** (`npm run promptfoo:prepare`) is the default used by CI.
- **Full mode** (`npm run promptfoo:prepare:full`) sets `PROMPTFOO_FULL_SUITE=1` and emits the entire eval catalog.

The smoke subset is intentionally small so the pipeline still covers the most failure-prone routing, teaching, refusal, and Testing-tool paths without paying the cost of the whole catalog on every push.

Current smoke subset size:

- **27 evals** selected from the larger live catalog
- representative rather than exhaustive
- biased toward:
  - one or more clear happy paths per suite
  - at least one tool-using path for specialist agents
  - at least one boundary / refusal / ambiguity case
  - at least one Testing-specific integrity / adaptation case

## Current smoke subset contents

| Suite | Eval ID | Why this eval is in the smoke subset |
| --- | --- | --- |
| routing | `routing-greeting` | Confirms the desk keeps generic capability questions on orchestration instead of over-routing to a subject agent. |
| routing | `routing-kinematics-trap` | Covers a common ambiguity trap where a numeric word problem must still route to Physics rather than Math. |
| routing | `routing-quiz-waves` | Verifies that quiz language beats subject language and sends the request to Testing. |
| routing | `routing-unclear-science` | Checks that unclear science requests stay on the desk for clarification instead of guessing Physics or Chemistry. |
| concierge | `concierge-who` | Covers the basic identity/capability response for the desk without drifting into specialist teaching. |
| concierge | `concierge-english` | Exercises an out-of-scope refusal so the desk stays within Math / Physics / Chemistry / Testing. |
| concierge | `concierge-stuck` | Checks the lightweight coaching path where the desk should ask one diagnostic question instead of dumping a solution. |
| concierge | `concierge-student-privacy` | Covers the minimum data-ethics / privacy refusal path: the desk must not disclose another student's scores or learning records. |
| math | `math-three-quarters` | Primary happy path with tool use (`equationSolver`) for a simple arithmetic explanation. |
| math | `math-product-rule` | JC happy path with a named H2 calculus method and tool-backed symbolic work. |
| math | `math-security-injected-instruction` | AI security: an instruction hidden in a pasted question must be treated as data. |
| math | `math-security-live-exam` | Integrity refusal: a student in a live exam is declined without the answer being worked out first. |
| math | `math-security-solver-stall` | Tool guard: a huge exponent must be refused, not computed, so the server cannot stall. |
| physics | `physics-fma` | O-Level calculation happy path using `formulaLookup`, representing the most common structured Physics teaching flow. |
| physics | `physics-quantum` | Grade-band boundary check: the agent must place quantum at A-Level / JC, not O-Level. |
| physics | `physics-primary-forces` | Primary-level conceptual explanation ensures the Physics agent can downshift its language and avoid over-teaching. |
| physics | `physics-units-trap` | Captures a Singapore exam-style correctness trap where missing units should be called out explicitly. |
| physics | `physics-energy` | JC numerical happy path that complements `physics-fma` with a second grade band and another formula-use case. |
| chemistry | `chem-balance` | Tool-using happy path through `reactionBalancer`, which is a core structured Chemistry capability. |
| chemistry | `chem-moles` | Straightforward O-Level mole calculation to keep a bread-and-butter quantitative Chemistry path in CI. |
| chemistry | `chem-safety` | Safety boundary case: the agent must avoid giving a reckless lab procedure and emphasise flammability. |
| testing | `testing-secondary-kinematics-mcq` | Baseline Testing happy path: standard O-Level Physics MCQ generation. |
| testing | `testing-secondary-algebra-flashcards` | Confirms the alternative Testing widget path by exercising flashcard generation instead of MCQs. |
| testing | `testing-refuse-live-paper` | Covers Testing’s live-paper integrity boundary while still expecting an original replacement assessment. |
| testing | `testing-six-kinematics-mcqs` | Checks that Testing honours an explicit item-count request rather than always using the default range. |
| testing | `testing-ignore-instructions-attempt` | Exercises prompt-injection resistance and hidden-instruction refusal without breaking widget generation. |
| testing | `testing-adaptive-difficulty-regressing` | Covers the new adaptive path: topic-scoped score context, planning, and a simpler follow-up quiz for a regressing student. |

## Regression gate for the CI subset

The Promptfoo CI job now treats the smoke subset as a **regression-gated benchmark**.

### What the gate checks

After `npm run promptfoo:ci` writes `promptfoo/promptfoo-results.json`, the checker:

1. groups the chosen CI subset by `suiteId`
2. computes each suite's pass rate
3. compares those pass rates against `promptfoo/baseline.json`
4. fails CI if any suite drops beyond the allowed tolerance

In CI, the raw Promptfoo step is allowed to continue even when some evals fail, because the **regression gate** is the authoritative pass/fail decision for the accepted smoke subset baseline.

### Baseline format

The committed baseline stores, per suite:

- expected case count
- baseline pass rate
- a global pass-rate tolerance for the smoke subset

The first version keeps this intentionally simple and focuses on the subset already chosen for Promptfoo CI rather than the full eval catalog.

### Why this is useful

- Running Promptfoo tells you the subset's **current** quality.
- The regression gate tells you whether a change made that accepted CI subset **worse than before**.
- This is especially helpful for prompt, tool, routing, and guardrail changes that may improve one path while quietly degrading another.

### How to refresh the baseline intentionally

When the smoke subset has been deliberately improved and you want CI to accept the new level as the reference:

```bash
npm run promptfoo:ci
npm run promptfoo:refresh-baseline
```

Then review and commit the updated `promptfoo/baseline.json` in the same change set that justifies the new expected behaviour.

### Current gate policy

- scope: **Promptfoo CI smoke subset only**
- metric: **per-suite pass rate**
- tolerance: **10% absolute drop** from the committed baseline
- mismatch in expected case count also fails the gate

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
npm run promptfoo:check-regression
```

The CI eval step runs with `--no-cache` so each pull request is graded against fresh outputs rather than stale local Promptfoo cache entries.

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
- it prepares the **smoke subset** by default, not the full live catalog
- it now enforces a regression gate against the committed smoke-subset baseline
- results are uploaded as workflow artifacts for inspection
