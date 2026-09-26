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
        E --> G["prepareStep forced source tool<br/>selectAssessmentSourceTool"]
        E --> H["planAssessment<br/>assessment-planner.ts"]

        G --> I["getMathAssessmentSource"]
        G --> J["getPhysicsAssessmentSource"]
        G --> K["getChemistryAssessmentSource"]

        I --> L["subject-source.ts"]
        J --> L
        K --> L

        H --> M["createMcqSet"]
        H --> N["createFlashcards"]

        E --> O["getRecentPerformance"]
        E --> P["recordPerformance note-only"]
        E --> Q["createMermaidDiagram"]
    end

    M --> R["QuizWidget<br/>src/components/quiz-widget.tsx"]
    N --> S["FlashcardWidget<br/>src/components/flashcard-widget.tsx"]

    subgraph ScoreTracking["Signed-in MCQ score tracking"]
        R --> T["Local score calculation<br/>QuizWidget state"]
        T --> U["/api/testing-progress<br/>src/app/api/testing-progress/route.ts"]
        U --> V["Auth + conversation ownership check"]
        V --> W["testing-progress.ts"]
        W --> X["score-history.ts<br/>topic key + trend summary"]
        W --> Y[("Supabase<br/>public.testing_attempts")]
        Y --> W
        W --> Z["TestingProgressPanel<br/>sidebar UI"]
    end

    C --> AA["rememberTurn / chat memory<br/>src/lib/memory.ts"]
    C --> AB["Guardrail monitor<br/>src/agents/guardrail"]

    subgraph ValidationAndDocs["Validation and engineering support"]
        AC["subject-source.test.ts"]
        AD["score-history.test.ts"]
        AE["README.md / CLAUDE.md / progress.md / todo.md"]
    end

    L -.->|grounded content| M
    L -.->|grounded content| N
    O -.->|recent note history| E
    P -.->|compact follow-up note| AF[("logs/testing-performance")]
    Z --> B
```

## Key design points

- **One public Testing agent only**: Orchestration selects Testing; Testing does not call other specialist agents directly.
- **Separation of concerns**:
  - `subject-source.ts` grounds content
  - `assessment-planner.ts` decides mode/topics/visual need
  - widget tools render structured MCQ or flashcard payloads
  - score tracking is a separate persistence flow from note logging
- **`recordPerformance` stays note-only**: score tracking does **not** overload the earlier Testing note log.
- **Score history grouping**: repeated MCQ attempts are grouped by **subject + topic/family + mode** so the UI can show improvement, regression, or stability.
- **Deployment boundary**: the score-history flow depends on the migration-defined `public.testing_attempts` schema; once that table exists, the same API/UI path works without code changes.
- **Validation-first design**: schemas and tests support software-engineering grading points such as modularity, explicit contracts, and testability.
