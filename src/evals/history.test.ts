import assert from "node:assert/strict";
import {
  flattenSuiteResults,
  groupEvalRunsByModel,
  groupSuiteResultsByModel,
  mergeEvalHistory,
} from "./history";
import type { EvalRunRecord, EvalSuiteSummary } from "./types";

const totals = {
  itemCount: 10,
  passed: 8,
  accuracy: 0.8,
  avgLatencyMs: 900,
  p50LatencyMs: 800,
  totalCostUsd: 0.02,
  totalTokens: 4000,
};

function record(partial: Partial<EvalRunRecord> & Pick<EvalRunRecord, "id" | "model">): EvalRunRecord {
  return {
    startedAt: "2026-08-27T10:00:00.000Z",
    finishedAt: "2026-08-27T10:05:00.000Z",
    suiteIds: ["math"],
    suites: [],
    totals,
    ...partial,
  };
}

const older = record({
  id: "run-old",
  model: "gpt-4o-mini",
  finishedAt: "2026-08-26T10:00:00.000Z",
  totals: { ...totals, accuracy: 0.6, avgLatencyMs: 400 },
});
const newer = record({
  id: "run-new",
  model: "gpt-4o",
  finishedAt: "2026-08-27T12:00:00.000Z",
  totals: { ...totals, accuracy: 0.9, avgLatencyMs: 1200 },
});
const alsoGpt4o = record({
  id: "run-mid",
  model: "gpt-4o",
  finishedAt: "2026-08-27T08:00:00.000Z",
  totals: { ...totals, accuracy: 0.7, avgLatencyMs: 700 },
});

const merged = mergeEvalHistory([older, newer], [newer, alsoGpt4o], [{ ...older, id: "" }]);
assert.deepEqual(
  merged.map((run) => run.id),
  ["run-new", "run-mid", "run-old"],
);
assert.equal(merged.length, 3);

const grouped = groupEvalRunsByModel(merged);
assert.equal(grouped[0]?.model, "gpt-4o");
assert.equal(grouped[0]?.runs, 2);
assert.equal(grouped[0]?.bestAccuracy, 0.9);
assert.equal(grouped[0]?.latestAccuracy, 0.9);
assert.equal(grouped[0]?.bestLatencyMs, 700);
assert.equal(grouped[1]?.model, "gpt-4o-mini");
assert.equal(grouped[1]?.bestAccuracy, 0.6);

function suite(
  suiteId: EvalSuiteSummary["suiteId"],
  name: string,
  accuracy: number,
  model?: string,
): EvalSuiteSummary {
  return {
    suiteId,
    name,
    itemCount: 10,
    passed: Math.round(accuracy * 10),
    accuracy,
    avgLatencyMs: 800,
    p50LatencyMs: 700,
    totalCostUsd: 0.01,
    totalTokens: 1000,
    model,
  };
}

const mixed = record({
  id: "run-mixed",
  model: "gpt-4o + gemini-2.5-flash",
  finishedAt: "2026-08-29T12:00:00.000Z",
  suiteIds: ["math", "physics"],
  suites: [
    suite("math", "Math", 0.8, "gpt-4o"),
    suite("physics", "Physics", 0.5, "gemini-2.5-flash"),
  ],
});
const physicsRerun = record({
  id: "run-physics",
  model: "gemini-2.5-pro",
  finishedAt: "2026-08-30T12:00:00.000Z",
  suiteIds: ["physics"],
  suites: [suite("physics", "Physics", 0.9, "gemini-2.5-pro")],
});

const flat = flattenSuiteResults([physicsRerun, mixed]);
assert.deepEqual(
  flat.map((row) => `${row.suiteId}:${row.model}:${row.accuracy}`),
  ["physics:gemini-2.5-pro:0.9", "math:gpt-4o:0.8", "physics:gemini-2.5-flash:0.5"],
);

const byAgent = groupSuiteResultsByModel(flat);
const physicsBest = byAgent.find((row) => row.suiteId === "physics" && row.model === "gemini-2.5-pro");
const mathBest = byAgent.find((row) => row.suiteId === "math");
assert.equal(physicsBest?.bestAccuracy, 0.9);
assert.equal(physicsBest?.runs, 1);
assert.equal(mathBest?.model, "gpt-4o");
assert.equal(mathBest?.bestAccuracy, 0.8);
assert.equal(
  byAgent.filter((row) => row.suiteId === "physics").length,
  2,
);

console.log("eval history tests passed");
