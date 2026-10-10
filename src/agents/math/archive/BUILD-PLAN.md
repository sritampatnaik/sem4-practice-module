# Math agent build plan — prototype to integration

Owner: Gu Haixiang
Status: Draft, operational companion to [DESIGN.md](./DESIGN.md)
Date: 12 September 2026

> **29 September 2026:** parts of this document describe the September plan and are now out of date (tool list, prompt version, eval scaffolding). The current state is in [README.md](./README.md), and measured results are in [runs/](./runs/).

## Purpose and how to use this document

[DESIGN.md](./DESIGN.md) sets out what Math should offer and why, including a
seven-step delivery sequence. This document turns that sequence into file-level
tasks with acceptance checks, so progress is visible without re-deriving it from
prose each time. It follows a build-a-prototype-then-iterate approach rather than
finishing every design question before writing code: each phase below is scoped to
ship something runnable and reviewable, with open questions logged rather than
blocking.

Status values used below: **Not started**, **In progress**, **Done**, **Blocked**
(with the blocker named). Update the status cell when a task's state changes; don't
let this drift from what's actually in the branch.

**Sequence status, corrected after review on 12 September 2026.** An earlier version of
this paragraph implied Phases 0 and 0.6 had largely covered steps 1–3 of DESIGN.md's
delivery sequence. They have not. Those phases are *provisional exploratory code and
corpus work*. The agreed preparation sequence remains outstanding and takes priority:

1. Map all intended courses and cohorts (Primary Standard/Foundation, Secondary
   Mathematics/Additional Mathematics and the O-Level/SEC transition, H1 and H2 mapped
   separately) — **not started**.
2. Review the official references gathered so far, rather than treating a first-pass
   extraction as truth — **started, and already shown to be necessary**: two P1 factual
   errors from unreviewed extraction reached the runtime corpus (see Phase 0.7).
3. Select the implementation pilot — **not selected**.

Exploratory code may continue in parallel, but it does not redefine completion of these
steps, and retrieval must not be treated as authority until they are done. Note also that
collecting paper formats does **not** complete rubric preparation: the reference set still
contains no official question-level marking schemes, and an examination specification is
not a marking rubric.

## Merge gate — what must be fixed before `haixiang` merges to `main`

