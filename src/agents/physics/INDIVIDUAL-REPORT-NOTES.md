# Individual report notes — Physics Agent

**Owner:** Chua Hieng Weih  
**Project:** METS (Multi-Agent Educational & Testing System)  
**Prepared:** 18 September 2026  
**Status:** Working draft based on the current `johnson` branch and local changes. Items under “Current working tree” are not yet committed.

## My role and scope

- Owned the Physics teaching specialist for Singapore Primary science, O-Level Physics, and JC H1/H2 Physics.
- Kept Physics responsible for teaching and explanations; the Testing agent owns quizzes and flashcards.
- Worked within the shared flow: student chat → orchestration router → Physics `ToolLoopAgent` → streamed answer and tool results.
- Maintained the Physics prompt, formula/unit tools, syllabus map, evaluation cases, and Physics-specific documentation. A small shared UI hook is used to display Physics diagrams.

## Committed fixes and improvements

- **Improved Physics evaluation reliability** (`3cc84b6`, 2 September 2026): made the agent choose the relevant first tool for conversions, syllabus questions, and calculations; strengthened prompt instructions to use tool results honestly and include units.
- **Corrected evaluation tool tracking** in the same commit: the runner now collects tool calls from every agent step. Previously it could miss a required tool used before the final prose step, causing a false evaluation failure.
- **Added a CI quality gate** (`1194e51`, 14 September 2026): set up type checking, linting, tests, a critical runtime dependency audit, a production build, and SonarQube coverage/analysis.
- **Refined the SonarQube trigger** (`62ef248`, 14 September 2026): limited analysis to pushes on `main`, while pull requests still run the project checks.
- **Fixed CI lint and dependency-gate issues** (`e12eccc`, 14 September 2026): updated the dependency lockfile and corrected evaluation UI code so the checks could run cleanly.

## Current working tree — Physics improvements in progress

- **Expanded the Physics evaluation catalogue from 30 to 100 cases:** added 70 cases across calculations, conversions, concepts, misconceptions, syllabus boundaries, and clarification. Coverage spans 21 Primary, 45 Secondary, and 34 JC cases. JC profiles distinguish H1 8867, revised H2 9478, and legacy H2 9749.
- **Rebuilt the Physics syllabus map around 2026 course codes:** separated Primary, O-Level 6091, H1 8867, H2 9478, and legacy H2 9749; added source links and printed page references; documented important inclusion and exclusion boundaries. This supports more accurate `documentSearch` answers and reduces H1/H2 mix-ups.
- **Added structured Physics diagrams:** a `drawPhysicsDiagram` tool supports free-body diagrams, piecewise-linear motion graphs, and real-image converging-lens ray diagrams. Bounded schemas validate model inputs, lens image values are derived from the supplied values, and a lazy JSXGraph widget renders the result inline.
- **Added Physics-specific safeguards:** the prompt now covers school-appropriate safety, English and grade-band rules, academic integrity, and resistance to instructions embedded in student context. Local middleware screens a narrow set of unsafe/abusive outputs, repairs common maths formatting problems, and replaces incomplete streamed text.
- **Fixed misleading formula lookup behaviour:** an unknown formula now returns an explicit no-match result instead of unrelated catalogue entries.
- **Versioned and documented the prompt change:** raised `PHYSICS_PROMPT_VERSION` to `1.3.0`, updated the Langflow prompt copy, and expanded the Physics README/work guide.
- **Added an inline diagram display hook** in the shared message thread. A development-only auth bypass was also added for diagram QA; review that shared change with the UI owner before merging.

## Checks and evidence

- Current local TypeScript check: `npm run typecheck` **passed** on 18 September 2026.
- Current Physics guardrail and diagram checks: `node --import tsx --test src/agents/physics/guardrails.test.ts` **passed 9/9** on 18 September 2026.
- The Physics work guide records earlier structural validation of all 100 evaluation items, arithmetic checks for new calculations, tool checks for conversions, document-search checks for syllabus cases, and excerpt-size checks. These are dataset and local-tool checks, not a live-model score.
- A new live-model run of the expanded 100-case Physics suite has **not** been recorded. Do not claim a pass rate for it in the final report.
- The diagram widget and shared UI changes are present in the local working tree; a completed browser walkthrough is not recorded here.

## Problems addressed and learning points

- Required tool use needed both prompt guidance and reliable step-level measurement; checking only the final agent step understated actual tool use.
- A generic “JC Physics” label was too broad for 2026 syllabus decisions, so the map and evaluation cases now identify the exact course code or ask for clarification.
- Visual output needs bounded, subject-owned data contracts so the model supplies Physics values and labels while the browser controls rendering.
- Local safeguards can catch obvious output problems and formatting failures, but language compliance, full safety judgement, and factual correctness still require evaluation.

## Next steps for the individual report

- Run the 100-case Physics suite with the configured model and judge; record accuracy, failure categories, latency, tokens, and cost.
- Complete browser QA for all three diagram types and confirm the Physics stamp and expected tool calls.
- Review shared UI changes with the orchestration/UI owner, especially the development-only auth bypass.
- Use the final evaluation results and a few representative student prompts as screenshots or evidence in the report.

## Key repository evidence

- Physics implementation: [`index.ts`](./index.ts), [`prompts.ts`](./prompts.ts), [`tools.ts`](./tools.ts), [`guardrails.ts`](./guardrails.ts), [`physics-diagram-widget.tsx`](./physics-diagram-widget.tsx).
- Physics evaluation catalogue: [`../../evals/catalog/physics.ts`](../../evals/catalog/physics.ts).
- Syllabus map and prompt copy: [`../../../data/syllabus/physics.md`](../../../data/syllabus/physics.md), [`../../../langflow/prompts/physics.system.md`](../../../langflow/prompts/physics.system.md).
- CI workflow: [`../../../.github/workflows/build.yml`](../../../.github/workflows/build.yml).
