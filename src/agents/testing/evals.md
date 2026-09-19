# Testing Agent Evals Overview

The live source of truth is `src/evals/catalog/testing.ts`.

The Testing suite now contains **100 eval items** for the live eval desk.

## Current breakdown

| Category | Count |
| --- | ---: |
| Primary Maths MCQs | 12 |
| O-Level Maths MCQs | 12 |
| H2 Maths MCQs | 10 |
| O-Level Physics MCQs | 12 |
| H2 Physics MCQs | 10 |
| O-Level Chemistry MCQs | 12 |
| H2 Chemistry MCQs | 10 |
| Flashcard evals | 12 |
| Special behaviour evals | 10 |
| **Total** | **100** |

## What the suite covers

- widget choice between `createMcqSet` and `createFlashcards`
- Primary, O-Level, and H2 grade-band coverage
- Maths, Physics, and Chemistry testing prompts
- exact-count and default-count requests
- ambiguous-subject handling
- refusal of live SEAB / Ten-Year Series cloning
- no full answer-key dump up front
- visual-request handling when Mermaid may be used
- `recordPerformance` usage on meaningful assessments
- follow-up style prompts for weaker areas

## Judge guidance

- Built-in live evaluators are configured through the eval system in `src/evals/`.
- Reusable Testing judge prompts are documented in `src/agents/testing/eval-judge-prompts.md`.
