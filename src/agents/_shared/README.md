# Shared agent contracts

Owned with Orchestration / platform (Sritam). Specialists should not edit these files without a team discussion.

| File | Purpose |
| --- | --- |
| `types.ts` | `StudentProfile`, `RoutingDecision`, `McqSet`, `FlashcardSet`, `AgentRuntimeContext` |
| `context.ts` | Prompt block: grade band, diagnostics, last 10 chats |
| `tools.ts` | Shared `documentSearch` and `webSearch` factories |

If you change a type, you will likely also need UI updates in `src/components/` and the chat route.
