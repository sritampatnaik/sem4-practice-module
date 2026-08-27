import assert from "node:assert/strict";
import { groupEvalRunsByModel, mergeEvalHistory } from "./history";
import type { EvalRunRecord } from "./types";

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

console.log("eval history tests passed");
