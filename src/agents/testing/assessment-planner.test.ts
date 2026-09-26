import assert from "node:assert/strict";
import test from "node:test";
import { buildAssessmentPlan, buildMermaidDiagram, extractAssessmentTopics } from "./assessment-planner";

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
