# Math agent design and assessment plan

Owner: Gu Haixiang  
Status: Draft for team alignment; proposed targets are not approved requirements  
Date: 10 September 2026

## Purpose

This document sets out what the Math agent should offer, how it should behave, and how we will assess it. The priority is to justify design decisions and demonstrate explainability, robustness, reproducible evaluation, and integration with METS. We will confirm the scope and acceptance targets against the module assessment rubric with the team.

Read this alongside the [Math working instructions](README.md), [team ownership](../../../TEAM.md), and [system walkthrough](../../../docs/HOW-IT-WORKS.md). This document proposes behaviour and evidence; it does not claim that all controls below already exist.

## Student offering and bounded scope

**User promise:** Help a student understand a concept, work through a problem, or find a mistake in their working, using methods appropriate to their Singapore school level.

The overall role covers Primary, O-Level Mathematics and Additional Mathematics, and JC H1/H2 Mathematics. For this submission, demonstrated reliability should be limited to an agreed topic set rather than claimed across the whole curriculum.

Proposed initial demonstration:

| Band | Topic | Representative task |
| --- | --- | --- |
| Primary | Fractions and arithmetic | Explain and verify three quarters of twelve |
| Secondary | Linear and quadratic expressions/equations | Explain completing the square or diagnose an algebraic error |
| JC | Elementary differentiation | Explain the product rule using x² sin x |
| Across bands | Syllabus questions | Check whether a requested topic belongs to the stated band |

These examples establish a testable starting point, not confirmed curriculum coverage. Confirm coverage against the maintained syllabus corpus and team requirements.

Supported experiences are conceptual explanation, guided problem solving, explicitly requested worked solutions, checking supplied working, and syllabus questions. A brief understanding check is part of teaching; generated quiz sets and flashcard decks belong to Testing.

Excluded from the initial commitment: image or handwriting input, formal proof verification, comprehensive symbolic equation solving, university mathematics, autonomous changes to student mastery, and guarantees of learning improvement. University content explicitly requested by a student may be acknowledged as outside the evaluated scope. Math does not invoke other specialists or implement quiz widgets, authentication, storage, or routing.

## Current implementation baseline

| Component | Current implementation | Implication |
| --- | --- | --- |
| Agent | `index.ts`: `ToolLoopAgent`, temperature 0.2, eight-step limit | Tools are available to the model; their use is not guaranteed |
| Prompt | `prompts.ts`, version 1.0.0 | Requests verification, syllabus checks, LaTeX, and named methods |
| Calculation | `tools.ts`: mathjs `evaluate` and `simplify` | The name `equationSolver` does not establish general equation-solving capability |
| Context | Shared profile and recent-chat prompt formatting | Personalisation depends on supplied context, which is not authoritative instruction |
| Retrieval | Shared keyword search over syllabus Markdown | Grade matching increases ranking; a returned passage is not proof of topic coverage |
| Supplementary lookup | Shared Wikipedia lookup | Not an authority for Singapore syllabus coverage |

The chat route chooses one agent per turn. Math receives the profile and recent memory through `AgentRuntimeContext`, while the agent stream also receives UI messages. Memory previews are truncated; they must not be treated as a complete learning history.

## Teaching playbook

| Request or condition | Expected behaviour |
| --- | --- |
| Explain a concept | Explain the idea, name the method, demonstrate a suitable example, and offer a brief understanding check |
| Student is stuck or requests a hint | Use available working to offer a useful next step; ask one diagnostic question when needed |
| Full solution requested | Provide clear working and a final answer without unnecessarily withholding steps |
| Check my working | Identify the first demonstrably incorrect step, explain the misconception, and repair it; do not invent unseen steps |
| Missing or ambiguous information | Ask for the information that changes the solution, or clearly state a reasonable assumption |
| Syllabus coverage question | Retrieve relevant evidence; distinguish confirmed coverage from insufficient evidence |
| Quiz or flashcard request | Explain that assessment generation belongs to Testing; do not claim an actual handoff occurred |
| Tool failure or unsupported calculation | Try one meaningful correction if the error is recoverable; otherwise explain the limitation and never claim successful tool verification |

Use Singapore English and LaTeX. Adapt methods to the student's band. Respect explicit requests for hints, brevity, or complete working within the shared academic-integrity rules. A follow-up should respond to the student's new difficulty rather than repeat the previous answer unchanged. Present equations with enough surrounding explanation that the response remains understandable without relying on colour or visual layout alone.

## Architecture and design rationale

Retain the existing separation:

```text
Chat route → Orchestration decision → createMathAgent(context)
                                      ├─ Math instructions
                                      ├─ equationSolver
                                      ├─ Math documentSearch
                                      └─ optional webSearch
```

