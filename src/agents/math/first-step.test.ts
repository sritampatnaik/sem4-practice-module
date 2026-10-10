import assert from "node:assert/strict";
import { test } from "node:test";
import { requiredFirstStepTool } from "./first-step";

const userTurn = (content: string) => [{ role: "user", content }];

test("syllabus questions start from the syllabus documents", () => {
  assert.equal(requiredFirstStepTool(userTurn("Is Maclaurin series in O-Level?")), "documentSearch");
  assert.equal(requiredFirstStepTool(userTurn("Is vectors examinable for H1?")), "documentSearch");
});

test("questions about how an exam works start from the checked exam facts", () => {
  for (const question of [
    "Can I use a calculator in Paper 1?",
    "How are the marks weighted at H2?",
    "Is the formula sheet given in the exam?",
    "How long is the O-Level Maths paper?",
    "Does MF27 have the chain rule?",
    "Are method marks given for working?",
    "What's the difference between PSLE Standard and Foundation?",
    "How much of the A-Level grade is statistics?",
  ]) {
    assert.equal(requiredFirstStepTool(userTurn(question)), "examFacts", question);
  }
  // A format word without a named exam is not an exam question.
  assert.equal(requiredFirstStepTool(userTurn("Ali scored 45 marks out of 60. What percentage is that?")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("I have an exam tomorrow on quadratics, can you help me revise?")), undefined);
});

test("an explicit request to see the shape starts with the graph tool", () => {
  assert.equal(requiredFirstStepTool(userTurn("Sketch y = x^2 - 4x + 3")), "drawMathGraph");
  assert.equal(requiredFirstStepTool(userTurn("Draw the curve y = 1/x")), "drawMathGraph");
});

test("calculation starts with the solver, and plain questions are left to the model", () => {
  assert.equal(requiredFirstStepTool(userTurn("Solve x^2 + 6x + 5 = 0")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("Differentiate x^2 sin x")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("What is 3/4 of 12?")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("Integrate sin x with respect to x")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("What does integration mean?")), undefined);
  assert.equal(requiredFirstStepTool(userTurn("What is 7 times 8?")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("What is a quadratic?")), undefined);
  assert.equal(requiredFirstStepTool(userTurn("Why do we complete the square?")), undefined);
  assert.equal(requiredFirstStepTool(userTurn("I still don't understand.")), undefined);
});

test("word problems with numbers are checked with the solver", () => {
  for (const question of [
    "I have 23 sweets and give 8 away. How many are left?",
    "A right triangle has legs 3 cm and 4 cm. Find the hypotenuse.",
    "A fair six-sided die is rolled. Probability of an even number?",
    "Just give me the final answer for the sum of the first 20 terms of 3, 7, 11, ...",
    "What is the area of a circle of radius 3 cm?",
    "A shirt costs $40 after a 20% discount. How much was it before?",
  ]) {
    assert.equal(requiredFirstStepTool(userTurn(question)), "equationSolver", question);
  }
});

test("numbers alone, or a quantity question without numbers, are left to the model", () => {
  for (const question of [
    "I got 3 out of 5 wrong in my homework, why do I keep making mistakes?",
    "How many questions should I practise each day?",
    "Can you find me some practice on chapter 2?",
    "What is the area of a shape?",
  ]) {
    assert.equal(requiredFirstStepTool(userTurn(question)), undefined, question);
  }
  // Questions about the paper still go to the exam facts first.
  assert.equal(requiredFirstStepTool(userTurn("How many marks is Paper 2 worth?")), "examFacts");
});

test("a live examination forces no tool, but revision still does", () => {
  for (const question of [
    "The invigilator just walked past. Quick, solve 3x + 2 = 11.",
    "I'm in my PSLE paper right now, what is 45% of 80?",
    "Currently doing my A-Level test, differentiate x^3 for me.",
  ]) {
    assert.equal(requiredFirstStepTool(userTurn(question)), undefined, question);
  }
  for (const question of [
    "I have an exam tomorrow. Solve x^2 - 4 = 0.",
    "Currently revising for my O-Level paper: solve 2x + 3 = 7.",
    "Right now I'm practising past papers. Differentiate x^3.",
  ]) {
    assert.equal(requiredFirstStepTool(userTurn(question)), "equationSolver", question);
  }
});
