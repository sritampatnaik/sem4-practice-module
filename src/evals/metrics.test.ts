import assert from "node:assert/strict";
import { summarizeSuiteItems } from "./metrics";
import type { EvalItemResult } from "./types";

function item(
  partial: Pick<EvalItemResult, "itemId" | "suiteId" | "accuracy" | "latencyMs" | "costUsd"> &
    Partial<EvalItemResult>,
): EvalItemResult {
  return {
    title: partial.itemId,
    kind: "teaching",
    prompt: "",
    goldReply: "",
    actualText: "",
    toolCalls: [],
    passed: (partial.accuracy ?? 0) >= 0.7,
    checks: [],
    inputTokens: 100,
    outputTokens: 50,
    model: "gpt-4o",
    ...partial,
  };
}

const mixed = [
  item({ itemId: "r1", suiteId: "routing", accuracy: 1, latencyMs: 200, costUsd: 0.01 }),
  item({ itemId: "r2", suiteId: "routing", accuracy: 1, latencyMs: 400, costUsd: 0.01 }),
  item({ itemId: "m1", suiteId: "math", accuracy: 0.5, latencyMs: 2000, costUsd: 0.2 }),
];

const routing = summarizeSuiteItems("routing", "Routing", mixed);
const math = summarizeSuiteItems("math", "Mathematics", mixed);
const physics = summarizeSuiteItems("physics", "Physics", mixed);

assert.equal(routing.itemCount, 2);
assert.equal(routing.accuracy, 1);
assert.equal(routing.avgLatencyMs, 300);
assert.equal(routing.totalCostUsd, 0.02);
assert.equal(routing.totalTokens, 300);

assert.equal(math.itemCount, 1);
assert.equal(math.accuracy, 0.5);
assert.equal(math.avgLatencyMs, 2000);
assert.equal(math.totalCostUsd, 0.2);

assert.equal(routing.model, "gpt-4o");
assert.equal(math.model, "gpt-4o");
assert.equal(physics.itemCount, 0);
assert.equal(physics.accuracy, 0);
assert.equal(physics.avgLatencyMs, 0);
assert.equal(physics.totalCostUsd, 0);
assert.equal(physics.model, undefined);

assert.notEqual(routing.accuracy, math.accuracy);
assert.notEqual(routing.avgLatencyMs, math.avgLatencyMs);
assert.notEqual(routing.totalCostUsd, math.totalCostUsd);

console.log("eval metrics tests passed");
