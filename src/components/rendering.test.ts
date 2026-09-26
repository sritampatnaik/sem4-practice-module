import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { GuardrailAlert } from "@/agents/guardrail/types";
import type { Evaluator } from "@/evals/evaluator-types";
import type { CatalogItemDraft, EvalItemResult } from "@/evals/types";
import { AdminAlertsDesk } from "./admin-alerts-desk";
import { AppFrame } from "./app-frame";
import { AuthDesk } from "./auth-desk";
import { EvalDatasetList, type CatalogSuiteView } from "./eval-dataset-list";
import { EvalEvaluatorsDesk } from "./eval-evaluators-desk";
import { EvalReadme } from "./eval-readme";
import { EvalScoresDesk } from "./eval-scores-desk";
import { FlashcardWidget } from "./flashcard-widget";
import { OnboardingDesk } from "./onboarding-desk";
import { QuizWidget } from "./quiz-widget";

test("login fallback keeps guest access visible when cloud auth is unconfigured", () => {
  const configured = renderToStaticMarkup(createElement(AuthDesk, { onSignedIn: () => {} }));
  assert.match(configured, /Sign in to pick up your student profile/);
  assert.match(configured, /Continue as guest/);
  assert.doesNotMatch(configured, /Cloud login needs/);

  const unconfigured = renderToStaticMarkup(
    createElement(AuthDesk, { onSignedIn: () => {}, configured: false }),
  );
  assert.match(unconfigured, /Cloud login needs/);
  assert.match(unconfigured, /Continue as guest/);
  assert.match(unconfigured, /type="email"[^>]*disabled=""/);
});

test("onboarding shows all supported school bands and optional diagnostics", () => {
  const html = renderToStaticMarkup(createElement(OnboardingDesk, { onComplete: () => {} }));
  assert.match(html, /Primary/);
  assert.match(html, /Secondary/);
  assert.match(html, /Junior College/);
  assert.match(html, /short diagnostic later/);
});

test("app frame places optional navigation, sidebar, actions, and rail", () => {
  const html = renderToStaticMarkup(AppFrame({
    nav: "Tutor navigation",
    sidebar: "Student profile",
    actions: "Sign out",
    rail: "Routing log",
    children: "Lesson",
  }));
  assert.match(html, /Tutor navigation/);
  assert.match(html, /Student profile/);
  assert.match(html, /Sign out/);
  assert.match(html, /Routing log/);
  assert.match(html, /Lesson/);
});

test("eval guide identifies each owner's suite and explains gold data isolation", () => {
  const html = renderToStaticMarkup(createElement(EvalReadme));
  assert.match(html, /How to eval your agent/);
  assert.match(html, /Chua Hieng Weih/);
  assert.match(html, /Muhammad Harun Bin Abdul Rashid/);
  assert.match(html, /goldReply/);
  assert.match(html, /The live model never sees/);
  assert.match(html, /href="\/evals\/datasets"/);
});

const physicsItem: CatalogItemDraft = {
  id: "physics-force",
  suiteId: "physics",
  kind: "teaching",
  title: "Newton's second law",
  prompt: "Find the force on a 2 kg mass accelerating at 3 m/s².",
  goldReply: "6 N",
  contract: "Show F = ma and units.",
  requiredTools: ["formulaLookup"],
  mustInclude: ["6 N"],
  mustNotInclude: [],
  targetAgent: "physics",
  gradeLevel: "secondary",
};

const physicsSuite: CatalogSuiteView = {
  id: "physics",
  name: "Physics",
  description: "Physics teaching cases",
  kind: "teaching",
  itemCount: 1,
  items: [physicsItem],
};

const result: EvalItemResult = {
  itemId: physicsItem.id,
  suiteId: "physics",
  title: physicsItem.title,
  kind: "teaching",
  prompt: physicsItem.prompt,
  goldReply: physicsItem.goldReply,
  actualText: "F = ma = 6 N",
  toolCalls: ["formulaLookup"],
  accuracy: 0.9,
  passed: true,
  checks: [],
  latencyMs: 120,
  inputTokens: 10,
  outputTokens: 15,
  costUsd: 0.001,
  model: "test-model",
};

