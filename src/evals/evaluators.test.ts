import assert from "node:assert/strict";
import {
  defaultEvaluators,
  evaluatorsForSuite,
  judgeIdForSuite,
  missingJudgeSuites,
  parseEvaluator,
} from "./evaluator-types";
import { EVAL_SUITE_IDS } from "./types";

const defaults = defaultEvaluators();
assert.equal(defaults.filter((item) => item.kind === "code").length, 1);
assert.equal(defaults.filter((item) => item.kind === "llm").length, EVAL_SUITE_IDS.length);
assert.deepEqual(missingJudgeSuites(defaults), []);

for (const suiteId of EVAL_SUITE_IDS) {
  const judge = defaults.find((item) => item.id === judgeIdForSuite(suiteId));
  assert.ok(judge, `missing judge for ${suiteId}`);
  assert.equal(judge?.kind, "llm");
  assert.equal(judge?.enabled, true);
  assert.deepEqual(judge?.suiteIds, [suiteId]);
}

const mathOnly = evaluatorsForSuite(defaults, "math");
assert.ok(mathOnly.some((item) => item.id === "code-scaffold"));
assert.ok(mathOnly.some((item) => item.id === "llm-judge-math"));
assert.equal(mathOnly.filter((item) => item.kind === "llm").length, 1);
assert.ok(!mathOnly.some((item) => item.id === "llm-judge-physics"));

const physicsOnly = evaluatorsForSuite(defaults, "physics");
assert.ok(physicsOnly.some((item) => item.id === "llm-judge-physics"));
assert.ok(!physicsOnly.some((item) => item.id === "llm-judge-math"));

const custom = parseEvaluator({
  id: "llm-strict",
  kind: "llm",
  name: "Strict judge",
  enabled: true,
  suiteIds: ["chemistry"],
  config: { passThreshold: 0.9, prompt: "Be strict." },
});
assert.equal(custom.kind, "llm");
assert.deepEqual(custom.suiteIds, ["chemistry"]);
assert.equal(custom.config.passThreshold, 0.9);
assert.equal(custom.builtin, false);

assert.deepEqual(missingJudgeSuites([custom]), EVAL_SUITE_IDS.filter((id) => id !== "chemistry"));

assert.throws(() => parseEvaluator({ id: "x", kind: "magic", name: "Nope" }));

console.log("evaluator tests passed");
