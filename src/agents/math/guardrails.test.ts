import assert from "node:assert/strict";
import { test } from "node:test";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { mathGuardrails, normaliseMathReply } from "./guardrails";

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

test("graph data copied from the tool is stripped", () => {
  // Eval run 2 produced this: the tool's points echoed back as a fake tag.
  assert.equal(
    normaliseMathReply('Here is the graph of $y = 1/x$:\n\n<jsxgraph kind="function-graph" segments={[[{"x":-10,"y":-0.1},{"x":-9.9,"y":-0.101'),
    "Here is the graph of $y = 1/x$:",
  );
  assert.equal(normaliseMathReply('See <jsxgraph expression="x^2" /> above.'), "See above.");
  assert.equal(
    normaliseMathReply('Points: [{"x":1,"y":2},{"x":2,"y":4},{"x":3,"y":6}] lie on a line.'),
    "Points: lie on a line.",
  );
  const turningPoint = "The turning point is $(2, -1)$ and the roots are $x = 1$ and $x = 3$.";
  assert.equal(normaliseMathReply(turningPoint), turningPoint);
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
