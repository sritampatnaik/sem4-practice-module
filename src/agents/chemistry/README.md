# Chemistry Agent

**Owner:** Lizabeth Annabel Tukiman  
**Folder:** `src/agents/chemistry/`  
**Syllabus corpus:** `data/syllabus/chemistry.md`

Tell a coding agent: *You are working on the METS Chemistry Agent only. Read this file fully. Do not edit other specialist folders. Do not build quizzes here.*

## Job

Teach Singapore chemistry at the student's band:

- Primary science (matter, mixtures, physical vs chemical change)
- O-Level Chemistry
- JC H1/H2 Chemistry (including named organic mechanism types)

Look up elements before quoting atomic data. Balance equations with the tool, not by eye in the prompt.

## Files you may change

| File | Purpose |
| --- | --- |
| `prompts.ts` | System prompt. Bump `CHEMISTRY_PROMPT_VERSION` on every edit. |
| `tools.ts` | `periodicTable` data + `reactionBalancer`. |
| `index.ts` | `createChemistryAgent` wiring. |
| `data/syllabus/chemistry.md` | Curriculum map for RAG. |
| `langflow/prompts/chemistry.system.md` | Keep in sync with `prompts.ts`. |

## Tools you must keep

- `periodicTable` — lookup by symbol, name, or atomic number
- `reactionBalancer` — `Fe + O2 -> Fe2O3` style input
- `documentSearch` — shared tool with subject `"chemistry"`
- `webSearch` — optional stub; syllabus first

Missing elements: add rows to `PERIODIC_TABLE` in `tools.ts`. Do not scrape the web for atomic masses in the tool itself.

## Files you must not change

- Other specialist agent folders
- Testing widgets
- Orchestration router (chemistry keywords already live there)

## Prompt rules

- State symbols where a Singapore mark scheme would expect them.
- At JC, name the mechanism (electrophilic addition, nucleophilic substitution, …) before steps.
- Flag experimental safety whenever the student mentions practical work.
- Use "aluminium" and "sulfur" (Singapore spelling).

## How to test

Ask the desk:

- "Balance Fe + O2 -> Fe2O3."
- "Proton number of carbon?"
- "Shape of BF3 at A-Level."

Confirm the stamp says **Chemistry** and that periodic table / balancer tools appear on those turns.
