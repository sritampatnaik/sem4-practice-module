import assert from "node:assert/strict";
import test from "node:test";
import { buildTestingInstructions, TESTING_PROMPT_VERSION } from "./prompts";
import {
  buildChemistryAssessmentSource,
  buildMathAssessmentSource,
  buildPhysicsAssessmentSource,
  selectAssessmentSourceTool,
} from "./subject-source";
import {
  getChemistryAssessmentSourceTool,
  getMathAssessmentSourceTool,
  getPhysicsAssessmentSourceTool,
} from "./tools";
import { DEFAULT_PROFILE, type AgentRuntimeContext } from "../_shared/types";

const ctx: AgentRuntimeContext = {
  sessionId: "testing-source",
  profile: DEFAULT_PROFILE,
  recentChats: [],
};

test("prompt version and source-tool grounding", () => {
  assert.equal(TESTING_PROMPT_VERSION, "1.6.0");
  const instructions = buildTestingInstructions(ctx);
  assert.match(instructions, /getMathAssessmentSource/);
  assert.match(instructions, /getPhysicsAssessmentSource/);
  assert.match(instructions, /getChemistryAssessmentSource/);
  assert.doesNotMatch(
    instructions,
    /documentSearchMath or documentSearchChemistry tool before claiming a topic is in-syllabus/,
  );
});

test("first-step source tool follows the named subject", () => {
  assert.equal(
    selectAssessmentSourceTool("Give me five O-Level kinematics MCQs."),
    "getPhysicsAssessmentSource",
  );
  assert.equal(
    selectAssessmentSourceTool("Quiz me on differentiation, H2."),
    "getMathAssessmentSource",
  );
  assert.equal(
    selectAssessmentSourceTool("Give me three Primary school MCQs on fractions."),
    "getMathAssessmentSource",
  );
  assert.equal(
    selectAssessmentSourceTool("Flashcards on chemical bonding."),
    "getChemistryAssessmentSource",
  );
  assert.equal(selectAssessmentSourceTool("Quiz me on science."), undefined);
});

test("math source pack returns outcomes for a supported JC topic", async () => {
  const pack = await buildMathAssessmentSource({
    request: "Quiz me on differentiation, H2.",
    gradeLevel: "jc",
    requestedCount: 5,
  });

  assert.equal(pack.subject, "math");
  assert.equal(pack.gradeLevel, "jc");
  assert.equal(pack.supported, true);
  assert.ok(pack.learningOutcomes.length > 0);
  assert.ok(pack.learningOutcomes.some((outcome) => /differentiat|calculus/i.test(outcome)));
  assert.ok(pack.sourceChunks.some((chunk) => chunk.score > 0));
  assert.ok(pack.keyConcepts.some((concept) => /differentiat|calculus/i.test(concept)));
  assert.ok(pack.formulaHints.length > 0);
  assert.ok(pack.misconceptionSeeds.some((seed) => /differentiat|integrat/i.test(seed)));
  assert.ok(pack.questionAngles.length > 0);
});

test("chemistry source pack returns outcomes for supported bonding", async () => {
  const pack = await buildChemistryAssessmentSource({
    request: "Flashcards on chemical bonding.",
    gradeLevel: "secondary",
  });

  assert.equal(pack.subject, "chemistry");
  assert.equal(pack.gradeLevel, "secondary");
  assert.equal(pack.supported, true);
  assert.ok(pack.learningOutcomes.length > 0);
  assert.ok(pack.learningOutcomes.some((outcome) => /bond/i.test(outcome)));
  assert.equal(
    pack.learningOutcomes.some((outcome) => /never taste chemicals/i.test(outcome)),
    false,
  );
  assert.ok(pack.sourceChunks.some((chunk) => chunk.score > 0));
  assert.ok(pack.keyConcepts.some((concept) => /bond/i.test(concept)));
  assert.ok(pack.formulaHints.length > 0);
  assert.ok(pack.misconceptionSeeds.some((seed) => /ionic|covalent|metallic/i.test(seed)));
  assert.ok(pack.questionAngles.length > 0);
});

test("physics source pack returns outcomes for supported kinematics", async () => {
  const pack = await buildPhysicsAssessmentSource({
    request: "Give me five O-Level kinematics MCQs.",
    gradeLevel: "secondary",
    requestedCount: 5,
  });

  assert.equal(pack.subject, "physics");
  assert.equal(pack.gradeLevel, "secondary");
  assert.equal(pack.supported, true);
  assert.ok(pack.learningOutcomes.length > 0);
  assert.ok(
    pack.learningOutcomes.some((outcome) => /kinematic|velocity|acceleration|speed/i.test(outcome)),
  );
  assert.ok(pack.sourceChunks.some((chunk) => chunk.score > 0));
  assert.ok(pack.keyConcepts.length > 0);
  assert.ok(pack.formulaHints.length > 0);
  assert.ok(pack.misconceptionSeeds.length > 0);
  assert.ok(pack.questionAngles.length > 0);
});

test("weak syllabus matches fail closed instead of inventing outcomes", async () => {
  const mathPack = await buildMathAssessmentSource({
    request: "Quiz me on quantum gastronomy xyzzyplugh.",
    gradeLevel: "jc",
  });
  const chemPack = await buildChemistryAssessmentSource({
    request: "Flashcards on quantum gastronomy xyzzyplugh.",
    gradeLevel: "secondary",
  });
  const physicsPack = await buildPhysicsAssessmentSource({
    request: "Quiz me on quantum gastronomy xyzzyplugh.",
    gradeLevel: "secondary",
  });

  assert.equal(mathPack.supported, false);
  assert.deepEqual(mathPack.learningOutcomes, []);
  assert.deepEqual(mathPack.keyConcepts, []);
  assert.deepEqual(mathPack.formulaHints, []);
  assert.deepEqual(mathPack.misconceptionSeeds, []);
  assert.deepEqual(mathPack.questionAngles, []);
  assert.match(mathPack.supportReason, /No strong Maths syllabus match/i);

  assert.equal(chemPack.supported, false);
  assert.deepEqual(chemPack.learningOutcomes, []);
  assert.deepEqual(chemPack.keyConcepts, []);
  assert.deepEqual(chemPack.formulaHints, []);
  assert.match(chemPack.supportReason, /No strong Chemistry syllabus match/i);

  assert.equal(physicsPack.supported, false);
  assert.deepEqual(physicsPack.learningOutcomes, []);
  assert.deepEqual(physicsPack.keyConcepts, []);
  assert.deepEqual(physicsPack.formulaHints, []);
  assert.match(physicsPack.supportReason, /No strong Physics syllabus match/i);
});

test("source tools expose execute functions", () => {
  assert.equal(typeof getMathAssessmentSourceTool.execute, "function");
  assert.equal(typeof getChemistryAssessmentSourceTool.execute, "function");
  assert.equal(typeof getPhysicsAssessmentSourceTool.execute, "function");
});