test("dataset desk shows the selected suite's live result and an empty state", () => {
  const props = {
    suites: [physicsSuite],
    onSelect: () => {},
    results: [result],
    busy: false,
    onSuitesChange: () => {},
    onError: () => {},
  };
  const populated = renderToStaticMarkup(createElement(EvalDatasetList, { ...props, selected: "physics" }));
  assert.match(populated, /Newton&#x27;s second law/);
  assert.match(populated, /90% · pass/);
  assert.match(populated, /Find the force/);

  const empty = renderToStaticMarkup(createElement(EvalDatasetList, { ...props, selected: "math" }));
  assert.match(empty, /No evals in this suite yet/);
  assert.doesNotMatch(empty, /Newton&#x27;s second law/);
});

test("scores desk shows an unscored suite without inventing results", () => {
  const html = renderToStaticMarkup(
    createElement(EvalScoresDesk, {
      initial: {
        model: "gpt-4o-mini",
        suites: [{ id: "physics", name: "Physics", kind: "teaching", itemCount: 1 }],
        lastRun: null,
        history: [],
      },
    }),
  );
  assert.match(html, /Accuracy, latency, and cost by eval/);
  assert.match(html, /0\/1/);
  assert.doesNotMatch(html, /Combined across suites/);
});

test("scores desk reports the latest Physics run and combined totals", () => {
  const summary = {
    suiteId: "physics" as const,
    name: "Physics",
    itemCount: 1,
    passed: 1,
    accuracy: 0.9,
    avgLatencyMs: 120,
    p50LatencyMs: 120,
    totalCostUsd: 0.001,
    totalTokens: 25,
    model: "gpt-4o-mini",
  };
  const html = renderToStaticMarkup(
    createElement(EvalScoresDesk, {
      initial: {
        model: "gpt-4o-mini",
        suites: [{ id: "physics", name: "Physics", kind: "teaching", itemCount: 1 }],
        lastRun: {
          id: "run-1",
          startedAt: "2026-09-26T00:00:00.000Z",
          finishedAt: "2026-09-26T00:00:01.000Z",
          model: "gpt-4o-mini",
          suiteIds: ["physics"],
          items: [result],
          suites: [summary],
          totals: {
            itemCount: 1,
            passed: 1,
            accuracy: 0.9,
            avgLatencyMs: 120,
            p50LatencyMs: 120,
            totalCostUsd: 0.001,
            totalTokens: 25,
          },
        },
        history: [],
      },
    }),
  );
  assert.match(html, /Combined across suites/);
  assert.match(html, /90%/);
  assert.match(html, /1\/1/);
  assert.match(html, /Compare runs/);
});

test("evaluator desk identifies a missing judge without hiding configured judges", () => {
  const judge: Evaluator = {
    id: "llm-judge-physics",
    kind: "llm",
    name: "Physics judge",
    description: "Checks Physics explanations.",
    enabled: true,
    builtin: true,
    suiteIds: ["physics"],
    config: { passThreshold: 0.7 },
  };
  const html = renderToStaticMarkup(createElement(EvalEvaluatorsDesk, { initial: [judge] }));
  assert.match(html, /Physics judge/);
  assert.match(html, /Missing a judge for Router, Concierge, Math, Chemistry, Testing/);
});

const alert: GuardrailAlert = {
  id: "gr_test",
  sessionId: "session-1",
  userId: null,
  studentName: "Aisha",
  studentEmail: null,
  snippet: "I feel overwhelmed.",
  reason: "Distress language.",
  categories: ["distress"],
  severity: "medium",
  promptVersion: "1.0.0",
  notifiedEmail: null,
  notifiedAt: null,
  acknowledgedAt: null,
  acknowledgedBy: null,
  createdAt: "2026-09-26T00:00:00.000Z",
};

test("staff alert desk distinguishes open and acknowledged alerts", () => {
  const empty = renderToStaticMarkup(createElement(AdminAlertsDesk, { initialAlerts: [] }));
  assert.match(empty, /0 open · 0 total/);
  assert.match(empty, /No alerts yet/);

  const open = renderToStaticMarkup(createElement(AdminAlertsDesk, { initialAlerts: [alert] }));
  assert.match(open, /1 open · 1 total/);
  assert.match(open, /Aisha/);
  assert.match(open, /Acknowledge/);

  const acknowledged = renderToStaticMarkup(
    createElement(AdminAlertsDesk, {
      initialAlerts: [{ ...alert, acknowledgedAt: "2026-09-26T01:00:00.000Z", acknowledgedBy: "Tutor" }],
    }),
  );
  assert.match(acknowledged, /0 open · 1 total/);
  assert.match(acknowledged, /Acknowledged/);
  assert.doesNotMatch(acknowledged, />Acknowledge<\/button>/);
});

test("testing widgets present the question before revealing answers", () => {
  const quiz = renderToStaticMarkup(
    createElement(QuizWidget, {
      quiz: {
        title: "Forces quiz",
        subject: "physics",
        items: [{
          id: "force-1",
          question: "What is a force?",
          options: [{ id: "a", label: "A push or pull" }, { id: "b", label: "A colour" }],
          correctOptionId: "a",
          explanation: "A force is a push or pull.",
          topic: "forces",
        }],
      },
    }),
  );
  assert.match(quiz, /What is a force/);
  assert.match(quiz, /A push or pull/);
  assert.doesNotMatch(quiz, /A force is a push or pull/);

  const cards = renderToStaticMarkup(
    createElement(FlashcardWidget, {
      deck: {
        title: "Forces cards",
        subject: "physics",
        cards: [{ id: "force-1", front: "Define force", back: "A push or pull", topic: "forces" }],
      },
    }),
  );
  assert.match(cards, /Define force/);
  assert.doesNotMatch(cards, /A push or pull/);
});
