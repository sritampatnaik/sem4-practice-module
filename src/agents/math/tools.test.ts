import assert from "node:assert/strict";
import { equationSolverTool } from "./tools";

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

const roots = (result: ToolResult) =>
  (result.roots as Array<{ value: number }>).map((r) => r.value).sort((a, b) => a - b);

// --- solving ----------------------------------------------------------------

const linear = await call({ expression: "2*x + 3 = 7", mode: "solve" });
assert.equal(linear.ok, true, "linear equations must solve");
assert.deepEqual(roots(linear), [2]);

const linearImplicit = await call({ expression: "3x + 9 = 0", mode: "solve" });
assert.deepEqual(roots(linearImplicit), [-3]);

const quadratic = await call({ expression: "x^2 + 6x + 5 = 0", mode: "solve" });
assert.equal((quadratic.roots as unknown[]).length, 2, "a quadratic must return both roots");
assert.deepEqual(roots(quadratic), [-5, -1]);

const cubic = await call({ expression: "x^3 - 6x^2 + 11x - 6 = 0", mode: "solve" });
assert.deepEqual(roots(cubic), [1, 2, 3]);

// Scale must not swallow valid roots.
const scaled = await call({ expression: "1000000000000*(x^2 - 2) = 0", mode: "solve" });
assert.equal(scaled.ok, true, "a scaled equation must still solve");
assert.equal(scaled.realRootCount, 2);

const noRealRoots = await call({ expression: "x^2 + 4 = 0", mode: "solve" });
assert.equal(noRealRoots.realRootCount, 0);
assert.match(String(noRealRoots.note), /no real solutions/i);

// --- refusals ---------------------------------------------------------------
// Each of these was once answered wrongly; refusing is the fix.

const rational = await call({ expression: "(x^2 - 1)/(x - 1) = 2", mode: "solve" });
assert.equal(rational.ok, false, "must not clear a denominator and invent a root");
assert.equal(rational.reason, "unsupported");
assert.match(String(rational.error), /denominator/i);

const degenerate = await call({ expression: "(x^2 + 1)/(x^2 + 1) = 0", mode: "solve" });
assert.equal(degenerate.ok, false, "must not return complex roots of an undefined expression");

const simultaneous = await call({ expression: "2x + y = 7", mode: "solve" });
assert.equal(simultaneous.ok, false);
assert.match(String(simultaneous.error), /one unknown at a time/i);

const trig = await call({ expression: "sin(x) = 0.5", mode: "solve" });
assert.equal(trig.ok, false);

const quartic = await call({ expression: "x^4 - 1 = 0", mode: "solve" });
assert.equal(quartic.ok, false);

// --- exactness --------------------------------------------------------------

const third = await call({ expression: "1/3" });
assert.equal(third.exact, "1/3");

const sum = await call({ expression: "2/3 + 1/6" });
assert.equal(sum.exact, "5/6");

// A decimal close to 1/3 is not 1/3.
const nearlyThird = await call({ expression: "0.3333333333334" });
assert.equal(nearlyThird.exact, null, "a float must never be reported as an exact fraction");

const irrational = await call({ expression: "sqrt(2)" });
assert.equal(irrational.exact, null);

const whole = await call({ expression: "3/4 * 12" });
assert.equal(whole.result, 9);
assert.equal(whole.exact, null, "integers need no fraction");

// Large numerators must not be rounded through Number.
const big = await call({ expression: "(9007199254740992 + 1)/2" });
assert.notEqual(big.exact, "9007199254740992/2", "bigint precision must not be lost");

// --- undefined results ------------------------------------------------------

for (const expression of ["1/0", "0/0"]) {
  const result = await call({ expression });
  assert.equal(result.ok, false, `${expression} has no value`);
  assert.equal(result.reason, "undefined");
}

const singular = await call({ expression: "sqrt(x)", mode: "derivative", at: 0 });
assert.equal(singular.ok, false, "sqrt(x) is not differentiable at 0");

// Simplifying x/x to 1 hides the hole at x = 0.
const hole = await call({ expression: "x/x", mode: "derivative", at: 0 });
assert.equal(hole.ok, false, "x/x is undefined at 0");
assert.equal(hole.reason, "undefined");

// --- differentiation --------------------------------------------------------

const product = await call({ expression: "x^2 * sin(x)", mode: "derivative" });
assert.match(String(product.derivative), /cos/);

const atPoint = await call({ expression: "x^2", mode: "derivative", at: 3 });
assert.equal((atPoint.evaluatedAt as { value: number }).value, 6);

// --- simplify and misc ------------------------------------------------------

const collected = await call({ expression: "2x + 3x", mode: "simplify" });
assert.match(String(collected.simplified), /5\s*\*?\s*x/);

const surd = await call({ expression: "sqrt(8)", mode: "simplify" });
assert.ok(surd.limitation, "surd results must carry their limitation");

const integration = await call({ expression: "integrate(x^2, x)" });
assert.equal(integration.ok, false, "there is no symbolic integration");

const unknownValue = await call({ expression: "2x + 1" });
assert.equal(unknownValue.ok, false, "cannot evaluate while x is unknown");

const tooLong = await call({ expression: `1 + ${"1 + ".repeat(80)}1` });
assert.equal(tooLong.ok, false, "over-long expressions are refused");

console.log("math equationSolver tests passed");
