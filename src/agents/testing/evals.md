# Testing Agent Eval Suite

This file contains the recommended **updated eval list** for the METS Testing Agent.

## Scope

- **Core evals** are the main Testing-owned suite to run against the current repo.
- **Future/stretch evals** are useful to keep visible, but they should not block Harun's current Testing-agent work.

## Judge-model guidance

- Use **`gpt-5-mini`** for mechanical checks such as tool choice, count control, contract validity, and logging presence.
- Use **`gpt-5`** for nuanced judgement such as grade-band fit, subject fit, ambiguity handling, adaptation quality, answer-key leakage, and end-to-end behaviour.
- Judge prompts are defined in `src/agents/testing/eval-judge-prompts.md`.

## Core evals

These **15 core evals** are the recommended main suite for the Testing agent.

| ID | Surface | Recommended judge model | Judge prompt | Prompt / setup | Pass criteria |
| --- | --- | --- | --- | --- | --- |
| TST-C01 | harness | `gpt-5-mini` | `testing-eval-judge.base` | Prompt: `Flashcards on chemical bonding.` | Agent calls `createFlashcards` and does not call `createMcqSet`. |
| TST-C02 | harness | `gpt-5-mini` | `testing-eval-judge.base` | Prompt: `Give me five O-Level kinematics MCQs.` | Agent calls `createMcqSet` and does not call `createFlashcards`. |
| TST-C03 | harness | `gpt-5-mini` | `testing-eval-judge.base` | Prompts: `Give me six O-Level kinematics MCQs.` and `Quiz me on differentiation.` | Requested count is honoured, and when no count is specified the widget stays within the documented 3-5 default range. |
| TST-C04 | harness | `gpt-5` | `testing-eval-judge.pedagogy` | Prompt: `Give me five O-Level kinematics MCQs.` with secondary profile | Questions are clearly Physics/kinematics, not pure algebra, and wording fits O-Level students. |
| TST-C05 | harness | `gpt-5` | `testing-eval-judge.pedagogy` | Prompt: `Give me three Primary school MCQs on fractions.` | Questions use Primary-level phrasing and difficulty; no Secondary/JC terminology appears. |
| TST-C06 | harness | `gpt-5` | `testing-eval-judge.pedagogy` | Prompt: `Quiz me on differentiation, H2.` with JC profile | Questions reflect JC/H2 level rather than Secondary basics. |
| TST-C07 | harness | `gpt-5` | `testing-eval-judge.pedagogy` | Prompt: `Test me on graphs.` | Agent either asks one short clarifying question or chooses one subject explicitly; it does not silently mix subjects in one widget. |
| TST-C08 | harness | `gpt-5-mini` | `testing-eval-judge.contract` | Prompt: `Give me four O-Level kinematics MCQs.` | Each MCQ has 3 to 5 options, one valid `correctOptionId`, non-empty explanation, and unique item/option IDs. |
| TST-C09 | harness | `gpt-5-mini` | `testing-eval-judge.contract` | Prompt: `Flashcards on chemical bonding.` | Deck contains 3 to 8 cards; each card has non-empty `front`, `back`, `topic`, and unique IDs. |
| TST-C10 | harness | `gpt-5-mini` | `testing-eval-judge.base` | Any testing prompt | Agent calls exactly one of `createMcqSet` or `createFlashcards`, and the answer stays widget-first rather than prose-first. |
| TST-C11 | harness | `gpt-5` | `testing-eval-judge.pedagogy` | Prompt: `Give me five O-Level kinematics MCQs.` | The first prose paragraph does not list all answers or explanations in full. |
| TST-C12 | harness | `gpt-5` | `testing-eval-judge.pedagogy` | Use follow-up context, then prompt: `Give me a harder quiz on my weak kinematics area.` | The generated quiz focuses on the earlier weak subtopic and increases difficulty sensibly. |
| TST-C13 | harness | `gpt-5` | `testing-eval-judge.pedagogy` | Prompt: `Give me flashcards on chemical bonding with a simple diagram.` | If `createMermaidDiagram` is used, the prose briefly describes the diagram because the UI does not render Mermaid directly. |
| TST-C14 | harness | `gpt-5-mini` | `testing-eval-judge.contract` | Any successful testing prompt | Agent uses `recordPerformance` after a meaningful assessment and does not invent a student score or outcome. |
| TST-C15 | chat-route + manual-ui | `gpt-5` | `testing-eval-judge.e2e` | Prompt through app: `Quiz me on waves.` | `/api/chat` routes to **Testing**, the Testing stamp is shown, and a widget appears. |

## Future/stretch evals

These evals reflect proposal-target behaviour and should be tracked separately from the core suite.

| ID | Surface | Recommended judge model | Judge prompt | Prompt / setup | Pass criteria |
| --- | --- | --- | --- | --- | --- |
| TST-F01 | chat-route or future harness | `gpt-5` | `testing-eval-judge.e2e` | Physics, Chemistry, and Maths testing requests | The system sources content from the matching SME path only: Physics for kinematics, Chemistry for bonding, Maths for differentiation. |
| TST-F02 | chat-route or future harness | `gpt-5` | `testing-eval-judge.e2e` | Prompt: `Give me O-Level flashcards on chemical bonding.` | A visible SME-content retrieval or handoff step happens before Testing builds the widget. |
| TST-F03 | chat-route or future harness | `gpt-5` | `testing-eval-judge.e2e` | Simulate missing or failed SME content for a testing request | The system fails explicitly or falls back through a defined contract; it does not silently invent unsupported subject content while claiming it was SME-sourced. |

## Recommended first run order

1. `TST-C01`
2. `TST-C02`
3. `TST-C04`
4. `TST-C08`
5. `TST-C10`
6. `TST-C12`
7. `TST-C14`
8. `TST-C15`
