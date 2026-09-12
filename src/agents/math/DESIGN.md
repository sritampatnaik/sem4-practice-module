# Math agent design and assessment plan

Owner: Gu Haixiang  
Status: Draft for team alignment; proposed targets are not approved requirements  
Date: 10 September 2026

Last reviewed: 12 September 2026, including fetched remote branches listed below.

## Purpose

This document sets out what the Math agent should offer, how it should behave, and how we will assess it. The priority is to justify design decisions and demonstrate explainability, robustness, reproducible evaluation, and integration with METS. We will confirm the scope and acceptance targets against the module assessment rubric with the team.

Read this alongside the [Math working instructions](README.md), [team ownership](../../../TEAM.md), and [system walkthrough](../../../docs/HOW-IT-WORKS.md). This document proposes behaviour and evidence; it does not claim that all controls below already exist.

## Student offering and bounded scope

Math implements the shared METS tutoring experience. The proposed common contract below applies across subjects; Math supplies the methods, examples, tools, and correctness checks needed to fulfil it. Shared proposals remain subject to team agreement and should move to a centrally maintained document once agreed, with this document referencing its version.

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

## Proposed shared tutoring contract and Math specialisation

The common workflow is **understand the request → choose an approach → use relevant evidence and tools → explain or guide → check and adapt**. This is a decision framework, not a mandatory sequence of model calls or questions. A clear request for a worked solution should not trigger an unnecessary diagnostic question. A conceptual explanation need not call a calculation tool unless a material calculation requires verification.

| Shared expectation | Math specialisation | Subject flexibility |
| --- | --- | --- |
| Understand intent and relevant student context | Distinguish explanations, hints, solutions, checking working, and syllabus questions | Examples and diagnostic questions differ by subject |
| Use methods appropriate to the band | Choose suitable mathematical methods and notation | Physics and Chemistry use their own disciplinary methods and conventions |
| Support material claims with appropriate evidence | Check supported calculations and retrieve syllabus evidence for coverage claims | Tool choice and verification technique depend on the claim |
| Explain clearly and respond to the student | Show mathematical working and address the first identifiable error | Explanations may use units, diagrams, chemical representations, or other suitable forms |
| Handle uncertainty and failure honestly | Distinguish unverified calculations, ambiguous problems, and missing syllabus evidence | Recovery actions differ; evidence and honesty standards remain common |
| Preserve continuity and agent boundaries | Use relevant context without inventing mastery or claiming an unperformed handoff | Testing follows an assessment workflow within the same context and evidence conventions |

Consistency means common meanings for context, uncertainty, evidence, and outcomes. It does not require identical prompts, tool counts, response templates, or teaching methods. Testing shares these conventions but has separate requirements for assessment construction and feedback. Orchestration owns agent selection and ambiguous or mixed-request routing.

### Math teaching playbook

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
| Conflicting evidence or a challenged answer | Recheck assumptions, calculation inputs, and relevant evidence; correct an error when found and explain unresolved disagreement rather than automatically agreeing or repeating the answer |

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

M1–M8 are Math's evidence obligations under the proposed common contract. They should map to shared requirement IDs once those exist, rather than become a separate engineering standard. Subject correctness and tool behaviour remain locally specified; failure severity, evidence sufficiency, privacy, and reporting conventions should be agreed centrally.

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

Agree limits for expression size and complexity, tool execution time, and total request time with the platform owner. Check cancellation and interrupted streams: stopping the UI does not by itself prove that server or tool work stops. Record incomplete turns as such, and avoid duplicate memory or log entries on retries. These are shared integration checks; Math owns its expression-validation and tool-execution contribution.

Explainability means clear mathematical working for the student and inspectable execution evidence for reviewers. Do not request or store private model reasoning. Routing rationale is a model-generated explanation, not proof of correctness. Logs should record useful events and necessary context without unnecessary personal data.

## Alignment with the other agents and shared platform

The following are requests for agreement, not changes imposed on other owners.

Agree shared behaviour before extracting shared code. Existing context types, tutor rules, and evaluation infrastructure are the starting point; this design does not require a new base-agent class or a single universal prompt. Record any necessary subject deviation with its reason, owner, evaluation evidence, and review date. Where approved shared guidance conflicts with a local proposal, update the local proposal or explicitly agree an exception.

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

