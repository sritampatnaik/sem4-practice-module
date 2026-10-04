import assert from "node:assert/strict";
import test from "node:test";
import { drawMathGraphTool, equationSolverTool, graphSummaryForModel } from "./tools";

type ToolResult = Record<string, unknown>;

type CallArgs = {
  expression: string;
  mode?: "evaluate" | "simplify" | "solve" | "derivative";
  variable?: string;
  at?: number;
};

const execute = equationSolverTool.execute as unknown as (
  input: CallArgs,
  options: { toolCallId: string; messages: never[] },
) => Promise<ToolResult>;

const call = (args: CallArgs) =>
  execute({ mode: "evaluate", variable: "x", ...args }, { toolCallId: "test", messages: [] });

type GraphArgs = { expression: string; variable?: string; xMin?: number; xMax?: number; title?: string };

const executeGraph = drawMathGraphTool.execute as unknown as (
  input: GraphArgs,
  options: { toolCallId: string; messages: never[] },
) => Promise<ToolResult>;

const graph = (args: GraphArgs) =>
  executeGraph(
    { variable: "x", xMin: -10, xMax: 10, title: "", ...args },
    { toolCallId: "test", messages: [] },
  );

const roots = (result: ToolResult) =>
  (result.roots as Array<{ value: number }>).map((root) => root.value).sort((a, b) => a - b);

test("solves linear, quadratic and cubic equations in one unknown", async () => {
  const linear = await call({ expression: "2*x + 3 = 7", mode: "solve" });
  assert.equal(linear.ok, true);
  assert.deepEqual(roots(linear), [2]);

  const implicitProduct = await call({ expression: "3x + 9 = 0", mode: "solve" });
  assert.deepEqual(roots(implicitProduct), [-3]);

  const quadratic = await call({ expression: "x^2 + 6x + 5 = 0", mode: "solve" });
  assert.equal((quadratic.roots as unknown[]).length, 2, "a quadratic returns both roots");
  assert.deepEqual(roots(quadratic), [-5, -1]);

  const cubic = await call({ expression: "x^3 - 6x^2 + 11x - 6 = 0", mode: "solve" });
  assert.deepEqual(roots(cubic), [1, 2, 3]);
});

test("scale does not swallow valid roots", async () => {
  const scaled = await call({ expression: "1000000000000*(x^2 - 2) = 0", mode: "solve" });
  assert.equal(scaled.ok, true);
  assert.equal(scaled.realRootCount, 2);
});

test("reports no real solutions rather than complex roots", async () => {
  const result = await call({ expression: "x^2 + 4 = 0", mode: "solve" });
  assert.equal(result.realRootCount, 0);
  assert.match(String(result.note), /no real solutions/i);
});

test("refuses equations it cannot solve reliably", async () => {
  // Clearing this denominator used to produce x = 1, where the equation is undefined.
  const rational = await call({ expression: "(x^2 - 1)/(x - 1) = 2", mode: "solve" });
  assert.equal(rational.ok, false);
  assert.equal(rational.reason, "unsupported");
  assert.match(String(rational.error), /denominator/i);

  const degenerate = await call({ expression: "(x^2 + 1)/(x^2 + 1) = 0", mode: "solve" });
  assert.equal(degenerate.ok, false);

  const simultaneous = await call({ expression: "2x + y = 7", mode: "solve" });
  assert.equal(simultaneous.ok, false);
  assert.match(String(simultaneous.error), /one unknown at a time/i);

  const trigonometric = await call({ expression: "sin(x) = 0.5", mode: "solve" });
  assert.equal(trigonometric.ok, false);

  const quartic = await call({ expression: "x^4 - 1 = 0", mode: "solve" });
  assert.equal(quartic.ok, false);
});

test("exact values come from rational arithmetic, never from a float", async () => {
  const third = await call({ expression: "1/3" });
  assert.equal(third.exact, "1/3");

  const sum = await call({ expression: "2/3 + 1/6" });
  assert.equal(sum.exact, "5/6");

  const nearlyThird = await call({ expression: "0.3333333333334" });
  assert.equal(nearlyThird.exact, null, "a decimal close to 1/3 is not 1/3");

  const irrational = await call({ expression: "sqrt(2)" });
  assert.equal(irrational.exact, null);

  const whole = await call({ expression: "3/4 * 12" });
  assert.equal(whole.result, 9);
  assert.equal(whole.exact, null, "integers need no fraction");

  const big = await call({ expression: "(9007199254740992 + 1)/2" });
  assert.notEqual(big.exact, "9007199254740992/2", "bigint precision must survive");
});