- Central routing preserves team ownership and makes the answering agent identifiable. It adds a classification dependency, so routing failures need separate integration tests.
- A local calculation tool provides inspectable results for supported operations. It cannot certify every mathematical argument or make unsupported symbolic operations reliable.
- Syllabus retrieval grounds coverage claims in the maintained corpus. Keyword retrieval is a proportionate prototype choice, with known relevance and completeness limits.
- Bounded tool loops limit runaway execution. A step limit alone does not establish an end-to-end time or cost budget.
- Prompts express teaching policy; schemas, code validation, and evaluation provide additional controls. Instructions alone are not evidence of compliance.

Do not add more agents or tools without identifying the failure they address and a way to evaluate the benefit. A small comparison of supported calculations with and without verification can test the value of the calculation tool. Keep prompts, models, inputs, and scoring otherwise comparable; report mixed or negative results as well as improvements.

## Engineering requirements and evidence

| ID | Requirement | Evidence to collect |
| --- | --- | --- |
| M1 | Mathematical conclusions and intermediate steps are correct within the agreed scope | Independently reviewed reference answers and scored outputs |
| M2 | Responses follow the requested teaching mode and grade band | Hint, solution, explanation, and error-diagnosis cases |
| M3 | Supported calculations are verified when material to the answer | Tool traces and checks that final statements agree with results |
| M4 | Syllabus claims are supported by relevant retrieved passages | Coverage and insufficient-evidence cases with retrieved excerpts |
| M5 | Invalid inputs and tool failures have bounded, honest recovery | Invalid syntax, unsupported operations, and simulated dependency-failure cases |
| M6 | Math respects specialist boundaries and shared contracts | Routing integration cases and import/contract review |
| M7 | Behaviour is reproducible and changes are traceable | Revision, model, prompt version, dataset version, configuration, and evaluation results |
| M8 | Student information and untrusted content are handled appropriately | Shared security review and Math-specific adversarial cases |

For calculation outputs, distinguish numerical approximation from exact results. Current numeric output rounds JavaScript numbers to eight significant digits; include precision-sensitive cases before making claims about exactness. Review accepted expression capabilities and execution limits before expanding mathjs use.

For failures, distinguish invalid input, unsupported capability, missing evidence, and infrastructure failure. Proposed policy: at most one corrected retry for a recoverable expression error, then explain the limitation. This policy is not currently enforced and must be reconciled with the overall agent step budget.

Explainability means clear mathematical working for the student and inspectable execution evidence for reviewers. Do not request or store private model reasoning. Routing rationale is a model-generated explanation, not proof of correctness. Logs should record useful events and necessary context without unnecessary personal data.

## Alignment with the other agents and shared platform

The following are requests for agreement, not changes imposed on other owners.

| Topic | Math responsibility | Alignment owner / dependency |
| --- | --- | --- |
| Routing | Document teaching versus quiz examples and ambiguous cases | Sritam / Orchestration: classification, mixed requests, actual transitions between turns |
| Testing boundary | Provide topic terminology and expected teaching behaviour; no direct specialist calls | Harun / Testing: assessment requests and interpretation of performance notes |
| Consistent tutoring | Follow agreed band labels, tone, evidence and uncertainty conventions | Physics, Chemistry, Testing, and Orchestration owners |
| Context | Consume the existing context contract defensively | Shared contract owner: profile validity, precedence of explicit grade requests, memory truncation |
| Retrieval | Evaluate relevance of Math passages and report corpus gaps | Shared retrieval owner: ranking, source identification, and behaviour when evidence is missing |
| Tracing | Expose useful tool outcomes and Math prompt version | Orchestration/platform: correlated traces, version attribution, redaction, access and retention |
| Security | Treat student text and retrieved text as untrusted data | Platform owner to be confirmed: authentication, session isolation, request validation and guardrails |
| Evaluation | Supply Math cases, references, and rubric | Eval maintainer to be confirmed: shared runner, scoring, storage and reporting |
| Operations | Stay within agreed tool budget and report dependencies | Platform owner to be confirmed: timeout, retries, latency/cost budgets and deployment |

Do not add a second database. Shared changes require coordination under `TEAM.md`. Math prompt edits require a `MATH_PROMPT_VERSION` bump and synchronisation of `langflow/prompts/math.system.md`.

Observed shared gaps to verify and assign before claiming end-to-end robustness:

- The chat route computes trimmed/flagged text but passes original messages to routing and generation; the guardrail is not an enforced sanitisation boundary.
- Generation logs use the routing prompt version rather than the specialist version.
- Syllabus ranking can return passages because of the grade bonus without a topic match.
- Documentation contains older claims about absent authentication/persistence, although those paths now exist.

These are baseline observations, not fixes delivered by this design document. Authentication and session isolation need explicit review; the presence of a sign-in UI does not by itself establish API protection.

