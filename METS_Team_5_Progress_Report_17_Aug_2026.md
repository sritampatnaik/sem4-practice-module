# METS — Team 5 Progress Report

**NUS-ISS Practice Module** | 17 August 2026 | Week 1 of 9
**Repo:** [github.com/sritampatnaik/sem4-practice-module](https://github.com/sritampatnaik/sem4-practice-module)

**Project:** Multi-Agent Educational & Testing System (METS) — a Singapore-aligned tutor that routes each student question to one of five agents (Orchestration, Math, Physics, Chemistry, Testing) for Primary, O-Level, and A-Level Mathematics, Physics, and Chemistry.

**Status:** A working prototype is running in the `mets` repo. Phase 1 (core architecture and orchestration) is complete. Subject agents and the testing module are implemented with specialist tools and a markdown syllabus search. Vector database, login, persistent student memory, and formal UAT are still ahead.

---

## What Has Been Completed

Mapped to the 14 Aug 2026 proposal WBS. Estimated project: 9 weeks / 75 person-days.

| Phase / WBS | Status | In the Repo Today |
|---|---|---|
| 1.1–1.2 Hierarchical framework, orchestration routing | **Done** | Five-agent folders with shared contracts. Chat API sanitises input, classifies intent / subject / grade, then streams from one specialist. Structured LLM routing plus keyword fallback. Concierge handles greetings and unclear subject. |
| 1.3 Profile, diagnostics, last-10-chats memory | **Done (local)** | Skippable onboarding: name, Primary / Secondary / JC band, three diagnostic questions. Profile in localStorage. Last 10 chats held in server memory for the session. |
| 2.1 Vector DB and syllabus ingest | **Partial** | Curated syllabus maps in `data/syllabus/` (topics, not encyclopedic notes). Search is keyword ranking over markdown. Supabase / pgvector not wired yet. |
| 2.2 SME agents + document / web search | **Done (slice)** | Math: equation solver (mathjs). Physics: formula lookup + unit converter. Chemistry: periodic table + reaction balancer. All three use syllabus search. Web search is a Wikipedia stub. |
| 3.1–3.2 Flashcards and MCQs | **Done (slice)** | Testing Agent tools emit structured MCQ sets (2–6 items, answer key + explanation) and flashcard decks. UI renders interactive quiz and flip-card widgets. |
| 4.1 Logging, prompt versioning, guardrails | **Partial** | Prompt versions at v1.0.0. Routing + specialist turns logged to `logs/prompts.jsonl`, UI Routing log, optional Langflow. Basic prompt-injection sanitisation. No login / API gateway yet. |
| 4.2 Integration testing, latency, UAT | **Not started** | No automated test suite yet. Manual checks described in each agent README. |

---

## Who Is Doing What

| Person | Owns | Work Now / Next |
|---|---|---|
| Sritam Patnaik (A0115530W) | Orchestration (master controller) + app shell | Routing quality, student UI, chat/trace APIs, shared types, LLMOps (Langflow / logs). Coordinates contracts that other agents depend on. |
| Gu Haixiang (A0131920U) | Math Agent | Math system prompt, equation-solver coverage, Primary / O-Level / H2 syllabus map. Folder: `src/agents/math/` |
| Chua Hieng Weih (A0315386Y) | Physics Agent | Physics prompt, school formula set, unit conversions, O-Level / A-Level syllabus map. Folder: `src/agents/physics/` |
| Lizabeth Annabel Tukiman (A0315378X) | Chemistry Agent | Chemistry prompt, periodic-table data, reaction balancer, syllabus map. Folder: `src/agents/chemistry/` |
| Muhammad Harun Bin Abdul Rashid (A0164598L) | Testing Agent | Testing prompt and tool quality, original syllabus-aligned MCQ / flashcard generation, stricter schema validation, and Testing-only harness coverage. Added internal assessment-planning and performance-log support, plus three built-in Testing test cases and a direct Testing harness in `src/agents/testing/`. Next step is live model validation of the harness and full Testing flows once `OPENAI_API_KEY` is configured. |

The initial working tutor (one git commit on `main`) was scaffolded so each person has a dedicated folder, README, and prompt file. Specialists should stay in their folder unless changing a shared contract.

---

## Next Two Weeks

1. Each SME owner iterates prompts, tools, and syllabus maps in their folder and verifies routing stamps (Math / Physics / Chemistry / Testing) on the desk.
2. Stand up pgvector (or equivalent) and ingest the three syllabus corpora — replace keyword search (proposal 2.1).
3. Move student profiles and last-10-chats memory off localStorage / in-process maps (Supabase planned).
4. Start a thin eval set for routing accuracy and specialist tool use; then UAT (proposal 4.2).

---

## Local Setup & Technical Stack

- **Run locally:** `npm install && npm run dev` → `http://localhost:3000` (requires `OPENAI_API_KEY`).
- **Stack:** Next.js App Router, Vercel AI SDK, OpenAI. Auth is localStorage only; no student login yet.
