# Testing Agent Eval Candidates

This file lists a **starter set of 20 evals** for the METS Testing Agent.

## How to read this file

- **Type**
  - `current-state`: can be evaluated against the repo as it exists now
  - `proposal-alignment`: checks behaviour implied by `METS_Proposal.md` even if the repo does not fully implement it yet
- **Surface**
  - `harness`: run via `POST /api/testing-harness`
  - `chat-route`: run via `/api/chat` to include routing
  - `manual-ui`: confirm visible behaviour in the app
- **Primary signal** is the main thing to inspect: tool call, output text, routing decision, or saved log

## Eval list

| ID | Title | Type | Surface | Prompt / setup | Primary signal | Pass criteria |
| --- | --- | --- | --- | --- | --- | --- |
| TST-E01 | Flashcard widget selection | current-state | harness | Prompt: `Flashcards on chemical bonding.` | Tool call | Agent calls `createFlashcards` and does not call `createMcqSet`. |
| TST-E02 | MCQ widget selection | current-state | harness | Prompt: `Give me five O-Level kinematics MCQs.` | Tool call | Agent calls `createMcqSet` and does not call `createFlashcards`. |
| TST-E03 | Requested count honoured | current-state | harness | Prompt: `Give me six O-Level kinematics MCQs.` | Tool payload | `createMcqSet.items.length === 6`. |
| TST-E04 | Sensible default count | current-state | harness | Prompt: `Quiz me on differentiation.` | Tool payload | Agent returns one MCQ widget with **3 to 5** items when no count is specified. |
| TST-E05 | Secondary physics subject fit | current-state | harness | Prompt: `Give me five O-Level kinematics MCQs.` with secondary profile | Tool payload + text | Questions are clearly Physics/kinematics, not pure algebra, and wording fits O-Level students. |
| TST-E06 | Primary maths simplification | current-state | harness | Prompt: `Give me three Primary school MCQs on fractions.` | Tool payload + text | Questions use Primary-level phrasing and difficulty; no Secondary/JC terminology appears. |
| TST-E07 | JC maths rigour | current-state | harness | Prompt: `Quiz me on differentiation, H2.` with JC profile | Tool payload + text | Questions reflect JC/H2 level rather than Secondary basics. |
| TST-E08 | Single-subject discipline on ambiguous request | current-state | harness | Prompt: `Test me on graphs.` | Tool payload + text | Agent either asks one clarifying question or chooses one subject explicitly; it does not silently mix subjects in one widget. |
| TST-E09 | Exactly one widget per answer | current-state | harness | Any testing prompt | Tool call sequence | Agent calls exactly one of `createMcqSet` or `createFlashcards`, never both in the same answer. |
| TST-E10 | MCQ tool contract validity | current-state | harness | Prompt: `Give me four O-Level kinematics MCQs.` | Tool payload | Each MCQ has 3 to 5 options, one valid `correctOptionId`, non-empty explanation, and unique item/option IDs. |
| TST-E11 | Flashcard tool contract validity | current-state | harness | Prompt: `Flashcards on chemical bonding.` | Tool payload | Deck contains 3 to 8 cards; each card has non-empty `front`, `back`, `topic`, and unique IDs. |
| TST-E12 | Widget-first response style | current-state | harness | Any testing prompt | Tool call + text order | A widget tool is called before the prose reply, and the prose is brief. |
| TST-E13 | No full answer key dump upfront | current-state | harness | Prompt: `Give me five O-Level kinematics MCQs.` | Output text | The first prose paragraph does not list all answers or explanations in full. |
| TST-E14 | Follow-up adapts to weak area | current-state | harness | Use scenario with prior weakness note, then prompt: `Give me a harder quiz on my weak kinematics area.` | Tool payload + text | The generated quiz focuses on the earlier weak subtopic and increases difficulty appropriately. |
| TST-E15 | Correct SME selected for sourcing | proposal-alignment | chat-route or future harness | Prompts: Physics, Chemistry, and Maths testing requests | Agent/tool trace | The system sources content from the **matching** SME path only: Physics for kinematics, Chemistry for bonding, Maths for differentiation. |
| TST-E16 | SME content used before widget generation | proposal-alignment | chat-route or future harness | Prompt: `Give me O-Level flashcards on chemical bonding.` | Agent/tool trace | A visible SME-content retrieval/handoff step happens before Testing builds the flashcard widget. |
| TST-E17 | Visual request handled safely | current-state | harness | Prompt: `Give me flashcards on chemical bonding with a simple diagram.` | Tool call + text | If `createMermaidDiagram` is used, the prose briefly describes the diagram because the UI does not render Mermaid directly. |
| TST-E18 | Assessment logging after generation | current-state | harness | Any successful testing prompt | Tool call + saved output | Agent uses `recordPerformance` after a meaningful assessment and does not invent a student score/outcome. |
| TST-E19 | Testing intent routes correctly | current-state | chat-route + manual-ui | Prompt through app: `Quiz me on waves.` | Routing log + UI | `/api/chat` routes to **Testing**, the Testing stamp is shown, and a widget appears. |
| TST-E20 | Explicit behaviour when SME source is unavailable | proposal-alignment | chat-route or future harness | Simulate missing or failed SME content for a testing request | Output text + trace | The system fails explicitly or falls back through a defined contract; it does not silently invent unsupported subject content while claiming it was SME-sourced. |

## Suggested first execution order

Run these first because they map cleanly to the current repo and immediate Testing-agent responsibilities:

1. `TST-E01` Flashcard widget selection
2. `TST-E02` MCQ widget selection
3. `TST-E05` Secondary physics subject fit
4. `TST-E10` MCQ tool contract validity
5. `TST-E12` Widget-first response style
6. `TST-E14` Follow-up adapts to weak area
7. `TST-E18` Assessment logging after generation
8. `TST-E19` Testing intent routes correctly

## Notes on architecture

- The **current repo** exposes Testing as a single specialist with its own widget tools and shared syllabus-search tools.
- The **proposal target** says the Testing Agent should generate assessments from content sourced from the relevant SME agent.
- Because of that mismatch, `TST-E15`, `TST-E16`, and `TST-E20` should be treated as **target-state evals** until the SME-content handoff contract is made explicit in the implementation.