## Evaluation plan

Separate Math evaluation from routing and UI integration so failures can be attributed correctly. The Testing agent assesses students; the evaluation framework assesses METS.

### Layers

1. **Tool checks:** evaluation, simplification, precision, invalid syntax, unsupported expressions, and structured failures. Use deterministic checks where possible.
2. **Direct Math responses:** run `createMathAgent` with controlled profiles, histories, and prompts; inspect text and tool results independently of routing.
3. **Conversation checks:** scripted follow-ups that request a hint, reveal an error, or ask for another explanation. Check adaptation and consistency.
4. **System integration:** exercise the chat path, correct specialist selection, rendering of mathematics, and trace attribution. Include Math-versus-Testing boundary requests.

### Proposed minimum dataset

Start with 24 reviewed cases: six conceptual explanations, six worked solutions, four diagnoses of student errors, four syllabus/boundary cases, and four robustness cases. Include at least four cases with scripted follow-up turns. Distribute cases across the agreed demonstration bands and include the three smoke-test prompts in the Math README. Reserve six of the 24 cases for acceptance evaluation and do not use them to tune prompts. If a reserved case is later used for tuning, replace it and record the change.

The robustness cases should cover malformed expressions, missing or conflicting context, irrelevant retrieval results, and attempts to override tutor instructions through student text or retrieved content. Exercise dependency failures through controlled simulation as additional tool or integration checks. Use synthetic student profiles and synthetic private-data markers in these tests.

Each case should include an ID, category, profile, input/history, expected mathematical result or behaviour, acceptable methods, relevant syllabus evidence where needed, expected tool behaviour, failure severity, and reference rationale. Do not require exact wording or one specific valid solution method.

### Scoring and proposed acceptance

Score correctness, teaching-mode compliance, grade suitability, grounding, verification honesty, and recovery separately. For rubric dimensions use 0 = failed, 1 = partial, 2 = met, with examples to calibrate reviewers. Mark inapplicable dimensions explicitly and exclude them from the denominator. Do not allow strong style scores to hide a wrong mathematical answer.

Proposed release criteria, subject to rubric and team agreement:

- All deterministic tool checks pass.
- At least 90% of applicable rubric checks score 2. Calculate this as checks scoring 2 divided by all applicable checks; report development and reserved-set results separately, alongside each category's results.
- No critical failures in the acceptance run: fabricated verification/source claims, disclosure of protected test data, or incorrect final mathematical answers in the agreed core demonstration set.
- Repeat at least six representative model cases three times and report variation; avoid claiming a single run proves reliability.
- Record latency, token usage, and estimated cost; set performance budgets with the team after measuring a baseline.

Human review should establish reference correctness and inspect a sample of automated grades. An LLM judge may assist with the written rubric, but record its model/version and disagreements. Response-quality evaluations do not establish improved learning outcomes; that would require a separate student study.

### Run record

Record Git revision and any uncommitted changes, dataset and syllabus-corpus versions, model identifier, prompt version, settings, tool configuration, date, per-case results, execution errors, usage, and limitations. Report whether integration dependencies were real or simulated. Preserve a baseline before changing behaviour, then run relevant regressions after changes. These records make runs comparable; hosted model outputs may still vary.

## Delivery sequence and definition of done

1. Map assessment rubric criteria to requirements M1–M8 and evidence. Confirm the demonstration topics and user offering.
2. Agree shared contracts, owners, critical-failure definitions, and acceptance targets with the team. Record decisions below.
3. Establish a reproducible baseline and identify failures before adding features.
4. Implement prioritised Math-owned improvements and coordinate shared fixes separately.
5. Run acceptance and integration checks; document results, residual risks, and unsupported capabilities.

The submission evidence should include this agreed design, the evaluation cases and scoring rubric, a baseline and final results report, and a short record of design decisions and remaining limitations. Optional comparisons or extra features follow only after the core evidence is complete.

Completion means the agreed offering is implemented, acceptance evidence is reproducible, shared integration expectations are checked, prompt copies are synchronised when changed, and remaining limitations have an owner or an explicitly accepted exclusion. A polished demo alone is insufficient evidence.

## Decisions pending

| Decision | Status |
| --- | --- |
| Module rubric mapping | Awaiting assessment requirements |
| Topic set and supported experiences | Proposed above; awaiting agreement |
| Evaluation targets and critical-failure definitions | Proposed above; awaiting agreement |
| Shared platform/evaluation owners and contracts | Awaiting team alignment |
| Latency, cost and retry budgets | Measure baseline, then agree |

Record future decisions with date, owner, rationale, and supporting evidence. Keep this document aligned with the implemented behaviour rather than silently converting proposals into claims.