For transitions such as “explain this” → “quiz me” → “explain my mistake”, agree what context is available to the next selected agent: topic, band, requested teaching mode, and any observed answer or feedback. These are candidate information needs, not new fields mandated here. Test the current transport and memory paths before proposing contract changes. Do not assume quiz selections reach the server or become reliable evidence of mastery.

Do not add a second database. Shared changes require coordination under `TEAM.md`. Math prompt edits require a `MATH_PROMPT_VERSION` bump and synchronisation of `langflow/prompts/math.system.md`.

Observed shared gaps to verify and assign before claiming end-to-end robustness:

- The chat route computes trimmed/flagged text but passes original messages to routing and generation; the guardrail is not an enforced sanitisation boundary.
- Generation logs use the routing prompt version rather than the specialist version.
- Syllabus ranking can return passages because of the grade bonus without a topic match.
- Documentation contains older claims about absent authentication/persistence, although those paths now exist.

These are baseline observations, not fixes delivered by this design document. Authentication and session isolation need explicit review; the presence of a sign-in UI does not by itself establish API protection.

## Evaluation plan

Separate Math evaluation from routing and UI integration so failures can be attributed correctly. The Testing agent assesses students; the evaluation framework assesses METS.

### Existing framework and required extensions

Reuse the existing Math catalog and shared evaluation runner rather than creating a competing evaluation framework. The current runner executes one prompt with empty recent-chat memory and stores tool names, not their arguments or results. The proposed conversation and verification checks therefore need either an agreed extension to the shared runner or explicitly recorded manual/harness evidence until that extension is available.

The existing deterministic scaffold uses phrase matching and tool-name presence with weighted scores; its `accuracy` field is not a direct measure of mathematical correctness. Our 0–2 rubric and 90% target are separate proposed measures. Report them under distinct labels until the team agrees a mapping. Valid alternative mathematical expressions must not fail solely because they differ from a reference phrase.

Before trusting tool-use scores, collect calls from every agent step. Preserve ordered calls, arguments, results, and failures when assessing verification or retries: a list of distinct tool names only establishes presence. Add a fixture where a tool runs in an early step and the final step contains only prose, plus a negative fixture with no tool call.

Use an explicit **inconclusive** outcome when required evidence is missing. Keep it separate from a behavioural failure and from an inapplicable criterion. Report evidence completeness, and do not pass an acceptance gate while required checks remain inconclusive. The current shared judge schema supports boolean pass/fail checks, so this distinction needs team agreement and implementation or a separate review record.

### Layers

1. **Tool checks:** evaluation, simplification, precision, invalid syntax, unsupported expressions, and structured failures. Use deterministic checks where possible.
2. **Direct Math responses:** run `createMathAgent` with controlled profiles, histories, and prompts; inspect text and tool results independently of routing.
3. **Conversation checks:** scripted follow-ups that request a hint, reveal an error, or ask for another explanation. Check adaptation and consistency.
4. **System integration:** exercise the chat path, correct specialist selection, rendering of mathematics, and trace attribution. Include Math-versus-Testing boundary requests.

### Proposed minimum dataset

Start with 24 reviewed cases: six conceptual explanations, six worked solutions, four diagnoses of student errors, four syllabus/boundary cases, and four robustness cases. Include at least four cases with scripted follow-up turns. Distribute cases across the agreed demonstration bands and include the three smoke-test prompts in the Math README. Reserve six of the 24 cases for acceptance evaluation and do not use them to tune prompts. If a reserved case is later used for tuning, replace it and record the change.

The robustness cases should cover malformed expressions, missing or conflicting context, irrelevant retrieval results, and attempts to override tutor instructions through student text or retrieved content. Exercise dependency failures through controlled simulation as additional tool or integration checks. Use synthetic student profiles and synthetic private-data markers in these tests.

Include disagreement between a proposed solution and a tool result, conflicting syllabus evidence, and a student incorrectly challenging a correct answer as variants or follow-ups within the planned cases. Add controlled tool/integration checks for resource limits, cancellation, and retry behaviour. Keep these checks separate from the 24 model cases rather than expanding the topic commitment.

Each case should include an ID, category, profile, input/history, expected mathematical result or behaviour, acceptable methods, relevant syllabus evidence where needed, expected tool behaviour, failure severity, and reference rationale. Do not require exact wording or one specific valid solution method.

