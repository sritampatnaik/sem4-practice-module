import assert from "node:assert/strict";
import { test } from "node:test";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { mathGuardrails, normaliseMathReply } from "./guardrails";
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
  assert.equal(normaliseMathReply('Drawn: <svg viewBox="0 0 10 10"><path d="M0 0"/></svg> done.'), "Drawn: done.");
});

test("an image cut off before it closes is still stripped", () => {
  // The baseline run produced exactly this: a self-drawn graph truncated mid-way.
  assert.equal(
    normaliseMathReply("The curve has two branches.\n\n![y = 1/x](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcv"),
    "The curve has two branches.",
  );
  assert.equal(normaliseMathReply("See data:image/png;base64,iVBORw0KGgo= above."), "See above.");
  assert.equal(normaliseMathReply('Here: <svg viewBox="0 0 10 10"><path d="M0 0 L1 1'), "Here:");
  assert.match(normaliseMathReply("![graph](data:image/svg+xml;base64,PHN2"), /incomplete/);
});

type Middleware = Required<typeof mathGuardrails>;
const stop = { unified: "stop", raw: "stop" } as const;
const length = { unified: "length", raw: "length" } as const;
const usage = {} as never;

test("a reply stopped by the length cap says it was cut short", async () => {
  const generate = mathGuardrails.wrapGenerate as Middleware["wrapGenerate"];
  const run = (finishReason: typeof stop | typeof length) =>
    generate({
      doGenerate: async () => ({ content: [{ type: "text", text: "Step 1: expand" }], finishReason, usage, warnings: [] }),
    } as never);

  const finished = await run(stop);
  assert.deepEqual(finished.content.map((part) => (part.type === "text" ? part.text : "")), ["Step 1: expand"]);

  const cut = await run(length);
  const texts = cut.content.map((part) => (part.type === "text" ? part.text : ""));
  assert.equal(texts[0], "Step 1: expand");
  assert.match(texts[1], /cut short/);
});

test("streamed replies are repaired, and a capped stream says it was cut short", async () => {
  const stream = mathGuardrails.wrapStream as Middleware["wrapStream"];
  const collect = async (finishReason: typeof stop | typeof length) => {
    const parts: LanguageModelV3StreamPart[] = [
      { type: "text-start", id: "t" },
      { type: "text-delta", id: "t", delta: "Here ![g](data:image/svg" },
      { type: "text-delta", id: "t", delta: "+xml;base64,PHN2" },
      { type: "text-end", id: "t" },
      { type: "finish", finishReason, usage },
    ];
    const result = await stream({
      doStream: async () => ({
        stream: new ReadableStream<LanguageModelV3StreamPart>({
          start(controller) {
            parts.forEach((part) => controller.enqueue(part));
            controller.close();
          },
        }),
      }),
    } as never);
    const out: LanguageModelV3StreamPart[] = [];
    const reader = result.stream.getReader();
    for (let next = await reader.read(); !next.done; next = await reader.read()) out.push(next.value);
    return out
      .filter((part): part is Extract<LanguageModelV3StreamPart, { type: "text-delta" }> => part.type === "text-delta")
      .map((part) => part.delta);
  };

  assert.deepEqual(await collect(stop), ["Here"]);
  const cut = await collect(length);
  assert.equal(cut[0], "Here");
  assert.match(cut[1], /cut short/);
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
  // Questions about the paper still go to the documents first.
  assert.equal(requiredFirstStepTool(userTurn("How many marks is Paper 2 worth?")), "documentSearch");
});

test("Math instructions carry the teaching and examination rules", () => {
  const prompt = buildMathInstructions({ sessionId: "test", profile: DEFAULT_PROFILE, recentChats: [] });
  assert.match(prompt, /Name the method/);
  assert.match(prompt, /LaTeX/);
  assert.match(prompt, /Respect the tool's limits/);
  assert.match(prompt, /Examination alignment/);
  assert.match(prompt, /does not replace the explanation/);
  assert.match(prompt, /Testing/);
  assert.match(prompt, /Every graph comes from the graph tool/);
});
