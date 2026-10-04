import assert from "node:assert/strict";
import {
  classificationFromJev,
  heuristicClassify,
  JEV_NOUL_THRESHOLDS,
  mergeClassifications,
} from "./classify";
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

const jevHarm = classificationFromJev({
  answers: {
    disappointment: { type: "noul", noul: 0.1 },
    self_harm: { type: "noul", noul: 0.92 },
    distress: { type: "noul", noul: 0.2 },
    escalate: { type: "noul", noul: 0.88 },
    severity: { type: "score", score: 3, confidence: 0.9 },
  },
  studentText: "I want to give up on life.",
});
assert.equal(jevHarm.hit, true);
assert.ok(jevHarm.categories.includes("self_harm"));
assert.equal(jevHarm.severity, "critical");
assert.equal(jevHarm.source, "jev");
assert.match(jevHarm.reason, /self-harm/);

const jevOrdinary = classificationFromJev({
  answers: {
    disappointment: { type: "noul", noul: JEV_NOUL_THRESHOLDS.disappointment - 0.1 },
    self_harm: { type: "noul", noul: 0.05 },
    distress: { type: "noul", noul: 0.1 },
    escalate: { type: "noul", noul: 0.05 },
  },
  studentText: "This kinematics question is hard.",
});
assert.equal(jevOrdinary.hit, false);
assert.deepEqual(jevOrdinary.categories, []);

const mergedJev = mergeClassifications(ordinary, jevHarm);
assert.equal(mergedJev.source, "jev");
assert.ok(mergedJev.categories.includes("self_harm"));

console.log("guardrail classify tests passed");
