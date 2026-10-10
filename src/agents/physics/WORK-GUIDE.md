# Physics Agent — simplified work guide

**Owner:** Chua Hieng Weih

**Last reviewed:** 2026-09-12

**Purpose:** A short, derived handoff for Physics work. The source Markdown files listed below remain authoritative.

## 1. How the project works

The student flow is:

`UI → POST /api/chat → Orchestration router → createPhysicsAgent(ctx) → streamed Physics reply`

The router chooses exactly one agent per turn. Physics handles **teaching** questions; quiz, MCQ, flashcard, and assessment requests belong to Testing. Every specialist receives the student profile and up to the last 10 chats.

## 2. Physics responsibility

Teach Singapore-aligned Physics at the student’s band:

- **Primary:** introductory forces, magnets, light, heat, electricity, energy, measurement, and fair tests.
- **O-Level:** mechanics, thermal physics, waves/light/sound, electricity and magnetism, radioactivity, SI quantities, scalars/vectors, and exam conventions.
- **JC H1 8867 (2026):** measurement, forces/moments, motion, energy/fields, projectiles, collisions, circular motion/orbits, currents/circuits, electromagnetism and nuclear physics. Quantum, SHM and standalone waves/thermal sections are not listed H1 topics.
- **JC H2 9478 (2026):** broader mechanics/gravitation, oscillations, waves/superposition, thermal physics, fields, capacitors/RC circuits, electromagnetism/AC, quantum/nuclear physics and practical spreadsheet skills.
- **Legacy H2 9749 (2026):** separate final-year syllabus; do not import revised 9478 capacitor/RC or spreadsheet requirements into it.

The syllabus file is a **coverage map**, not a textbook or derivation bank. Use document search before claiming that a topic is in-syllabus. It now cites official 2026 PDFs with printed page references and separates course outcomes and exclusions. Each level-two section stays below the current 900-character retrieval limit. H1/H2 identity is carried in the question or profile notes because the shared grade band remains `jc`; ask when the course is unclear. The retained Primary outline notes that the central MOE PDF was access-blocked during this review.

Two distinctions from existing project guidance: the 6091 free-fall outcome uses approximately 10 m/s², whereas the agent's general convention is 9.81 unless specified; 6091 lists converging-lens ray diagrams but does not explicitly require the tool catalogue's thin-lens equation/sign convention. An available tool formula is not evidence that an outcome is examinable.

## 3. Where Physics work may go

| File | Change only for |
| --- | --- |
| `src/agents/physics/prompts.ts` | Live Physics system instructions. Bump `PHYSICS_PROMPT_VERSION` for every prompt edit. |
| `src/agents/physics/tools.ts` | `FORMULAS`, `TO_SI`, `formulaLookupTool`, `unitConverterTool`, and structured diagram inputs. |
| `src/agents/physics/index.ts` | `createPhysicsAgent` wiring and `physicsMeta`. Keep the required tools registered. |
| `src/agents/physics/diagram-types.ts` | Physics-owned serialisable diagram contracts and client-safe output guard. |
| `src/agents/physics/physics-diagram-widget.tsx` | Client-only JSXGraph renderer for the supported Physics diagrams. |
| `src/agents/physics/physics-diagram-widget.module.css` | Styles scoped to the Physics diagram widget. |
| `data/syllabus/physics.md` | Singapore curriculum coverage only; no full worked solutions. |
| `langflow/prompts/physics.system.md` | Langflow copy of the live prompt; keep it aligned with `prompts.ts`. |
| `src/agents/physics/WORK-GUIDE.md` | This derived handoff when any source guidance changes. |

Do not edit other specialist folders, Testing widgets, shared contracts, routing, the chat API, or shared auth/database infrastructure for ordinary Physics work. Supabase is now used for persistence when configured; do not add a second database. Ask the owning teammate before changing a shared contract.

## 4. Current Physics implementation