### Cross-subject alignment checks

Choose at least six of the proposed 24 Math cases as counterparts to team-owned Physics and Chemistry cases: concept explanation, hint-only request, checking an error, syllabus uncertainty, tool failure, and a changed request in a follow-up. Use the same behavioural criteria and evidence format, with subject-appropriate questions and reference answers. These counterparts need not have identical difficulty or tool use, and should not be used as a subject ranking.

Coordinate an additional system scenario covering teaching → Testing → explanation of an observed mistake. Check routing, context continuity, assessment boundaries, and honest handling of unavailable quiz results. This integration scenario is team-owned; passing isolated Math cases does not establish that the whole sequence works.

Report shared-contract compliance separately from subject correctness and subject-specific tool checks. Use common definitions for pass, partial, fail, inconclusive, and not applicable. Calibrate reviewers on a small shared sample before comparing results. Dataset sizes, topic difficulty, and applicable dimensions may differ, so pooled scores alone are not a fair comparison between agents.

### Scoring and proposed acceptance

Score correctness, teaching-mode compliance, grade suitability, grounding, verification honesty, and recovery separately. For rubric dimensions use 0 = failed, 1 = partial, 2 = met, with examples to calibrate reviewers. Mark inapplicable dimensions explicitly and exclude them from the denominator. Do not allow strong style scores to hide a wrong mathematical answer.

The 0–2 rubric and targets below are proposals for alignment with the common framework, not an independent Math scoring standard. Retain subject-specific reference answers while agreeing score meanings, severity, and evidence requirements with the other owners.

Proposed release criteria, subject to rubric and team agreement:

- All deterministic tool checks pass.
- At least 90% of applicable rubric checks score 2. Calculate this as checks scoring 2 divided by all applicable checks; report development and reserved-set results separately, alongside each category's results.
- No critical failures in the acceptance run: fabricated verification/source claims, disclosure of protected test data, or incorrect final mathematical answers in the agreed core demonstration set.
- Repeat at least six representative model cases three times and report variation; avoid claiming a single run proves reliability.
- Record latency, token usage, and estimated cost; set performance budgets with the team after measuring a baseline.

Human review should establish reference correctness and inspect a sample of automated grades. An LLM judge may assist with the written rubric, but record its model/version and disagreements. Response-quality evaluations do not establish improved learning outcomes; that would require a separate student study.

Treat the evaluated response, retrieved passages, and tool output as untrusted evidence supplied to the judge. They must not redefine the rubric or instruct the judge to pass a case. Include a judge check with an embedded instruction to award full marks, and confirm that scoring follows the actual evidence. Review disputed reference answers before attributing a failure to the tutor.

### Run record

Record Git revision and any uncommitted changes, dataset and syllabus-corpus versions, model identifier, prompt version, settings, tool configuration, date, per-case results, execution errors, usage, and limitations. Report whether integration dependencies were real or simulated. Preserve a baseline before changing behaviour, then run relevant regressions after changes. These records make runs comparable; hosted model outputs may still vary.

## Delivery sequence and definition of done

1. Map assessment rubric criteria to requirements M1–M8 and evidence. Confirm the demonstration topics and user offering.
2. Agree the common tutoring contract, owners, critical-failure definitions, and acceptance targets with the team. Map Math requirements to it and record any justified deviations.
3. Establish a reproducible baseline and identify failures before adding features.
4. Implement prioritised Math-owned improvements and coordinate shared fixes separately.
5. Run Math acceptance, cross-subject alignment, and team integration checks; document results, residual risks, and unsupported capabilities.

The submission evidence should include this agreed design, the evaluation cases and scoring rubric, a baseline and final results report, and a short record of design decisions and remaining limitations. Optional comparisons or extra features follow only after the core evidence is complete.

Maintain a compact evidence register for M1–M8 with an owner, design decision, implementation reference, check/result reference, and unresolved dependency. Record **designed**, **implemented**, and **verified** separately: a prompt instruction is implementation evidence for that instruction, not proof that the behaviour is reliable. Do not mark a requirement verified without a result tied to the tested revision and configuration.

Before integration, name the owner who will triage failures spanning routing, tools, and UI. Preserve a known-good revision and configuration so regressions can be reproduced and reverted through the team's normal review process. Changes to shared contracts, retrieval, prompts, models, or the evaluation runner should trigger the relevant Math regressions and cross-subject checks.

