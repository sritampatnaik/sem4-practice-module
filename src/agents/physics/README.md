# Physics Agent

**Owner:** Chua Hieng Weih  
**Folder:** `src/agents/physics/`  
**Syllabus corpus:** `data/syllabus/physics.md`

Tell a coding agent: *You are working on the METS Physics Agent only. Read this file fully. Do not edit other specialist folders. Do not build quizzes here.*

## Job

Teach Singapore physics at the student's band:

- Primary science (forces, energy, light, heat, electricity at intro level)
- O-Level Physics
- JC H1/H2 Physics

Always: principle → formula → substitution with **units**.

## Files you may change

| File | Purpose |
| --- | --- |
| `prompts.ts` | System prompt. Bump `PHYSICS_PROMPT_VERSION` on every edit. |
| `tools.ts` | `formulaLookup`, `unitConverter`, and the structured `drawPhysicsDiagram` tool. |
| `index.ts` | `createPhysicsAgent` wiring. |
| `diagram-types.ts` | Physics-owned serialisable diagram contracts. |
| `physics-diagram-widget.tsx` | Lazy client renderer for Physics diagrams. |
| `physics-diagram-widget.module.css` | Styles scoped to the diagram widget. |
| `data/syllabus/physics.md` | Curriculum map for RAG. |
| `langflow/prompts/physics.system.md` | Keep in sync with `prompts.ts`. |

## Tools you must keep

- `formulaLookup` — school formulas (SUVAT, F=ma, Ohm, waves, thin lens, …)
- `unitConverter` — convert via SI (km/h ↔ m/s, °C ↔ K, etc.)
- `drawPhysicsDiagram` — validated free-body, piecewise-linear motion graph, or real-image converging-lens diagram rendered with JSXGraph
- `documentSearch` — shared tool with subject `"physics"`
- `webSearch` — optional stub; syllabus first

When adding formulas, extend the `FORMULAS` list in `tools.ts`. When adding units, extend `TO_SI`. Do not call an external units API unless the team agrees.

## Files you must not change

- Other specialist agent folders
- Testing agent quiz tools
- Shared types unless the whole team agrees (`src/agents/_shared/types.ts`)

## Prompt rules

- SI units and significant figures on numeric answers.
- Call out common Singapore exam traps (missing units, scalar vs vector, real-is-positive lens convention at O-Level).
- `g ≈ 9.81 m/s^2` unless the question says 10 m/s^2.
- Stay inside the grade band.
- Draw only supported diagrams when requested or materially useful; use supplied or derived values and never invent missing measurements.

## How to test

Ask the desk:

- "Convert 72 km/h to m/s and show working."
- "A 2 kg mass accelerates at 3 m/s^2. Find the force."
- "Is quantum physics in O-Level or A-Level?"

Confirm the stamp says **Physics** and that formula / unit tools run when a number is required.
Also ask "Draw a free-body diagram of a block with weight, normal force and a push to the right" and confirm an inline Physics diagram appears.

## Lightweight safeguards (v1.3.0)

The three components are labelled in `prompts.ts` and `guardrails.ts`:

- Safety Filtering: contextual safety instructions plus a small output filter for obvious abuse and selected dangerous electrical instructions. Safety warnings remain allowed.
- Policy Enforcement: prompt rules require English, grade-band fit, academic integrity, Physics scope, and resistance to instructions embedded in student context. Language and topic compliance remain model-dependent.
- Consistency & Reliability: a short calculation format, local LaTeX/whitespace repair, an incomplete-text fallback, and an explicit no-match result from formula lookup.
- Diagram inputs use bounded Zod schemas and fixed JSXGraph templates. The model cannot send raw SVG or JavaScript to the browser.

`index.ts` applies the checks to Physics only. Text blocks are held until complete before display, so filtering works across streamed chunks. Tools continue to stream; there are no additional model calls, semantic judges, or regeneration loops. This is a limited backstop, not comprehensive moderation or factual validation.

Run local checks with `node_modules/.bin/tsx --test src/agents/physics/guardrails.test.ts`.