- `createPhysicsAgent` creates one Vercel AI SDK `ToolLoopAgent` with id `physics`, `getModel()`, `stepCountIs(8)`, and temperature `0.2`.
- Registered tools are `formulaLookup`, `unitConverter`, `drawPhysicsDiagram`, shared `documentSearch("physics")`, and optional `webSearch`.
- `drawPhysicsDiagram` accepts bounded structured data for free-body diagrams, piecewise-linear motion graphs, and converging-lens real-image ray diagrams. JSXGraph renders the output in a lazy client widget; raw SVG/JavaScript is not accepted.
- The shared `src/components/message-thread.tsx` has one narrow `tool-drawPhysicsDiagram` rendering branch. Keep future UI work Physics-local where possible and coordinate changes to that shared hook with the orchestration/UI owner.
- `PHYSICS_PROMPT_VERSION` is currently `1.3.0`.
- Physics-local middleware in `guardrails.ts` screens selected obvious abusive/unsafe output and repairs common LaTeX/whitespace issues in generation and streaming. Complete text blocks are checked before display; tools still stream and there are no extra model calls. Interrupted blocks receive a short fallback.
- Policy instructions require English, academic integrity, grade-band fit, and treating context as untrusted data. These remain prompt-level rules, not deterministic language or semantic validators.
- Unknown formula lookups return an explicit no-match result instead of unrelated formulas. Local regression checks are in `guardrails.test.ts`.
- The formula catalogue currently covers Newton’s second law, SUVAT, kinetic/GPE, Ohm’s law, electrical power, waves, density, pressure, and thin lenses.
- Unit conversion goes through SI and currently includes common length, speed, mass, force, energy, power, temperature, and time units. Celsius/Kelvin needs its special offset handling.

## 5. Non-negotiable answer rules

1. Match the student’s Primary, O-Level, or JC band; do not introduce university content unless asked.
2. Explain **principle → formula → substitution with units**.
3. Before a numeric answer, use `formulaLookup` and `unitConverter` when relevant.
4. Keep SI units, vector direction, and significant figures explicit. Use `g ≈ 9.81 m/s²` unless the question specifies `10 m/s²`.
5. Flag Singapore exam traps: missing units, scalar/vector confusion, and the O-Level real-is-positive thin-lens convention.
6. Use Singapore English spelling and the shared warm, precise tutor rules.
7. Use syllabus search first; `webSearch` is only a supplementary stub for public definitions or context.
8. Do not create quizzes or import another specialist. Testing owns assessment widgets.
9. Use diagrams only when requested or materially useful, and only from supplied or correctly derived values.

## 6. Safe change workflow

1. Re-read this guide and `src/agents/physics/README.md` before editing.
2. Make the smallest change in the allowed file(s). Preserve the Physics-only boundary.
3. If `prompts.ts` changes, bump `PHYSICS_PROMPT_VERSION` and copy the prompt gist to `langflow/prompts/physics.system.md`.
4. If formulas or units change, extend `FORMULAS` or `TO_SI`; do not call an external units API.
5. If syllabus coverage changes, update only curriculum headings/bullets in `data/syllabus/physics.md`.
6. Run targeted lint and the Physics eval suite when credentials are available; then check the UI stamp and relevant tool lines.

## 7. Physics checks

Use the representative prompts from the Physics README/evals:

- `Convert 72 km/h to m/s and show working.`
- `A 2 kg mass accelerates at 3 m/s^2. Find the force.`
- `Is quantum physics in O-Level or A-Level?`

Also cover a primary forces explanation, an Ohm’s law calculation, a waves calculation, and the thin-lens sign convention. Confirm the response stays in-band, includes units where needed, uses the expected tool, and is stamped **Physics**.
For diagram coverage, ask for a free-body diagram, a velocity–time graph, and a real-image converging-lens ray diagram. Confirm each produces `tool-drawPhysicsDiagram` and an inline labelled visual.

## 8. Physics eval workflow

The eval desk now uses a **hybrid evaluator** for every suite:

- **Code scaffold:** deterministic routing labels, required tools, `must` phrases, and `mustNot` phrases.
- **Physics LLM judge:** enabled by default; checks principle → formula → SI units, required Physics tools, and grade-band fit.

