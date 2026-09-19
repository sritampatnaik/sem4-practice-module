import assert from "node:assert/strict";
import { heuristicClassify, mergeClassifications } from "./classify";
import { AGENT_IDS } from "../_shared/types";

assert.equal(
  (AGENT_IDS as readonly string[]).includes("guardrail"),
  false,
  "students must never be routed to guardrail",
);

const harm = heuristicClassify("I don't want to be alive anymore.");
assert.equal(harm.hit, true);
assert.ok(harm.categories.includes("self_harm"));
assert.equal(harm.severity, "critical");
assert.equal(harm.escalate, true);

const disappointment = heuristicClassify("I'm a failure and I'll never pass.");
assert.equal(disappointment.hit, true);
assert.ok(disappointment.categories.includes("disappointment"));
assert.equal(disappointment.severity, "medium");

const distress = heuristicClassify("I am having a panic attack and I can't stop crying.");
assert.equal(distress.hit, true);
assert.ok(distress.categories.includes("distress"));

const ordinary = heuristicClassify("I don't get this kinematics question. Can you show the working?");
assert.equal(ordinary.hit, false);
assert.deepEqual(ordinary.categories, []);

const giveUpOnLife = heuristicClassify("I want to give up on life");
assert.equal(giveUpOnLife.hit, true);
assert.ok(giveUpOnLife.categories.includes("self_harm"));
assert.equal(giveUpOnLife.severity, "critical");
assert.equal(giveUpOnLife.escalate, true);

const giveUpLiving = heuristicClassify("I just want to give up on living.");
assert.equal(giveUpLiving.hit, true);
assert.ok(giveUpLiving.categories.includes("self_harm"));

const giveUpMyLife = heuristicClassify("I want to give up on my life.");
assert.equal(giveUpMyLife.hit, true);
assert.ok(giveUpMyLife.categories.includes("self_harm"));

const giveUpQuestion = heuristicClassify("I give up on this question. What is the next step?");
assert.equal(giveUpQuestion.hit, false);

const merged = mergeClassifications(ordinary, {
  hit: true,
  categories: ["disappointment"],
  severity: "medium",
  reason: "The student sounded crushed after the mock.",
  snippet: "I am so useless after that paper.",
  escalate: true,
  source: "model",
});
assert.equal(merged.hit, true);
assert.deepEqual(merged.categories, ["disappointment"]);

const forceHarm = mergeClassifications(harm, ordinary);
assert.ok(forceHarm.categories.includes("self_harm"));
assert.equal(forceHarm.severity, "critical");

console.log("guardrail classify tests passed");