Status 19 September 2026, after fetching `origin/main`. Sources: the follow-up review in
[REVIEW-2026-09-12.md](./REVIEW-2026-09-12.md), a re-check of the working tree, and the
state of `main` at `63f3b1f` (22 commits ahead of this branch's base).
Recommendation is a **split merge**: the documentation can go now, the runtime files
wait for gates 1-3.

### Gate 0 — blocks everything, no decisions needed

| # | Item | Why |
| --- | --- | --- |
| 0a | **Commit and push the work.** `origin/haixiang` is still at `6e850be` (the three design-doc commits). Everything since — tool rewrite, corpus, prompt 1.1.1, eval cases, build plan, review, references — is uncommitted on one machine. | A week of work has no backup, and no merge of any kind is possible until it is committed. |

### Gate 1 — tool correctness, blocks merging `tools.ts`

Six open findings. The reviewer notes explicitly that **narrowing the accepted input
class with honest unsupported responses is a valid alternative** to making each case
work generally — that is the recommended route, since it shrinks the surface instead
of adding branches.

| # | Finding | Location | Required |
| --- | --- | --- | --- |
| 1a | **P1** `1000000000000*(x^2-2)=0` returns no solutions; the residual threshold scales with the root, not the equation, so rounding error rejects valid roots | `tools.ts:172-184` | Scale the residual check to the equation's own magnitude. Separately: a failed numerical check must NOT be reported as an excluded domain value — they are different outcomes and currently share one path |
| 1b | **P1** `(x^2+1)/(x^2+1)=0` returns roots `i`, `-i` where the expression is undefined; complex roots bypass validation entirely | `tools.ts:156-158` | Validate every root against the original domain, or reject this equation class |
| 1c | **P2** `(9007199254740992+1)/2` reports numerator `9007199254740992`; the exact value is `...93`. Fraction bigints are narrowed through `Number()` | `tools.ts:26-30` | Preserve bigint/string components, or refuse values beyond the safe-integer range |
| 1d | **P2** derivative of `x/x` at 0 reports success; simplifying the derivative erased the hole in the original function | `tools.ts:237-265` | Check the ORIGINAL function's domain at the point, not the simplified derivative's |
| 1e | **P2** `sqrt(-1)/0` returns success with `Infinity + Infinityi`; the finite check only covers JavaScript numbers | `tools.ts:316` | Validate complex results too, or return unsupported/undefined |
| 1f | The Phase 0.7.3 claim that false exactness is "impossible by construction" is premature given 1c | `BUILD-PLAN.md:140` | Soften to what is actually true |

### Gate 2 — the verification harness, blocks trusting any of the above

**Revised 19 September after fetching main.** `main` now has a CI quality gate and an
established test convention, which changes the fix: `tool-checks.mjs` should not be
patched, it should become `src/agents/math/tools.test.ts`.

Main's convention is `*.test.ts` colocated under `src/`, plain `node:assert/strict`,
run by `npm test` (`tsx --test`); there are 13 such files. Converting solves every item
below at once — CI runs it automatically, exit codes come for free, `tsx` executes the
TypeScript directly so the missing `dist/` problem disappears, and SonarQube counts it
as a test rather than as uncovered source.

| # | Finding | Location | Required |
| --- | --- | --- | --- |
| 2a | The script imports `./dist/tools.js`, which does not exist and has no build command — **it cannot run as committed**, and as a `.mjs` file under `src/` it is invisible to `npm test` while counting as SOURCE for Sonar | `tool-checks.mjs:1` | Convert to `src/agents/math/tools.test.ts` following the house convention; delete the `.mjs` |
| 2b | The quadratic assertion uses `every()`, which also passes on an empty array — it would greenlight a solver returning nothing | `tool-checks.mjs` | Require exactly two roots |
| 2c | Exit code | `tool-checks.mjs:61` | Superseded by 2a — the test runner handles this |
| 2d | The six reproductions in gate 1 are not in the check suite | — | Add them, so these defects cannot regress silently |

### Gate 2b — CI quality gate on `main` (new since this branch was cut)

`main` is now 22 commits ahead and runs `.github/workflows/build.yml` on every pull
request: `npm ci`, `npm run typecheck` (`tsc --noEmit` over the WHOLE project), `npm run
lint`, `npm test`, `npm audit --omit=dev --audit-level=critical`, then `npm run build`.
None of this branch's changes has ever been through any of it — the type checks done so
far were on isolated copies in a scratch directory, not the real project.

| # | Item | Required |
| --- | --- | --- |
| 2b-i | Branch is 22 commits behind `origin/main` | Merge or rebase onto latest `main` first. A trial merge reports **no conflicts**, and `src/lib/syllabus.ts` is unchanged, so the corpus work (headings, band heuristic, 900-character sizing) remains valid |
| 2b-ii | `typecheck`, `lint`, `test`, `build` have never been run against these changes | Install dependencies and run all four locally before opening the PR |
| 2b-iii | `tool-checks.mjs` importing a non-existent `./dist/tools.js` sits inside `src/` | Will likely trip typecheck/lint/build. Resolved by gate 2a's conversion |
| 2b-iv | SonarQube gate runs with coverage (c8 → lcov), `sonar.sources=src` | This branch adds roughly 330 lines of `tools.ts` and 230 of eval catalog with **zero** `*.test.ts` coverage. Note Sonar runs on push to `main`, not on the PR, so a coverage failure would land *after* merging. Gate 2a's conversion is what supplies the coverage |

**One dependency resolved:** johnson's runner fix is merged (`8bae4b3`). `src/evals/runner.ts`
now collects tool names across every step and dedupes them, so the earlier "don't trust a
missing-tool result" caveat is gone and a baseline run is now meaningful. The reviewer's
deeper objection still stands — names only, no mode, arguments or results — so
`requiredTools: ["equationSolver"]` still cannot show that `solve` mode ran.

### Gate 3 — reference truth, blocks merging `data/syllabus/math.md`

| # | Item | Required |
| --- | --- | --- |
| 3a | PSLE Foundation per-question-type counts are still flagged unconfirmed in the corpus | Confirm against page 2 of SEAB 0038 (the review states 20 multiple-choice plus 8 short-answer, totalling 46), then remove the caveat |
| 3b | The O-Level 4052/4049, H1, H2 and MF27 facts have never been independently reviewed | They came from the same extraction pass that produced two P1 errors. Merging puts them in front of the whole team as shared runtime evidence, so review them first |

### Gate 4 — documentation consistency, cheap

| # | Item | Status |
| --- | --- | --- |
| 4a | Build plan wording on generic mathematics help | **Done 12 Sep** — recorded as agreed direction, not an open decision |
| 4b | `math-topology-refuse` eval case still assumes refusal | Outstanding — reconcile with the agreed general-help policy (`src/evals/catalog/math.ts:108`) |
| 4c | DESIGN.md exclusion wording still frames university content as out of scope rather than allowed-but-unevaluated | Outstanding (`DESIGN.md:61`) |

### Gate 5 — evidence, blocks calling this a baseline rather than blocking the merge

| # | Item |
| --- | --- |
| 5a | **No model has ever been run against this agent.** Needs `npm install` plus an `OPENAI_API_KEY` in `.env.local`. Until then nobody has observed it answer a single question |
| 5b | The 22 eval gold replies have never been reviewed by a person; they were written by the assistant |
| 5c | Scoring weaknesses remain: a tool-name check cannot establish mode, inputs or success, and literal strings reject valid LaTeX. Needs the shared evaluation owner; the catalog is labelled a scaffold in the meantime |

### Sequenced after the merge, not gating it

Course/cohort mapping, full reference review and pilot selection remain outstanding.
They gate a *trusted baseline*, and they are the reviewer's recommended next work once
correctness is settled.

### What can merge now

`DESIGN.md`, `BUILD-PLAN.md`, `REVIEW-2026-09-12.md` and `references/` — documentation
that carries its own caveats and changes no runtime behaviour. Holding back
`tools.ts`, `prompts.ts`, `data/syllabus/math.md` and `src/evals/catalog/math.ts`
until gates 1-3 close avoids repeating the pattern the reviewer has now flagged twice:
provisional work becoming the team's shared runtime evidence before it was checked.

## Inputs this plan builds on

- `src/agents/math/references/manifest.json` — reference register, 33 sources
  catalogued (official curriculum, assessment syllabuses, specimens, pedagogy,
  textbooks).
- `src/agents/math/references/official-curriculum/*.pdf` — six MOE curriculum PDFs
  (Primary, Sec G1, Sec G2/G3, A-Math, H1, H2), downloaded and validated.
- `src/agents/math/references/official-assessment/EXTRACTED-NOTES.md` — extracted
  assessment-objective weightings, scheme of assessment, and content strands for
  O-Level Math (4052), O-Level A-Math (4049), H1 (8865), H2 (9758), PSLE Standard
  (0008), PSLE Foundation (0038), and the MF27 formula sheet. Text extraction, not
  archived PDFs — see that file's header for why, and for which sources are still
  link-only.
- The existing runtime: `data/syllabus/math.md` (28-line topic map, the only corpus
  `documentSearch` actually queries), `src/lib/syllabus.ts` (keyword + grade-band
  scoring over `##`-delimited sections, ~900-char excerpts), `src/evals/catalog/math.ts`
  (existing teaching-scenario eval items).

## Phase 0 — wire the assessment material into the running agent (Math-only, this sprint)

No cross-team dependency. Everything here stays inside `src/agents/math/` and
`data/syllabus/math.md`, consistent with the "stay in your folder" rule in
`AGENTS.md`.

| # | Task | File(s) | Acceptance check | Status |
| --- | --- | --- | --- | --- |
| 0.1 | Add per-band sections to the syllabus map covering assessment objectives (with weightings), scheme of assessment (papers, marks, duration), calculator policy, and "formula sheet is supplied, not to be memorised" for Secondary O-Level Math, O-Level A-Math, H1, and H2. Keep each section under ~900 characters (the excerpt cutoff in `searchSyllabus`) and title it so the existing grade-level heuristic (`"jc"`/`"a-level"` → jc, `"primary"` → primary, else secondary) tags it correctly. | `data/syllabus/math.md` | A manual `documentSearch` call with query "calculator" + gradeLevel "jc" returns the new H2 section; same for "marks" / "AO2" against secondary. | **Done** 12 Sep |
| 0.2 | Add a Primary section covering the PSLE Standard vs. Foundation scheme-of-assessment difference (marks, duration, paper structure) — keep Foundation framed as a different assessment, not a "lesser" one, per the source language ("simple contexts" rather than harder/easier). | `data/syllabus/math.md` | `documentSearch` query "PSLE foundation" + gradeLevel "primary" returns it. | **Done** 12 Sep |
| 0.3 | Add 5–6 new eval items in the existing `EvalItem` shape, each pinned to a scenario the new corpus unlocks: "what's on the H2 formula sheet," "can I use a calculator on O-Level Paper 1," "how are H2 marks split between technique and problem-solving," "is PSLE Foundation shorter than Standard," one adversarial case (student asserting the formula sheet doesn't exist / trying to get the agent to claim otherwise). Use `requiredTools: ["documentSearch"]` and `mustInclude` the way existing items do (see `math-maclaurin` for the pattern). | `src/evals/catalog/math.ts` | Type-checked against `EvalItem` under `strict` (clean). Suite has not been run — see 0.4. Gold replies still need human review before any pass/fail is trusted. | **Done, unreviewed** 12 Sep |
| 0.4 | Run the math suite with the current shared runner and record a baseline (dev run, not yet the reserved acceptance set). Expect the runner's known limitation — `result.toolCalls` captures only the FINAL step's tool calls — so don't treat a "no tool called" result on a later-step call as a real failure until `johnson`'s runner fix (see Phase 2) lands. | — (run, not edit) | A run record exists (date, git revision, model, per-item pass/fail) per DESIGN.md's "run record" section. | **Blocked**: `node_modules` is empty on this machine and no `.env`/`.env.local` exists, so the runner cannot execute. Needs `npm install` plus model API keys. |
| 0.5 | Add one row to the teaching-playbook table for "student asks about exam mechanics" (marks split, calculator rules, what's supplied vs. what to memorise) so DESIGN.md reflects the behaviour Phase 0 actually implements. | `DESIGN.md` (teaching playbook table) | Row present; reviewed against 0.3's eval items for consistency. | **Done** 12 Sep |

### Verification actually performed (12 September 2026)

- **Retrieval (0.1, 0.2):** `src/lib/syllabus.ts`'s chunking and scoring were re-implemented
  faithfully in a throwaway script and run against the edited `data/syllabus/math.md`. Seven
  queries were checked; in every case the intended section ranked first — "calculator"/jc →
  H1 and H2 format sections, "calculator paper 1"/primary → both PSLE sections, "formula sheet
  memorise Maclaurin"/jc → MF27, "product rule quotient rule formula list"/jc → MF27, "marks
  weighting assessment objectives"/jc → H1 and H2. No section body exceeds the 900-character
  excerpt cutoff (largest is 892).
- **Types (0.3):** the edited `src/evals/catalog/math.ts` was type-checked against the real
  `EvalItem`/`StudentProfile` definitions under `strict` with the `@/*` path alias — exit 0, no
  errors. Item count went from 10 to 16.
- **Not verified:** no model was called, so nothing here establishes that the agent *answers*
  these questions correctly — only that the evidence is retrievable and the cases are well-formed.
  That distinction is the designed/implemented/verified split DESIGN.md insists on; this slice is
  implemented, not verified.

Phase 0 as originally scoped changed only the retrieval corpus and eval catalog. Phase 0.6
later did change `prompts.ts`, with `MATH_PROMPT_VERSION` bumped and
`langflow/prompts/math.system.md` synced each time, per `TEAM.md`. The prompt is at 1.1.1.

## Phase 0.6 — make the calculation tool match its name and the exam's expectations

Added 12 September 2026 after testing what the tool could actually do. mathjs 15.2
was exercised directly before any code was written; the findings were that
`equationSolver` could not solve equations at all (no `solve()` exists in mathjs), the
tool description's own example `derivative(x^2, x)` threw "Undefined symbol x" when
passed through `evaluate`, `toPrecision(8)` turned 2/3 into 0.66666667, and eval case
`math-quadratic` required roots the tool was structurally incapable of producing.

| # | Task | File(s) | Acceptance check | Status |
| --- | --- | --- | --- | --- |
| 0.6.1 | Rewrite the tool with four modes — `evaluate`, `simplify`, `solve` (roots of a degree 1-3 polynomial in one unknown, via `polynomialRoot` on coefficients from `rationalize`), `derivative` (optionally evaluated at a point) — keeping the `equationSolver` key so the prompt, README and eval cases stay valid. | `src/agents/math/tools.ts` | Type-checks under `strict` against real `mathjs`/`ai`/`zod`; 13 runtime cases behave as specified. | **Done** 12 Sep |
| 0.6.2 | Report exactness honestly: full-precision value, a 10-significant-digit approximation, and a short exact fraction only when it round-trips within 1e-12 and is non-integer (so `sqrt(2)` returns no fraction and integers get no `/1`). | `src/agents/math/tools.ts` | `1/3` → exact `1/3`; `sqrt(2)` → no fraction; `3/4 * 12` → 9 with no fraction. | **Done** 12 Sep |
| 0.6.3 | State limits in the tool description and return structured, honest failures (`reason: input \| unsupported \| failed`) for integration, surds, simultaneous equations, trigonometric/exponential equations, and degree > 3. | `src/agents/math/tools.ts` | Each refusal returns `ok: false` with an actionable message; integration attempt fails with a hint rather than a fabricated result. | **Done** 12 Sep |
| 0.6.4 | Add examination-alignment rules to the system prompt (show working for method marks; prefer exact form; do not drill formulae the paper supplies; be accurate about calculator rules; weight practice towards applying methods; answer assessment questions from retrieved evidence) and respect the tool's stated limits. Bump `MATH_PROMPT_VERSION` to 1.1.0 and sync the Langflow copy, per `TEAM.md`. | `src/agents/math/prompts.ts`, `langflow/prompts/math.system.md` | Version bumped in both; Langflow gist reflects the new rules. | **Done** 12 Sep |
| 0.6.5 | Fix `math-quadratic` to reference `solve` mode, and add six cases covering the new surface and the honesty requirements: no-real-roots, derivative verification, exact-fraction preference, integration limit, simultaneous-equation limit, method marks. | `src/evals/catalog/math.ts` | Suite type-checks against `EvalItem`; item count 16 → 22. Gold replies still need human review. | **Done, unreviewed** 12 Sep |
| 0.6.6 | Re-check the tool's behaviour against a real model run once Phase 0.4 is unblocked — in particular whether the model actually picks `solve` mode rather than trying to reason roots out in prose. | — | A run record showing mode selection per case. | **Blocked** on 0.4 (no deps, no API key) |

### Verification actually performed (Phase 0.6)

- mathjs 15.2.0 was installed and probed directly before writing code: `solve()` absent,
  `polynomialRoot(5,6,1)` → `-1,-5`, `derivative` works directly or with quoted arguments,
  `simplify("sqrt(8)")` → `2.8284…` (so exact surds are genuinely unavailable, not a bug to fix).
- The first draft of the new logic had two defects of its own, found by testing and fixed before
  shipping: integers were reported as fractions like `3/1`, and the sign of negative rationals was
  dropped in the round-trip check so `-1` and `-2/3` were mishandled.
- The finished tool was type-checked under `strict` against the real `mathjs`, `ai` and `zod`
  packages, then compiled and its `execute` called across 13 cases: solve (quadratic, no-real-roots,
  simultaneous refusal, trig refusal), derivative (plain and at a point), evaluate (exact third,
  integer, irrational), simplify (like terms, surd with limitation flag), integration attempt, and
  garbage input. All behaved as intended.
- `src/evals/catalog/math.ts`, `src/agents/math/prompts.ts` and the new `tools.ts` were
  type-checked together under `strict` with the `@/*` alias — exit 0.
- **Still not verified:** no model has been called, so nothing here shows the agent *chooses* the
  right mode or follows the new prompt rules. That is 0.6.6, blocked on the same missing deps and
  API key as 0.4.

## Phase 0.7 — remediation of the 12 September review

Review recorded at [REVIEW-2026-09-12.md](./REVIEW-2026-09-12.md). Every defect was
reproduced locally before fixing; the reviewer was correct on all counts, and on one
point the problem was worse than reported.

| # | Finding | Fix | Status |
| --- | --- | --- | --- |
| 0.7.1 | P1 — PSLE specifications wrong in the runtime corpus (Standard Booklet A question type; Foundation 30/50 instead of 46/34) | Corrected in `data/syllabus/math.md` and `EXTRACTED-NOTES.md`, both carrying an explicit correction note. Foundation per-question-type counts flagged as still unconfirmed rather than replaced with another guess. | **Done** 12 Sep |
| 0.7.2 | P1 — `solve` discarded denominator restrictions, returning the excluded root 1 for `(x^2-1)/(x-1)=2` | Candidate roots are now substituted back into the ORIGINAL expression; roots where it is undefined or unsatisfied are returned as `excludedRoots` with a reason, and an all-excluded case reports no solution. | **Done** 12 Sep |
| 0.7.3 | P1 — float round-trip reported as exactness (`0.3333333333334` → `1/3`) | Removed entirely. `exact` now comes only from evaluating the expression in rational arithmetic via a Fraction-configured mathjs instance, so the two reported false claims can no longer occur. NOTE: not a general guarantee — follow-up review found exact values are still narrowed through `Number()`, losing bigint precision (gate 1c). | **Done, incomplete** |
| 0.7.4 | P1 — advertised linear solving always failed (`polynomialRoot` received an undefined coefficient) | Dispatch is now by actual coefficient count. Linear, quadratic and cubic are all in the repeatable checks. | **Done** 12 Sep |
| 0.7.5 | P2 — non-finite results returned as successes (`1/0`, `d/dx sqrt(x)` at 0) | Both now return `ok: false` with `reason: "undefined"`. All failure paths carry a `reason` of `input`, `unsupported`, `undefined` or `failed`. | **Done** 12 Sep |
| 0.7.6 | P2 — prompt asserted a universal marking rule | Made conditional: working is encouraged for learning and partial credit, with explicit acknowledgement that one-part short answers can earn full credit and that H1/H2 generally accept unsupported graphing-calculator answers. Prompt 1.1.1, Langflow synced. | **Done** 12 Sep |
| 0.7.7 | P2 — eval cases do not establish their claims | H2 weighting now checks all three AO values. Literal-string cases annotated as LaTeX-fragile scaffolds. Integration contract corrected — differentiating the antiderivative IS valid verification. Whole catalog headed with a scaffold-status warning. | **Done, partial** — proper fix needs richer tool evidence and a mathematics-aware scorer, which belong to the shared evaluation owner |
| 0.7.8 | Document drift (33 references not 36; contradictory prompt-change claim; runner limitation misdescribed) | All three corrected in this file. | **Done** 12 Sep |

### How the linear-solving defect escaped my own checks

Worth recording, because the process failure matters more than the bug. The prototype
was tested with `polynomialRoot(...coeffs)` spread, and the linear case passed. The
shipped file then rewrote that call to destructure four named coefficients and always
pass three arguments — and the case list used for the final run omitted the linear
case that the prototype had covered. So the code changed after the evidence was
gathered, and the evidence was never regathered. The repeatable check script at
`src/agents/math/tool-checks.mjs` now holds all 20 cases, including every reviewer
reproduction, so a rerun is one command rather than an act of memory.

## Phase 1 — make it reviewable

| # | Task | Acceptance check | Status |
| --- | --- | --- | --- |
| 1.1 | Log the "where does assessment-format knowledge live" question in DESIGN.md's decisions-pending table as provisionally resolved: kept in `math.md` for the prototype, to be revisited as a possible shared contract if Physics/Chemistry converge on the same need. Not a request for team sign-off before shipping. | Table row added with date. | Not started |
| 1.2 | Decide the PDF-archiving question: commit the six MOE curriculum PDFs as-is (already present, untracked), or move them out of git history given the manifest's own unresolved-redistribution-rights note. Decide now, since Phase 1.3 commits the references folder either way. | A one-line decision recorded in this plan or in `manifest.json`'s top-level `scope` field. | Not started |
| 1.3 | Commit the pending work as 1–2 commits on `haixiang`: `DESIGN.md` edits + this build plan, the references folder (manifest + notes, PDFs per 1.2's decision), the `math.md` expansion, the new eval cases. Keep docs and corpus/eval changes in separate commits if that reads more reviewably. | `git log` shows clean commits; `git status` clean. | Not started |
| 1.4 | Push `haixiang` to `origin` (currently local-only) and flag it for review rather than waiting for every open question to close first. | Branch visible on `origin`; review requested. | Not started |

## Phase 2 — cross-team dependencies (track, don't block on)

| # | Task | Depends on | Status |
| --- | --- | --- | --- |
| 2.1 | Re-run the math eval suite once `johnson`'s shared-runner fix (captures tool calls across all steps, not just the final one) lands on `main`, and compare against the Phase 0.4 baseline. Extend the SHARED runner rather than building a Math-only evaluation path. | `origin/johnson` merge | Not started |
| 2.2 | Write a short proposal for the team on whether assessment-objective weightings and scheme-of-assessment facts should become a shared contract (Physics/Chemistry have their own SEAB syllabuses; Testing owns assessment construction) rather than staying Math-local. Bring Phase 0 as a working example, not a pre-decided answer. | Phase 0 shipped | Not started |
| 2.3 | Revisit the PDF-licensing decision (1.2) before the repo is shared more broadly or graded, in case the provisional call needs revisiting with input from others. | Phase 1.2 | Not started |
| 2.4 | Decide whether teaching behaviour (not just scoring) should lean toward AO2-style application questions, given H2 weights that objective at 60%. Decide from Phase 0.4's real eval results, not a priori. | Phase 0.4 | Not started |

## Definition of done for this slice

This plan is complete when: Phase 0's corpus and eval additions are merged and
produce a real (not hypothetical) baseline run; Phase 1's commits are pushed and
reviewed; and Phase 2's items are either resolved or explicitly deferred with an
owner and a reason, recorded back in DESIGN.md's decisions-pending table. Reaching
this point does not mean Math's design is "done" — it means the reference-material
slice of DESIGN.md's delivery sequence has moved from planned to implemented and
verified, which is the distinction DESIGN.md itself insists on.

## Open questions carried over from discussion

- Should `math.md` absorb assessment-format facts directly (Phase 0's current
  approach), or should this eventually move to a separate corpus/tool once other
  subjects need the same pattern? Phase 0 picks the faster path deliberately;
  Phase 2.2 is where that choice gets revisited with the team.
- The new sections share common words ("calculator", "paper", "marks") with each other and with
  the topic sections, which makes the grade-bonus ranking weakness DESIGN.md already records
  easier to trip: a Primary PSLE section scored into a JC query's top four on term overlap alone.
  The new eval cases should surface this; if it bites, the fix is ranking work in
  `src/lib/syllabus.ts` (a shared file — coordinate per `TEAM.md`), not more corpus text.
- **General mathematics help is agreed direction, not an open question.** The syllabus
  anchors schoolwork and examination claims; it is not an automatic refusal boundary for
  enrichment a student explicitly asks for. What remains is implementation, not decision:
  the `math-topology-refuse` eval case and the exclusion wording in DESIGN.md still assume
  refusal and must be reconciled with the agreed direction, along with shared tutoring
  policy on how out-of-syllabus help is framed.
- Several reference-register entries (SEC syllabuses K110/K210/K232/K310/K341,
  specimen papers beyond the one spot-checked H1 paper, the pedagogy guides that
  timed out) are still unfetched. Not blocking Phase 0, but worth a follow-up pass
  before claiming the reference library is complete.