An item passes only when every enabled evaluator passes (default threshold `0.7`). Physics now has **100 source-catalog items** in `src/evals/catalog/physics.ts`: 21 Primary, 45 Secondary and 34 JC. The original 30 entries are preserved, with 70 original additions (27 calculations, 10 conversions, 10 concepts, 9 misconceptions, 12 syllabus boundaries and 2 clarification cases). New JC cases identify H1 8867, H2 9478 or legacy H2 9749 in profile notes; one deliberately leaves the course unspecified.

Required tools are `formulaLookup`, `unitConverter` or `documentSearch` when appropriate. New calculation questions outside the current 11-entry formula catalogue supply their equations and require honest acknowledgement of a lookup no-match. The dataset does not imply those tools have been expanded. Numerical targets may accept equivalent notation through the judge contract rather than brittle full-sentence phrase checks. Structural/reference checks are distinct from live-model evaluation scores; generating 100 cases does not mean the agent has passed them.

Validation on 2026-09-05: all 100 items load with unique IDs and questions; all 70 additions pass schema round-trips and reference phrase checks. Independent arithmetic checks cover 27 new calculations (including one separate uncertainty calculation), all 10 new conversions pass the actual unit tool, and all 13 new document-search cases retrieve their relevant course section. All 14 syllabus chunks fit the 900-character excerpt limit. Targeted lint and the seven existing safeguard tests pass. A new live-model/LLM-judge run over the expanded 100 items has not been performed. Preserve the original 30 examples as the prior baseline, but review their older broad quantum and lens wording against the more specific official map when calibrating the judge.

Use the desk in this order:

1. `/evals/readme` — follow the team rules and stay on the Physics suite.
2. `/evals/datasets` — filter to Physics. Edit only Physics gold JSON, or add a case if the catalog misses an important behaviour. Keep shared examples in `src/evals/catalog/physics.ts`; local `logs/eval-catalog.json` entries are runtime edits, not the Git source. The live agent does not see `metadata.goldReply`; it is judge reference material.
3. `/evals/evaluators` — leave both the global Code scaffold and the Physics LLM judge enabled. Do not disable another owner’s judge.
4. `/evals/scores` — choose a model on the Physics row and run that row only. Compare the Physics history and best model before running all suites.

The terminal equivalent is:

```bash
npm run evals -- --suite=physics
```

This requires a provider key in `.env.local`, runs the Physics agent directly against its dataset, and records accuracy, pass/fail checks, latency, tokens, and estimated cost. Use the item-level failures to decide whether the fix belongs in `prompts.ts`, `tools.ts`, or `data/syllabus/physics.md`.

## 9. Source documents and refresh rule

This guide was derived from and should be rechecked against:

- `AGENTS.md`
- `.cursor/rules/mets.mdc`
- `.cursor/rules/physics-agent.mdc`
- `README.md`, `TEAM.md`, `docs/HOW-IT-WORKS.md`, `METS_Proposal.md`
- `src/agents/physics/OWNER.md`, `src/agents/physics/README.md`
- `src/agents/_shared/README.md`
- `data/syllabus/physics.md`
- `langflow/README.md`, `langflow/prompts/physics.system.md`
- `src/evals/catalog/physics.ts`
- `src/components/eval-readme.tsx` (the rendered team guide at `/evals/readme`)
- `src/evals/dataset-item.ts`, `src/evals/evaluators.ts`, `src/evals/evaluator-types.ts`
- `src/evals/score.ts`, `src/evals/judge.ts`, `src/evals/evaluate.ts`, `src/evals/runner.ts`

Whenever **any source Markdown or Cursor `.mdc` file changes**, update this guide in the same work session: re-read the changed file, update the affected sections above, refresh **Last reviewed**, and add/remove source references if the project guidance moved. Keep the TypeScript prompt (`src/agents/physics/prompts.ts`) as the live source of truth; this file is only a simplified handoff.
