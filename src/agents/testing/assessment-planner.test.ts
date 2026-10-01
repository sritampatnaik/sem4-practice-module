import assert from "node:assert/strict";
import test from "node:test";
import { buildAssessmentPlan, buildMermaidDiagram, deriveDifficulty, extractAssessmentTopics } from "./assessment-planner";

test("planner defaults to mcq, detects flashcards, and marks visual requests", () => {
  const mcqPlan = buildAssessmentPlan({
    request: "Quiz me on differentiation.",
    gradeLevel: "secondary",
  });
  const flashcardPlan = buildAssessmentPlan({
    request: "Make flashcards on acids and bases with a simple diagram.",
    gradeLevel: "secondary",
  });

  assert.equal(mcqPlan.mode, "mcq");
  assert.equal(mcqPlan.visualFormat, "none");
  assert.equal(flashcardPlan.mode, "flashcards");
  assert.equal(flashcardPlan.visualFormat, "mermaid");
  assert.equal(flashcardPlan.needsVisual, true);
});

test("planner topic extraction keeps useful topics and drops prompt filler", () => {
  assert.deepEqual(
    extractAssessmentTopics("Give me five O-Level MCQs on speed, acceleration, and velocity-time graphs."),
    ["speed", "acceleration", "velocity-time graphs"],
  );
  assert.deepEqual(
    extractAssessmentTopics("Make flashcards on chemical bonding for me please."),
    ["chemical bonding"],
  );
});

test("deriveDifficulty returns standard with no score context", () => {
  assert.equal(deriveDifficulty(undefined), "standard");
});

test("deriveDifficulty returns easier when trend is regressing", () => {
  assert.equal(deriveDifficulty({ trend: "regressing", latestPercentage: 55 }), "easier");
});

test("deriveDifficulty returns easier when percentage is below 60 regardless of trend", () => {
  assert.equal(deriveDifficulty({ trend: "stable", latestPercentage: 45 }), "easier");
  assert.equal(deriveDifficulty({ trend: "new", latestPercentage: 50 }), "easier");
});

test("deriveDifficulty returns harder when improving and percentage is 80 or above", () => {
  assert.equal(deriveDifficulty({ trend: "improving", latestPercentage: 85 }), "harder");
  assert.equal(deriveDifficulty({ trend: "improving", latestPercentage: 80 }), "harder");
});

test("deriveDifficulty returns standard when improving but percentage is below 80", () => {
  assert.equal(deriveDifficulty({ trend: "improving", latestPercentage: 65 }), "standard");
});

test("deriveDifficulty returns standard for stable mid-range score", () => {
  assert.equal(deriveDifficulty({ trend: "stable", latestPercentage: 75 }), "standard");
});

test("buildAssessmentPlan includes difficulty and rationale when score context is regressing", () => {
  const plan = buildAssessmentPlan({
    request: "Quiz me on kinematics.",
    gradeLevel: "secondary",
    scoreContext: { trend: "regressing", latestPercentage: 40 },
  });

  assert.equal(plan.difficulty, "easier");
  assert.match(plan.rationale, /easier/i);
  assert.match(plan.rationale, /regressing/i);
});

test("buildAssessmentPlan includes difficulty standard when no score context", () => {
  const plan = buildAssessmentPlan({
    request: "Quiz me on kinematics.",
    gradeLevel: "secondary",
  });

  assert.equal(plan.difficulty, "standard");
});

test("mermaid builder escapes labels and emits a small graph", () => {
  const diagram = buildMermaidDiagram({
    title: "Bonding map",
    direction: "TB",
    nodes: [
      { id: "Start", label: 'Ionic "bonding"' },
      { id: "End", label: "Electrostatic attraction" },
    ],
    edges: [{ from: "Start", to: "End", label: "forms" }],
  });

  assert.match(diagram, /title: Bonding map/);
  assert.match(diagram, /Start\["Ionic \\"bonding\\""\]/);
  assert.match(diagram, /Start -->\|forms\| End/);
});
