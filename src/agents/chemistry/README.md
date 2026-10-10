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
| `tools.test.ts`, `catalog.test.ts` | Unit tests for chemistry tools and structural validation of the golden evaluation dataset. |
| `guardrails.ts`, `guardrails.test.ts` | Chemistry-specific output safety, prompt-disclosure, and reply-repair backstops; tests cover both generated and streamed output. |

## Tools you must keep

- `periodicTable` — lookup by symbol, name, or atomic number
- `reactionBalancer` — neutral formula equations with grouping and optional state symbols, e.g. `Fe + O2 -> Fe2O3`; charged species and hydrates are unsupported
- `documentSearch` — shared tool with subject `"chemistry"`
- `webSearch` — optional stub; syllabus first

Missing elements: add rows to `PERIODIC_TABLE` in `tools.ts`. Do not scrape the web for atomic masses in the tool itself.

## Files you must not change

- Other specialist agent folders
- Testing widgets
- Orchestration router (chemistry keywords already live there)

## Prompt rules

- State symbols where a Singapore mark scheme would expect them.
- The profile says JC, but not H1 or H2. Ask which course when it affects syllabus coverage.
- At JC, name the mechanism (electrophilic addition, nucleophilic substitution, …) before steps.
- Give safe, teacher-supervised practical guidance and identify relevant hazards.
- Use "aluminium" and "sulfur" (Singapore spelling).

## Guardrails

The Chemistry middleware buffers complete text blocks before release, so disallowed content split across stream chunks is still filtered. Its chemistry-specific pattern checks are a limited backstop, not comprehensive moderation; the prompt remains the primary policy.

## How to test

Run the chemistry tests:

```powershell
npx tsx --test src/agents/chemistry/tools.test.ts src/agents/chemistry/catalog.test.ts src/agents/chemistry/guardrails.test.ts
npx eslint src/agents/chemistry
```

After configuring an approved model provider, an optional live smoke check is:

- "Balance Fe + O2 -> Fe2O3."
- "Proton number of carbon?"
- "Shape of BF3 at A-Level."

Confirm the stamp says **Chemistry** and that periodic table / balancer tools appear on those turns.
