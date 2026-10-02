# Testing Agent Architecture

This diagram focuses on the **Testing Agent slice owned by Harun** and shows how assessment generation, score tracking, and persistence fit into the wider METS flow. The score-tracking path is now live against the Supabase `public.testing_attempts` table in initial signed-in testing.

```mermaid
flowchart TD
    A["Student UI<br/>src/app/page.tsx"] --> B["StudioShell / MessageThread<br/>src/components"]
    B --> C["/api/chat<br/>src/app/api/chat/route.ts"]
    C --> D["Orchestration Router<br/>src/agents/orchestration/router.ts"]
    D -->|intent: testing| E["Testing Agent<br/>src/agents/testing/index.ts"]

    subgraph TestingInternals["Testing Agent internals"]
        E --> F["buildTestingInstructions<br/>prompts.ts"]
        E --> G["testingGuardrails middleware<br/>guardrails.ts"]
        E --> H["prepareStep forced source tool<br/>selectAssessmentSourceTool"]
        E --> I["getTopicScoreContext<br/>tools.ts"]
        I --> J["planAssessment<br/>assessment-planner.ts"]

        H --> K["getMathAssessmentSource"]
        H --> L["getPhysicsAssessmentSource"]
        H --> M["getChemistryAssessmentSource"]

        K --> N["subject-source.ts"]
        L --> N
        M --> N

        J --> O["createMcqSet"]
        J --> P["createFlashcards"]

        E --> Q["getRecentPerformance"]
        E --> R["recordPerformance note-only"]
        E --> S["createMermaidDiagram"]
    end

    O --> T["QuizWidget<br/>src/components/quiz-widget.tsx"]
    P --> U["FlashcardWidget<br/>src/components/flashcard-widget.tsx"]

    subgraph ScoreTracking["Signed-in MCQ score tracking"]
        T --> V["Local score calculation<br/>QuizWidget state"]
        V --> W["/api/testing-progress<br/>src/app/api/testing-progress/route.ts"]
        W --> X["Auth + conversation ownership check"]
        X --> Y["testing-progress.ts"]
        Y --> Z["score-history.ts<br/>topic key + trend summary"]
        Y --> AA[("Supabase<br/>public.testing_attempts")]
        AA --> Y
        Y --> AB["TestingProgressPanel<br/>sidebar UI"]
    end

    C --> AC["rememberTurn / chat memory<br/>src/lib/memory.ts"]
    C --> AD["Guardrail monitor<br/>src/agents/guardrail"]

    subgraph ValidationAndDocs["Validation and engineering support"]
        AE["guardrails.test.ts"]
        AF["assessment-planner.test.ts"]
        AG["tools.test.ts / subject-source.test.ts / score-history.test.ts"]
        AH["README.md / CLAUDE.md / progress.md / todo.md"]
    end

    N -.->|grounded content| O
    N -.->|grounded content| P
    I -.->|topic-scoped score note| J
    Q -.->|recent note history| E
    R -.->|compact follow-up note| AI[("logs/testing-performance")]
    AB --> B
```

## Key design points

- **One public Testing agent only**: Orchestration selects Testing; Testing does not call other specialist agents directly.
- **Separation of concerns**:
  - `guardrails.ts` filters obvious Testing-specific integrity or prompt-disclosure failures without replacing the hidden Guardrail agent
  - `subject-source.ts` grounds content
  - `getTopicScoreContext` keeps follow-up adaptation topic-scoped and prefers persisted score summaries before falling back to note hints
  - `assessment-planner.ts` decides mode/topics/visual need/difficulty using explicit score bands
  - widget tools render structured MCQ or flashcard payloads
  - score tracking is a separate persistence flow from note logging
- **`recordPerformance` stays note-only**: score tracking does **not** overload the earlier Testing note log.
- **Local guardrails stay narrow**: the Testing middleware blocks obvious hidden-prompt disclosures, live-paper wording leaks, and answer-key dumps in prose, but broader student-safety escalation still belongs to `src/agents/guardrail/`.
- **Score history grouping**: repeated MCQ attempts are grouped by **subject + topic/family + mode** so the UI can show improvement, regression, or stability.
- **Current adaptive boundary**: follow-up difficulty is topic-scoped, prefers persisted Supabase score summaries, and currently uses deterministic MCQ-oriented score bands (<60 easier, 60-79 standard, >=80 harder).
- **Deployment boundary**: the score-history flow depends on the migration-defined `public.testing_attempts` schema; once that table exists, the same API/UI path works without code changes.
- **Validation-first design**: strict note-only logging, tool schemas, guardrail tests, planner tests, and score/source regressions support software-engineering grading points such as modularity, explicit contracts, and testability.
- **Project-wide eval support**: the Testing smoke evals now sit inside a Promptfoo CI regression gate, so this slice contributes directly to a merge-blocking quality baseline.