Completion means the agreed offering is implemented, acceptance evidence is reproducible, shared integration expectations are checked, prompt copies are synchronised when changed, and remaining limitations have an owner or an explicitly accepted exclusion. A polished demo alone is insufficient evidence.

For the early design stage, completion means the team has agreed the offering, common contract, ownership, and evaluation approach. Once these are settled, establish the baseline before expanding this plan; add requirements when the rubric, observed failures, or integration evidence justify them.

## Decisions pending

| Decision | Status |
| --- | --- |
| Module rubric mapping | Awaiting assessment requirements |
| Common tutoring contract and central source of truth | Proposed here for team discussion; no shared policy change made |
| Cross-subject cases and teaching/Testing transition evidence | Awaiting agreement with subject, Testing, and Orchestration owners |
| Topic set and supported experiences | Proposed above; awaiting agreement |
| Evaluation targets and critical-failure definitions | Proposed above; awaiting agreement |
| Shared platform/evaluation owners and contracts | Awaiting team alignment |
| Latency, cost and retry budgets | Measure baseline, then agree |

Record future decisions with date, owner, rationale, and supporting evidence. Keep this document aligned with the implemented behaviour rather than silently converting proposals into claims.

## Review of other branches — 12 September 2026

This review inspected fetched remote commits without merging or executing their code. The baseline is `origin/main` at `0380092`. Local unpushed work on teammates' machines is not visible. Branch names and commit IDs below record the reviewed snapshot; future changes need another review.

| Branch and reviewed tip | Relevant work | Consequence for Math |
| --- | --- | --- |
| `origin/johnson`, `3cc84b6` | Physics forces a first-step tool for selected keyword patterns, versions its prompt, and updates the shared runner to collect tool names across steps | Coordinate adoption of the runner correction before interpreting missing-tool scores. Evaluate a Math-specific tool policy rather than copying Physics keywords |
| `origin/harun`, `3158446` | Expands Testing to 100 catalog cases; adds judge guidance, tool-name registrations, and Testing evaluator instructions | Reuse evidence-based judging conventions and agree shared evaluator contracts. Math's proposed 24 cases remain justified by coverage, not another agent's case count |
| `origin/cursor/langfuse-eval-structure-c26d`, `c52f46d` | Historical evaluation foundation | Its complete file tree matches main's earlier `457fa2d` commit. Treat it as already incorporated content despite separate commit ancestry |
| `origin/cursor/mets-evals-slide-deck-ec68`, `61d73fb` | Evaluation presentation and outline | Useful explanation of intent, but its planned/current descriptions predate the present runner. It is not an additional implementation contract |

### Decisions informed by this review

- **Validate measurement before changing agent behaviour.** Physics's runner change addresses a risk that earlier tool calls are omitted from evaluation evidence. Establish the corrected baseline before deciding Math needs stronger tool forcing.
- **Tool presence is only one check.** Physics's change deduplicates tool names; it does not retain payloads, order, counts, or proof that the response used a result correctly. Math still needs the richer evidence described above.
- **Test any deterministic tool policy for false matches.** Physics chooses a single first-step tool using keyword precedence. For Math, compare prompt-led and deterministic policies on requests that require a tool, requests that do not, and mixed requests. A forced call must not replace missing-information handling or count as successful verification by itself.
- **Adopt judge discipline, not an incompatible schema without coordination.** Testing's judge document asks for explicit evidence and supports `inconclusive`, while the live judge accepts `accuracy`, `passed`, and boolean checks. The document also refers to a judge-prompt column absent from its current eval overview. Confirm which conventions will become the shared executable contract.
- **Do not infer assessment quality from prose alone.** Testing's expanded judge criteria include answer-key placement, visual handling, and performance recording. Tool names and final prose alone cannot establish widget contents, event order, or logging correctness. Apply the same evidence standard to Math verification claims.
- **Keep integration ownership explicit.** Neither active branch changes Math files, and their changes from main touch different files. There is no direct file overlap with this documentation, but shared runner/evaluator semantics still require joint validation after integration.

The user offering and specialist boundaries remain unchanged. The main adjustment is to make evaluation evidence and shared-runner readiness prerequisites for claiming that the Math acceptance criteria have been met.
