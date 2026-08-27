# METS Evals — Slide Outline

Copy each section into a Google Slide if you prefer to build manually.

---

## Slide 1 — Title

**METS Evals**  
What they are & why they matter

Multi-Agent Educational & Testing System  
Singapore Primary · O-Level · A-Level tutor

METS Team · August 2026

---

## Slide 2 — What are evals?

**Systematic checks that our AI tutor behaves correctly**

- Evaluations (evals) are repeatable tests that measure whether METS agents do the right thing — not just whether they produce text.
- In METS, evals cover routing (Teaching vs Testing), subject selection, grade-band alignment, and assessment quality (MCQs & flashcards).
- Unlike ad-hoc manual chat tests, evals use fixed scenarios and profiles so we can compare results across prompt changes and model updates.
- Goal: catch regressions early and give educators confidence that outputs are syllabus-aligned, safe, and pedagogically sound.

> Evals answer: “Did the system behave correctly?” — not just “Did it reply?”

---

## Slide 3 — What we are building

**Foundations in place · planned eval layers next**

- **Testing harness** — `POST /api/testing-harness` runs 6 fixture scenarios (Primary fractions, O-Level kinematics, JC differentiation, etc.) in isolation.
- **Observability** — routing audit trail, prompt versioning, latency & token logs in `logs/prompts.jsonl` and the Studio UI routing panel.
- **Schema validation** — MCQ & flashcard tool contracts (IDs, option counts, `correctOptionId`) enforced before widgets render.
- **Planned next** — routing evals, RAG retrieval accuracy, verifier/marker for generated MCQs, and user-acceptance evaluation (Phase 4.2).

> Today: harness + observability. Tomorrow: automated quality gates.

---

## Slide 4 — Why evals matter for METS

**Trust, safety, and educational integrity in Singapore**

- Students depend on accurate explanations and fair assessments — evals guard against wrong answers, off-syllabus content, and inappropriate difficulty.
- Educators need explainability — every routing decision is logged with rationale and confidence so misroutes can be audited and fixed.
- Multi-agent systems fail silently — a bad router or weak Testing prompt can look fine in demo but break at scale; evals surface these early.
- Singapore governance alignment — MOE EdTech goals and AI assurance require traceability, fairness, and curriculum grounding, not black-box replies.

> Evals turn METS from a demo into a trustworthy educational product.

---

## Slide 5 — Roadmap & next steps

**How the team uses evals going forward**

- Run live harness scenarios once `OPENAI_API_KEY` is configured; record widget choice, tool outputs, and grade-band fit for each fixture.
- Add tool-contract checks — automated pass/fail on MCQ schema, flashcard structure, and performance-log writes.
- Extend evals to Orchestration routing (intent, subject, grade band) and RAG retrieval accuracy across Math, Physics, and Chemistry.
- Build verifier/marker module — validate generated MCQ correctness and track student outcomes before Phase 4 user-acceptance evaluation.

> Metric to watch: repeatable scenario pass rate + routing confidence.
