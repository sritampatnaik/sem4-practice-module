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
| `tools.ts` | `formulaLookup` and `unitConverter`. |
| `index.ts` | `createPhysicsAgent` wiring. |
| `data/syllabus/physics.md` | Curriculum map for RAG. |
| `langflow/prompts/physics.system.md` | Keep in sync with `prompts.ts`. |

## Tools you must keep

- `formulaLookup` — school formulas (SUVAT, F=ma, Ohm, waves, thin lens, …)
- `unitConverter` — convert via SI (km/h ↔ m/s, °C ↔ K, etc.)
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

## How to test

Ask the desk:

- "Convert 72 km/h to m/s and show working."
- "A 2 kg mass accelerates at 3 m/s^2. Find the force."
- "Is quantum physics in O-Level or A-Level?"

Confirm the stamp says **Physics** and that formula / unit tools run when a number is required.
