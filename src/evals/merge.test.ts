import assert from "node:assert/strict";
import { keepOtherSuites, latestSuiteSummaries, mergeLiveItems, mergeLiveSummaries } from "./merge";
import type { EvalItemResult, EvalSuiteSummary } from "./types";

const mathItem = {
  itemId: "m1",
  suiteId: "math",
  title: "math",
  model: "gpt-4o",
} as EvalItemResult;
const physicsItem = {
  itemId: "p1",
  suiteId: "physics",
  title: "physics",
  model: "gemini-2.5-flash",
} as EvalItemResult;
const physicsRerun = {
  itemId: "p2",
  suiteId: "physics",
  title: "physics-rerun",
  model: "gemini-2.5-pro",
} as EvalItemResult;

const kept = keepOtherSuites([mathItem, physicsItem], ["physics"]);
assert.deepEqual(
  kept.map((row) => row.suiteId),
  ["math"],
);

const items = mergeLiveItems([mathItem, physicsItem], [physicsRerun], ["physics"]);
assert.equal(items.length, 2);
assert.equal(items.find((row) => row.suiteId === "math")?.itemId, "m1");
assert.equal(items.find((row) => row.suiteId === "physics")?.itemId, "p2");
assert.equal(items.find((row) => row.suiteId === "math")?.model, "gpt-4o");

const summaries = mergeLiveSummaries(
  [
    { suiteId: "math", name: "Mathematics", itemCount: 10, passed: 8, accuracy: 0.8 } as EvalSuiteSummary,
    { suiteId: "physics", name: "Physics", itemCount: 10, passed: 4, accuracy: 0.4 } as EvalSuiteSummary,
  ],
  [{ suiteId: "physics", name: "Physics", itemCount: 10, passed: 9, accuracy: 0.9 } as EvalSuiteSummary],
  ["physics"],
);
assert.equal(summaries.find((row) => row.suiteId === "math")?.accuracy, 0.8);
assert.equal(summaries.find((row) => row.suiteId === "physics")?.accuracy, 0.9);

const reconstructed = latestSuiteSummaries(
  [
    {
      id: "old",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:01:00.000Z",
      model: "gpt-4o",
      suiteIds: ["math", "physics"],
      suites: [
        { suiteId: "math", name: "Mathematics", itemCount: 10, passed: 8, accuracy: 0.8 } as EvalSuiteSummary,
        { suiteId: "physics", name: "Physics", itemCount: 10, passed: 4, accuracy: 0.4 } as EvalSuiteSummary,
      ],
      totals: { itemCount: 20, passed: 12, accuracy: 0.6, avgLatencyMs: 1, p50LatencyMs: 1, totalCostUsd: 1, totalTokens: 1 },
    },
    {
      id: "new",
      startedAt: "2026-01-02T00:00:00.000Z",
      finishedAt: "2026-01-02T00:01:00.000Z",
      model: "gemini-2.5-flash",
      suiteIds: ["physics"],
      suites: [
        { suiteId: "physics", name: "Physics", itemCount: 10, passed: 9, accuracy: 0.9 } as EvalSuiteSummary,
      ],
      totals: { itemCount: 10, passed: 9, accuracy: 0.9, avgLatencyMs: 1, p50LatencyMs: 1, totalCostUsd: 1, totalTokens: 1 },
    },
  ],
);
assert.equal(reconstructed.find((row) => row.suiteId === "math")?.accuracy, 0.8);
assert.equal(reconstructed.find((row) => row.suiteId === "physics")?.accuracy, 0.9);

console.log("eval merge tests passed");
