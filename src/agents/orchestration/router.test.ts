import assert from "node:assert/strict";
import {
  applyRoutingConsistency,
  decisionFromJevRouting,
  heuristicRoute,
  ROUTING_JEV_MIN_CONFIDENCE,
} from "./router";
import { ROUTING_PROMPT_VERSION } from "./prompts";

const sure = { type: "choice" as const, confidence: 0.91, probabilities: {} };

const physics = decisionFromJevRouting({
  answers: {
    intent: { ...sure, choice: "teaching" },
    subject: { ...sure, choice: "physics" },
    agent: { ...sure, choice: "math" },
    gradeLevel: { ...sure, choice: "secondary" },
  },
  profileGrade: "secondary",
});
assert.equal(physics?.agent, "physics");
assert.equal(physics?.intent, "teaching");
assert.equal(physics?.subject, "physics");
assert.ok((physics?.confidence ?? 0) >= ROUTING_JEV_MIN_CONFIDENCE);

const quiz = decisionFromJevRouting({
  answers: {
    intent: { ...sure, choice: "testing" },
    subject: { ...sure, choice: "physics" },
    agent: { ...sure, choice: "physics" },
  },
  profileGrade: "jc",
});
assert.equal(quiz?.agent, "testing");
assert.equal(quiz?.intent, "testing");
assert.equal(quiz?.gradeLevel, "jc");

const unclear = decisionFromJevRouting({
  answers: {
    intent: { type: "choice", choice: "teaching", confidence: 0.4, probabilities: {} },
    subject: { type: "choice", choice: "math", confidence: 0.4, probabilities: {} },
    agent: { type: "choice", choice: "math", confidence: 0.4, probabilities: {} },
  },
  profileGrade: "primary",
});
assert.equal(unclear?.agent, "orchestration");
assert.equal(unclear?.intent, "general");
assert.equal(unclear?.subject, "none");
assert.match(unclear?.rationale ?? "", /unsure/);

assert.equal(
  decisionFromJevRouting({
    answers: {
      intent: { ...sure, choice: "not-an-intent" },
      subject: { ...sure, choice: "math" },
      agent: { ...sure, choice: "math" },
    },
    profileGrade: "secondary",
  }),
  null,
);

const greeting = applyRoutingConsistency({
  intent: "general",
  subject: "math",
  agent: "math",
  gradeLevel: "secondary",
  confidence: 0.88,
  rationale: "greeting",
});
assert.equal(greeting.agent, "orchestration");
assert.equal(greeting.subject, "none");

const keyword = heuristicRoute("quiz me on waves", "secondary");
assert.equal(keyword.agent, "testing");
assert.equal(keyword.intent, "testing");
assert.equal(keyword.promptVersion, ROUTING_PROMPT_VERSION);

console.log("orchestration router tests passed");
