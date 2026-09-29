import assert from "node:assert/strict";
import { test } from "node:test";
import { normaliseMathReply } from "./guardrails";
import { buildMathInstructions } from "./prompts";
import { DEFAULT_PROFILE } from "../_shared/types";
import { requiredFirstStepTool } from "./index";

const userTurn = (content: string) => [{ role: "user", content }];

test("abuse and prompt disclosure are replaced, ordinary maths is untouched", () => {
  assert.match(normaliseMathReply("You're an idiot."), /respectful/);
  assert.match(normaliseMathReply("You are the METS Mathematics Agent, a specialist tutor"), /can't share my instructions/);
  assert.equal(normaliseMathReply("The roots are x = 1 and x = 3."), "The roots are x = 1 and x = 3.");
});

test("delimiters are repaired without changing the mathematics", () => {
  assert.equal(normaliseMathReply("  The rule is \\(y = mx + c\\).  "), "The rule is $y = mx + c$.");
  assert.equal(normaliseMathReply("\\[x = 2\\]"), "$$\nx = 2\n$$");
  assert.equal(normaliseMathReply("$$x = 2"), "$$x = 2\n$$");
  assert.equal(normaliseMathReply("```\n\\(keep\\)\n```"), "```\n\\(keep\\)\n```");
  assert.match(normaliseMathReply("  \n  "), /incomplete/);
});

test("model-drawn images are stripped so graphs come from the tool", () => {
  assert.equal(
    normaliseMathReply("Here is the curve. ![parabola](data:image/svg+xml;base64,abc)"),
    "Here is the curve.",
  );
  assert.equal(normaliseMathReply('Look: <img src="http://example.com/graph.png">'), "Look:");
});

test("numbers and working survive repair untouched", () => {
  const worked = "Complete the square: $(x + 3)^2 - 4 = 0$, so $x = -1$ or $x = -5$.";
  assert.equal(normaliseMathReply(worked), worked);
});

test("syllabus and exam questions must start from retrieved evidence", () => {
  assert.equal(requiredFirstStepTool(userTurn("Is Maclaurin series in O-Level?")), "documentSearch");
  assert.equal(requiredFirstStepTool(userTurn("Can I use a calculator in Paper 1?")), "documentSearch");
  assert.equal(requiredFirstStepTool(userTurn("How are the marks weighted at H2?")), "documentSearch");
  assert.equal(requiredFirstStepTool(userTurn("Is the formula sheet given in the exam?")), "documentSearch");
});

test("an explicit request to see the shape starts with the graph tool", () => {
  assert.equal(requiredFirstStepTool(userTurn("Sketch y = x^2 - 4x + 3")), "drawMathGraph");
  assert.equal(requiredFirstStepTool(userTurn("Draw the curve y = 1/x")), "drawMathGraph");
});

test("calculation starts with the solver, and plain questions are left to the model", () => {
  assert.equal(requiredFirstStepTool(userTurn("Solve x^2 + 6x + 5 = 0")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("Differentiate x^2 sin x")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("What is 3/4 of 12?")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("What is 7 times 8?")), "equationSolver");
  assert.equal(requiredFirstStepTool(userTurn("What is a quadratic?")), undefined);
  assert.equal(requiredFirstStepTool(userTurn("Why do we complete the square?")), undefined);
  assert.equal(requiredFirstStepTool(userTurn("I still don't understand.")), undefined);
});

test("Math instructions carry the teaching and examination rules", () => {
  const prompt = buildMathInstructions({ sessionId: "test", profile: DEFAULT_PROFILE, recentChats: [] });
  assert.match(prompt, /Name the method/);
  assert.match(prompt, /LaTeX/);
  assert.match(prompt, /Respect the tool's limits/);
  assert.match(prompt, /Examination alignment/);
  assert.match(prompt, /does not replace the explanation/);
  assert.match(prompt, /Testing/);
});
