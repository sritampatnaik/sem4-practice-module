# Testing Agent Architecture

This diagram focuses on the **Testing Agent slice owned by Harun** and shows how assessment generation, score tracking, and persistence fit into the wider METS flow. The score-tracking path is now live against the Supabase `public.testing_attempts` table in initial signed-in testing.

```mermaid
flowchart TD
    A["Student UI<br/>src/app/page.tsx"] --> B["StudioShell / MessageThread<br/>src/components"]
    B --> C["/api/chat<br/>src/app/api/chat/route.ts"]
    C --> D["Orchestration Router<br/>src/agents/orchestration/router.ts"]
    D -->|intent: testing| E["Testing Agent<br/>src/agents/testing/index.ts"]

    subgraph T["Testing Agent internals"]
        E --> F["buildTestingInstructions<br/>prompts.ts"]
        E --> G["testingGuardrails middleware<br/>guardrails.ts"]
        E --> H["prepareStep forced source tool<br/>selectAssessmentSourceTool"]
        E --> I["planAssessment<br/>assessment-planner.ts"]

        H --> J["getMathAssessmentSource"]
        H --> K["getPhysicsAssessmentSource"]
        H --> L["getChemistryAssessmentSource"]

        J --> M["subject-source.ts"]
        K --> M
        L --> M

        I --> N["createMcqSet"]
        I --> O["createFlashcards"]

        E --> P["getRecentPerformance"]
        E --> Q["recordPerformance note-only"]
        E --> R["createMermaidDiagram"]
    end

    N --> S["QuizWidget<br/>src/components/quiz-widget.tsx"]
    O --> T["FlashcardWidget<br/>src/components/flashcard-widget.tsx"]

    subgraph ScoreTracking["Signed-in MCQ score tracking"]
        S --> U["Local score calculation<br/>QuizWidget state"]
        U --> V["/api/testing-progress<br/>src/app/api/testing-progress/route.ts"]
        V --> W["Auth + conversation ownership check"]
        W --> X["testing-progress.ts"]
        X --> Y["score-history.ts<br/>topic key + trend summary"]
        X --> Z[("Supabase<br/>public.testing_attempts")]
        Z --> X
        X --> AA["TestingProgressPanel<br/>sidebar UI"]
    end

    C --> AB["rememberTurn / chat memory<br/>src/lib/memory.ts"]
    C --> AC["Guardrail monitor<br/>src/agents/guardrail"]

    subgraph ValidationAndDocs["Validation and engineering support"]
        AD["guardrails.test.ts"]
        AE["assessment-planner.test.ts"]
        AF["tools.test.ts / subject-source.test.ts / score-history.test.ts"]
        AG["README.md / CLAUDE.md / progress.md / todo.md"]
    end

    M -.->|grounded content| N
    M -.->|grounded content| O
    P -.->|recent note history| E
    Q -.->|compact follow-up note| AH[("logs/testing-performance")]
    AA --> B
```

## Key design points

- **One public Testing agent only**: Orchestration selects Testing; Testing does not call other specialist agents directly.
- **Separation of concerns**:
  - `guardrails.ts` filters obvious Testing-specific integrity or prompt-disclosure failures without replacing the hidden Guardrail agent
  - `subject-source.ts` grounds content
  - `assessment-planner.ts` decides mode/topics/visual need
  - widget tools render structured MCQ or flashcard payloads
  - score tracking is a separate persistence flow from note logging
- **`recordPerformance` stays note-only**: score tracking does **not** overload the earlier Testing note log.
- **Local guardrails stay narrow**: the Testing middleware blocks obvious hidden-prompt disclosures, live-paper wording leaks, and answer-key dumps in prose, but broader student-safety escalation still belongs to `src/agents/guardrail/`.
- **Score history grouping**: repeated MCQ attempts are grouped by **subject + topic/family + mode** so the UI can show improvement, regression, or stability.
- **Deployment boundary**: the score-history flow depends on the migration-defined `public.testing_attempts` schema; once that table exists, the same API/UI path works without code changes.
- **Validation-first design**: strict note-only logging, tool schemas, guardrail tests, planner tests, and score/source regressions support software-engineering grading points such as modularity, explicit contracts, and testability.
