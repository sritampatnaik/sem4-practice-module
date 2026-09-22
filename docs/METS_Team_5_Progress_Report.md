# METS Team 5 Progress Report

21st September 2026

**Project:** Multi-Agent Educational & Testing System (METS) — a Singapore-aligned tutor that routes each student question to one of five agents (Orchestration, Math, Physics, Chemistry, Testing) for Primary, O-Level, and A-Level Mathematics, Physics, and Chemistry.

**Status:** A working prototype is running in the METS repo. Core orchestration and the five student-facing agents are in place, and the app now includes Supabase login, a dedicated diagnostics flow, conversation persistence, a hidden Guardrail monitor with admin alerts, an eval desk, and Testing-owned syllabus grounding tools for Math, Physics, and Chemistry. The main remaining work is quality refinement, broader live validation, and stronger end-to-end evidence rather than basic architecture scaffolding.

## What Has Been Completed

Mapped to the 14 Aug 2026 proposal WBS.

| Phase / WBS | Status | In the Repo Today |
|---|---|---|
| 1.1–1.2 Hierarchical framework, orchestration routing | Done | Five student-facing agent folders plus a hidden Guardrail folder. Chat API sanitises input, classifies intent / subject / grade, routes to one specialist, streams the reply, then runs Guardrail silently after the turn. Concierge handles greetings and unclear subject. |
| 1.3 Profile, diagnostics, conversations, last-10-chats memory | Partial to done (working slice) | Students can sign in or continue as guest. There is now a dedicated diagnostics page, Supabase-backed profile / conversation / chat-memory persistence when configured, plus local fallbacks where appropriate. |
| 2.1 Retrieval, syllabus ingest, persistence | Partial | Official MOE / SEAB-aligned syllabus maps are in `data/syllabus/`. Syllabus grounding is still markdown-driven, but chat retrieval / embeddings / pgvector-related persistence have been added on the app side. Source-pack quality and retrieval precision still need refinement. |
| 2.2 SME agents + document / web search | Done (working slice) | Math uses equation solving, Physics uses formula lookup + unit conversion, Chemistry uses periodic-table + reaction-balancer tools. All three ground against syllabus search. Web search remains a lightweight public-reference stub. |
| 3.1–3.2 Flashcards and MCQs | Done (expanded slice) | Testing emits structured MCQ sets and flashcard decks rendered by the UI. Testing now also uses its own subject-grounding tools (`getMathAssessmentSource`, `getPhysicsAssessmentSource`, `getChemistryAssessmentSource`) before widget generation. |
| 4.1 Logging, prompt versioning, guardrails | Done / Partial | Prompt versioning is active, prompt logs go to JSONL and optional Langflow, Routing logs appear in the UI, and Guardrail now stores staff-facing alerts with admin-only review pages. Guardrail quality and operational tuning are still ongoing. |
| 4.2 Evals, integration testing, latency, UAT | Partial | The repo now includes an eval desk (`/evals`) with datasets, evaluators, scores, history, and per-suite runs. Testing harness endpoints exist for isolated agent validation. Formal UAT and broader live measurement are still ahead. |

## Who Is Doing What

| Person | Owns | Work Now / Next |
|---|---|---|
| Sritam Patnaik (A0115530W) | Orchestration (master controller) + app shell | Owns routing, chat APIs, app shell, auth flow, diagnostics page, eval desk, shared contracts, and Guardrail integration. Current focus is system integration, shared UX, staff/admin surfaces, and keeping cross-agent contracts stable. |
| Gu Haixiang (A0131920U) | Math Agent | Owns Math prompt quality, equation-solver coverage, syllabus maps, and the Math side of the Testing grounding flow through `getMathAssessmentSource`. Next focus is refining Math grounding quality and eval performance. |
| Chua Hieng Weih (A0315386Y) | Physics Agent | Owns Physics prompt quality, formulas, unit conversion, syllabus grounding, and the Physics side of the Testing grounding flow through `getPhysicsAssessmentSource`. Next focus is improving source-pack precision and live validation. |
| Lizabeth Annabel Tukiman (A0315378X) | Chemistry Agent | Owns Chemistry prompt quality, periodic-table / reaction-balancer behaviour, syllabus grounding, and the Chemistry side of the Testing grounding flow through `getChemistryAssessmentSource`. Next focus is improving Chemistry source-pack quality and eval coverage. |
| Muhammad Harun Bin Abdul Rashid (A0164598L) | Testing Agent | Owns Testing prompt/tool quality, widget generation, note-only performance logging, harness/debugging, and Testing-owned subject-grounding integration. Testing now grounds MCQs / flashcards through `getMathAssessmentSource`, `getPhysicsAssessmentSource`, and `getChemistryAssessmentSource`, with harness-visible tool payloads and subject-source validation. Next focus is refining source-pack quality, improving follow-up prompt handling, and extending testing/eval coverage. |

The initial working tutor was scaffolded so each person has a dedicated folder, README, and prompt file. Specialists should stay in their folder unless changing a shared contract.

## Next Two Weeks

1. Refine the quality of the new subject-grounding packs, especially `learningOutcomes`, `keyConcepts`, `formulaHints`, and `misconceptionSeeds`, so Testing uses tighter syllabus evidence rather than broad excerpts.
2. Expand harness and eval coverage across all agents, including unsupported-topic cases, follow-up prompts, and model / prompt comparisons for accuracy, latency, and cost.
3. Continue prompt / tool iteration inside each specialist folder and validate that Routing, Guardrail, Testing widgets, and shared desk behaviour remain aligned after changes.
4. Strengthen retrieval quality and supporting persistence paths (including embeddings / vector-backed flows already scaffolded in the repo) and prepare more formal live validation / UAT evidence.

## Local Setup & Technical Stack

- Run locally: `npm install && npm run dev`, then open `http://localhost:3000` (requires `OPENAI_API_KEY` for live LLM turns).
- Stack: Next.js App Router, Vercel AI SDK, OpenAI / Google model support in eval flows, Supabase Auth + persistence, markdown syllabus grounding, optional Langflow logging, and a hidden Guardrail monitoring layer with admin alerts.