test("undefined results are failures, not values", async () => {
  for (const expression of ["1/0", "0/0"]) {
    const result = await call({ expression });
    assert.equal(result.ok, false, `${expression} has no value`);
    assert.equal(result.reason, "undefined");
  }

  const singular = await call({ expression: "sqrt(x)", mode: "derivative", at: 0 });
  assert.equal(singular.ok, false, "sqrt(x) is not differentiable at 0");

  // Simplifying x/x to 1 hides the hole at x = 0.
  const hole = await call({ expression: "x/x", mode: "derivative", at: 0 });
  assert.equal(hole.ok, false);
  assert.equal(hole.reason, "undefined");
});

test("differentiates, and evaluates a derivative at a point", async () => {
  const product = await call({ expression: "x^2 * sin(x)", mode: "derivative" });
  assert.match(String(product.derivative), /cos/);

  const atPoint = await call({ expression: "x^2", mode: "derivative", at: 3 });
  assert.equal((atPoint.evaluatedAt as { value: number }).value, 6);
});

test("simplifies, and is honest about surds and integration", async () => {
  const collected = await call({ expression: "2x + 3x", mode: "simplify" });
  assert.match(String(collected.simplified), /5\s*\*?\s*x/);

  const surd = await call({ expression: "sqrt(8)", mode: "simplify" });
  assert.ok(surd.limitation, "surd results carry their limitation");

  const integration = await call({ expression: "integrate(x^2, x)" });
  assert.equal(integration.ok, false, "there is no symbolic integration");
});

test("guards its inputs", async () => {
  const unknownValue = await call({ expression: "2x + 1" });
  assert.equal(unknownValue.ok, false, "cannot evaluate while x is unknown");

  const tooLong = await call({ expression: `1 + ${"1 + ".repeat(80)}1` });
  assert.equal(tooLong.ok, false);
});

test("sketches a quadratic, marking roots, turning point and intercept", async () => {
  const result = await graph({ expression: "x^2 - 4x + 3" });
  assert.equal(result.renderer, "jsxgraph");

  const spec = result.spec as {
    segments: Array<Array<{ x: number; y: number }>>;
    marks: Array<{ kind: string; x: number; y: number }>;
  };
  assert.ok(spec.segments.length >= 1, "a parabola is one continuous piece");

  const rootXs = spec.marks
    .filter((mark) => mark.kind === "root")
    .map((mark) => mark.x)
    .sort((a, b) => a - b);
  assert.deepEqual(rootXs, [1, 3]);

  const turning = spec.marks.find((mark) => mark.kind === "turning-point");
  assert.equal(turning?.x, 2);
  assert.equal(turning?.y, -1);

  assert.equal(spec.marks.find((mark) => mark.kind === "y-intercept")?.y, 3);
});

test("breaks the curve at a pole instead of drawing through it", async () => {
  const result = await graph({ expression: "1/x", xMin: -5, xMax: 5 });
  const spec = result.spec as { segments: unknown[]; bounds: { yMin: number; yMax: number } };
  assert.ok(spec.segments.length >= 2, "1/x has two branches");
  assert.ok(
    spec.bounds.yMax < 100 && spec.bounds.yMin > -100,
    "the view is trimmed rather than dominated by the asymptote",
  );
});

test("the model gets a short graph summary, not the plotted points", async () => {
  const result = await graph({ expression: "1/x", xMin: -10, xMax: 10 });
  const summary = graphSummaryForModel(result) as Record<string, unknown>;
  assert.equal("segments" in summary, false, "no point list reaches the model");
  assert.match(String(summary.shown), /already displayed/);
  const breaks = summary.breaksNear as number[];
  assert.equal(breaks.length, 1);
  assert.ok(Math.abs(breaks[0]) < 0.1, "the break sits at the asymptote x = 0");
  assert.ok(JSON.stringify(summary).length < 1000, "small enough that copying it is harmless");

  const quadratic = graphSummaryForModel(await graph({ expression: "x^2 - 4x + 3" })) as Record<string, unknown>;
  assert.deepEqual(quadratic.breaksNear, []);
  assert.ok((quadratic.marks as Array<{ kind: string }>).some((mark) => mark.kind === "turning-point"));

  const refusal = await graph({ expression: "x + y" });
  assert.deepEqual(graphSummaryForModel(refusal), refusal, "a refusal reaches the model unchanged");
});

test("refuses graphs it cannot draw honestly", async () => {
  assert.equal((await graph({ expression: "x + y" })).ok, false, "only one variable may vary");
  assert.equal((await graph({ expression: "x^2", xMin: 5, xMax: 5 })).ok, false, "empty domain");
  assert.equal((await graph({ expression: "x^2", xMin: -100000, xMax: 100000 })).ok, false, "domain too wide");
  assert.equal(
    (await graph({ expression: "sqrt(x - 100)", xMin: -10, xMax: 10 })).ok,
    false,
    "nothing real to plot there",
  );
});
