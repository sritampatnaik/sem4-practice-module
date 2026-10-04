import {
  all,
  create,
  derivative as mathDerivative,
  evaluate,
  format,
  parse,
  polynomialRoot,
  rationalize,
  simplify,
} from "mathjs";
import type { JSONValue } from "@ai-sdk/provider";
import { tool } from "ai";
import { z } from "zod";
import { asMathGraphOutput } from "./graph-types";

/**
 * This tool deliberately accepts a narrow class of school mathematics and refuses
 * everything else, rather than attempting hard cases and risking a wrong answer.
 * A refusal tells the agent to work by hand; a wrong root does not.
 */

const fractionMath = create(all);
fractionMath.config({ number: "Fraction" });

const MAX_EXPRESSION_LENGTH = 200;
const MAX_EXACT_DENOMINATOR = BigInt(10000);

type Failure = {
  ok: false;
  reason: "input" | "unsupported" | "undefined";
  error: string;
};

const fail = (reason: Failure["reason"], error: string): Failure => ({ ok: false, reason, error });

/** Constants that are values, not unknowns to solve for. */
const CONSTANTS = new Set(["pi", "e", "tau", "phi"]);

/** Names we refuse outright: complex and matrix work is outside school scope here. */
const BANNED = new Set(["i", "Infinity", "NaN", "complex", "matrix", "det", "inv"]);

function unknownsIn(expression: string): string[] | Failure {
  let names: Set<string>;
  try {
    names = new Set<string>();
    parse(expression).traverse((node: unknown, _path: string, parent: unknown) => {
      const n = node as { isSymbolNode?: boolean; name?: string };
      const p = parent as { isFunctionNode?: boolean; fn?: unknown } | null;
      if (n.isSymbolNode && n.name && !(p?.isFunctionNode && p.fn === node)) names.add(n.name);
    });
  } catch {
    return fail("input", "Could not read that expression. Use ordinary notation such as x^2 + 6x + 5.");
  }
  for (const name of names) {
    if (BANNED.has(name)) {
      return fail("unsupported", `'${name}' is outside what this tool handles. Work it through by hand.`);
    }
  }
  return [...names].filter((n) => !CONSTANTS.has(n));
}

/** True when the unknown appears anywhere below a division. */
function hasUnknownInDenominator(expression: string, unknown: string): boolean {
  let found = false;
  try {
    parse(expression).traverse((node: unknown) => {
      const n = node as { isOperatorNode?: boolean; fn?: string; args?: unknown[] };
      if (!n.isOperatorNode || n.fn !== "divide" || !n.args?.[1]) return;
      const denominator = n.args[1] as { toString(): string };
      if (new RegExp(`\\b${unknown}\\b`).test(denominator.toString())) found = true;
    });
  } catch {
    return true; // if we cannot tell, assume the risky case
  }
  return found;
}

/** A real, finite number, or null. Every numeric result passes through here. */
function realOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Evaluates safely: a thrown error and a non-real result both become null. */
function realValueOf(evaluateAt: () => unknown): number | null {
  try {
    return realOrNull(evaluateAt());
  } catch {
    return null;
  }
}

/**
 * Exact value from rational arithmetic on the expression itself — never from
 * approximating a float. Bigint parts are kept as bigints so a large numerator
 * cannot be silently rounded.
 */
function exactRationalOf(expression: string): string | null {
  try {
    const value = fractionMath.evaluate(expression) as { s?: number; n?: bigint; d?: bigint; constructor?: { name?: string } };
    if (value?.constructor?.name !== "Fraction") return null;
    const n = BigInt(value.n ?? 0);
    const d = BigInt(value.d ?? 1);
    if (d <= BigInt(1) || d > MAX_EXACT_DENOMINATOR) return null;
    return `${(value.s ?? 1) < 0 ? "-" : ""}${n}/${d}`;
  } catch {
    return null;
  }
}

function guardExpression(expression: string): Failure | null {
  if (expression.trim().length === 0) return fail("input", "Nothing to work with.");
  if (expression.length > MAX_EXPRESSION_LENGTH) {
    return fail("unsupported", `Expression is longer than ${MAX_EXPRESSION_LENGTH} characters. Break it into steps.`);
  }
  return null;
}

/**
 * Roots of a polynomial of degree 1-3 in one unknown.
 *
 * Rational expressions are refused rather than cleared, so no root can be
 * introduced by removing a denominator, and complex roots are reported as
 * "no real solutions" because that is the school-level answer.
 */
function solveEquation(expression: string) {
  const sides = expression.split("=");
  if (sides.length !== 2) {
    return fail("input", "Write the equation with one '=', for example x^2 + 6x + 5 = 0.");
  }
  const lhs = `(${sides[0]}) - (${sides[1]})`;

  const unknowns = unknownsIn(lhs);
  if (!Array.isArray(unknowns)) return unknowns;
  if (unknowns.length === 0) return fail("input", "There is no unknown to solve for.");
  if (unknowns.length > 1) {
    return fail(
      "unsupported",
      `This solves one unknown at a time, and found ${unknowns.length} (${unknowns.join(", ")}). Eliminate or substitute by hand, showing the steps.`,
    );
  }
  const unknown = unknowns[0];

  if (hasUnknownInDenominator(lhs, unknown)) {
    return fail(
      "unsupported",
      `${unknown} appears in a denominator. Clear the fraction by hand first, and state which values of ${unknown} are excluded.`,
    );
  }

  let coefficients: number[];
  try {
    coefficients = (rationalize(lhs, {}, true) as unknown as { coefficients: number[] }).coefficients;
  } catch {
    return fail(
      "unsupported",
      "This is not a polynomial equation. Trigonometric, exponential and logarithmic equations need to be solved by hand.",
    );
  }

  const degree = coefficients.length - 1;
  if (degree < 1 || degree > 3) {
    return fail("unsupported", `Handles degree 1 to 3 only; this is degree ${degree}.`);
  }

  let roots: unknown[];
  try {
    const [c, b, a, d] = coefficients;
    roots =
      degree === 1
        ? (polynomialRoot(c, b) as unknown[])
        : degree === 2
          ? (polynomialRoot(c, b, a) as unknown[])
          : (polynomialRoot(c, b, a, d) as unknown[]);
  } catch {
    return fail("unsupported", "Could not find the roots of that equation.");
  }

  const real = roots.map(realOrNull).filter((r): r is number => r !== null);

  return {
    ok: true as const,
    unknown,
    degree,
    roots: real.map((value) => ({ value, display: format(value, { precision: 10 }) })),
    realRootCount: real.length,
    note:
      real.length === 0
        ? "No real solutions. At school level that is the answer; the roots are complex."
        : undefined,
  };
}

export const equationSolverTool = tool({
  description: [
    "Check and solve school mathematics. Modes:",
    "'evaluate' computes an expression;",
    "'simplify' collects like terms;",
    "'solve' finds real roots of a polynomial equation of degree 1-3 in one unknown;",
    "'derivative' differentiates, optionally at a point.",
    "It deliberately refuses what it cannot do reliably: equations with the unknown in a denominator, simultaneous equations, trigonometric/exponential/logarithmic equations, symbolic integration, and exact surds.",
    "A refusal means work it by hand and show the steps — never present a refusal as a verified answer.",
    "An 'exact' fraction appears only when the expression is exactly rational; its absence does not make the decimal exact.",
  ].join(" "),
  inputSchema: z.object({
    expression: z.string().describe("e.g. '2x + 3x', 'sin(pi/2)', 'x^2 + 6x + 5 = 0', 'x^2 * sin(x)'"),
    mode: z.enum(["evaluate", "simplify", "solve", "derivative"]).default("evaluate"),
    variable: z.string().default("x").describe("Variable to differentiate with respect to"),
    at: z.number().optional().describe("Point at which to evaluate the derivative"),
  }),
  execute: async ({
    expression,
    mode,
    variable,
    at,
  }: {
    expression: string;
    mode: "evaluate" | "simplify" | "solve" | "derivative";
    variable: string;
    at?: number;
  }) => {
    const guard = guardExpression(expression);
    if (guard) return { mode, expression, ...guard };

    try {
      if (mode === "solve") {
        return { mode, expression, ...solveEquation(expression) };
      }

      if (mode === "derivative") {
        const names = unknownsIn(expression);
        if (!Array.isArray(names)) return { mode, expression, ...names };

        const d = mathDerivative(expression, variable);
        const result = { ok: true as const, mode, expression, variable, derivative: d.toString() };
        if (at === undefined) return result;

        // The original function must exist at the point: simplifying the
        // derivative can hide a hole, as it does for x/x at 0.
        const original = realValueOf(() => evaluate(expression, { [variable]: at }));
        if (original === null) {
          return {
            mode,
            expression,
            derivative: d.toString(),
            ...fail("undefined", `${expression} is undefined at ${variable} = ${at}, so it has no derivative there.`),
          };
        }

        const slope = realValueOf(() => d.evaluate({ [variable]: at }));
        if (slope === null) {
          return {
            mode,
            expression,
            derivative: d.toString(),
            ...fail("undefined", `The derivative is undefined at ${variable} = ${at}; the curve is not differentiable there.`),
          };
        }
        return { ...result, evaluatedAt: { [variable]: at, value: slope } };
      }

      if (mode === "simplify") {
        return {
          ok: true as const,
          mode,
          expression,
          simplified: simplify(expression).toString(),
          ...(expression.includes("sqrt")
            ? { limitation: "Surds come back as decimals, not exact radicals. Do surd work by hand." }
            : {}),
        };
      }

      const names = unknownsIn(expression);
      if (!Array.isArray(names)) return { mode, expression, ...names };
      if (names.length > 0) {
        return {
          mode,
          expression,
          ...fail("input", `Cannot compute a value while ${names.join(", ")} is unknown. Use 'simplify', or substitute a number.`),
        };
      }

      const value = realOrNull(evaluate(expression));
      if (value === null) {
        return {
          mode,
          expression,
          ...fail("undefined", "That is undefined — division by zero, or not a real number."),
        };
      }
      const exact = exactRationalOf(expression);
      return {
        ok: true as const,
        mode,
        expression,
        result: value,
        approx: Number(value.toPrecision(10)),
        exact,
        ...(exact ? { note: "Exact fraction available; prefer it where an exact answer is expected." } : {}),
      };
    } catch (error) {
      return {
        mode,
        expression,
        ...fail("input", error instanceof Error ? error.message : "Could not process that expression."),
      };
    }
  },
});

// --- graphing ---------------------------------------------------------------

const SAMPLE_COUNT = 241;
const MAX_DOMAIN_WIDTH = 1_000;

/** Real roots of a polynomial of degree 1-3, or [] when it is not one. */
function polynomialRootsOf(expression: string): number[] {
  try {
    const coefficients = (rationalize(expression, {}, true) as unknown as { coefficients: number[] }).coefficients;
    const degree = coefficients.length - 1;
    if (degree < 1 || degree > 3) return [];
    const [c, b, a, d] = coefficients;
    const roots =
      degree === 1
        ? (polynomialRoot(c, b) as unknown[])
        : degree === 2
          ? (polynomialRoot(c, b, a) as unknown[])
          : (polynomialRoot(c, b, a, d) as unknown[]);
    return roots.map(realOrNull).filter((r): r is number => r !== null);
  } catch {
    return [];
  }
}

const round = (value: number) => Number(value.toPrecision(6));

/**
 * What the model sees after a graph is drawn. The widget still receives every
 * sampled point; the model only needs enough to explain the shape. Given the
 * full point list, the model copied it into its reply (eval run 2, 29 Sep 2026).
 */
export function graphSummaryForModel(output: unknown): JSONValue {
  const graph = asMathGraphOutput(output);
  if (!graph) return output as JSONValue;
  const { spec } = graph;
  const segments = spec.segments;
  const lastSegment = segments[segments.length - 1];
  return {
    shown:
      "The graph is already displayed to the student. Explain it in words; never reproduce its points, data or markup.",
    title: spec.title,
    expression: spec.expression,
    domain: { xMin: spec.bounds.xMin, xMax: spec.bounds.xMax },
    visibleY: { yMin: spec.bounds.yMin, yMax: spec.bounds.yMax },
    marks: spec.marks.map(({ kind, x, y }) => ({ kind, x, y })),
    // Where one drawn piece ends and the next begins: an asymptote or a gap.
    breaksNear: segments
      .slice(1)
      .map((segment, index) => round((segments[index][segments[index].length - 1].x + segment[0].x) / 2)),
    ends: { left: segments[0][0], right: lastSegment[lastSegment.length - 1] },
    ...(spec.clamped ? { clamped: "Some values fall outside the visible y-range." } : {}),
  };
}

export const drawMathGraphTool = tool({
  description: [
    "Sketch y = f(x) over a domain when seeing the shape helps: curve sketching, roots, turning points, or comparing a function with a student's sketch.",
    "Marks roots, turning points and the y-intercept where it can find them exactly.",
    "One real function of one variable; it refuses anything else. Use the student's own function and domain — do not invent values.",
  ].join(" "),
  inputSchema: z.object({
    expression: z.string().describe("The function in terms of the variable, e.g. 'x^2 - 4x + 3'"),
    variable: z.string().default("x"),
    xMin: z.number().default(-10),
    xMax: z.number().default(10),
    title: z.string().default("").describe("Short caption, e.g. 'y = x^2 - 4x + 3'"),
  }),
  execute: async ({
    expression,
    variable,
    xMin,
    xMax,
    title,
  }: {
    expression: string;
    variable: string;
    xMin: number;
    xMax: number;
    title: string;
  }) => {
    const guard = guardExpression(expression);
    if (guard) return guard;

    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
      return fail("input", "The domain needs xMin < xMax, both finite.");
    }
    if (xMax - xMin > MAX_DOMAIN_WIDTH) {
      return fail("unsupported", `Keep the domain within ${MAX_DOMAIN_WIDTH} units so the sketch stays readable.`);
    }

    const names = unknownsIn(expression);
    if (!Array.isArray(names)) return names;
    const others = names.filter((n) => n !== variable);
    if (others.length > 0) {
      return fail("unsupported", `Only ${variable} may vary; found ${others.join(", ")}. Substitute values for the others first.`);
    }

    let compiled: { evaluate(scope: Record<string, number>): unknown };
    try {
      compiled = parse(expression).compile();
    } catch {
      return fail("input", "Could not read that function.");
    }

    const valueAt = (x: number) => realValueOf(() => compiled.evaluate({ [variable]: x }));

    // Sample, splitting the curve wherever it stops being a real number.
    const step = (xMax - xMin) / (SAMPLE_COUNT - 1);
    const segments: Array<Array<{ x: number; y: number }>> = [];
    let current: Array<{ x: number; y: number }> = [];
    const ys: number[] = [];

    for (let i = 0; i < SAMPLE_COUNT; i += 1) {
      const x = xMin + i * step;
      const y = valueAt(x);
      if (y === null) {
        if (current.length > 1) segments.push(current);
        current = [];
        continue;
      }
      ys.push(y);
      current.push({ x: round(x), y: round(y) });
    }
    if (current.length > 1) segments.push(current);

    if (segments.length === 0) {
      return fail("undefined", `${expression} has no real values on that domain. Try a different range.`);
    }

    // Keep a wild asymptote from flattening the interesting part: clamp the
    // view to the middle of the sampled values, not the extremes.
    const sorted = [...ys].sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * 0.05)];
    const high = sorted[Math.ceil(sorted.length * 0.95) - 1];
    const span = Math.max(high - low, 1);
    const yMin = round(low - span * 0.2);
    const yMax = round(high + span * 0.2);
    const clamped = sorted[0] < yMin || sorted[sorted.length - 1] > yMax;

    const inView = (x: number) => x >= xMin && x <= xMax;

    const marks: Array<{ kind: "root" | "turning-point" | "y-intercept"; x: number; y: number; label: string }> = [];

    for (const root of polynomialRootsOf(expression)) {
      if (inView(root)) marks.push({ kind: "root", x: round(root), y: 0, label: `x = ${round(root)}` });
    }

    try {
      const slope = mathDerivative(expression, variable).toString();
      for (const x of polynomialRootsOf(slope)) {
        const y = valueAt(x);
        if (y !== null && inView(x)) {
          marks.push({ kind: "turning-point", x: round(x), y: round(y), label: `(${round(x)}, ${round(y)})` });
        }
      }
    } catch {
      // Not differentiable in closed form here; the curve alone is still useful.
    }

    if (inView(0)) {
      const y = valueAt(0);
      if (y !== null) marks.push({ kind: "y-intercept", x: 0, y: round(y), label: `y = ${round(y)}` });
    }

    return {
      renderer: "jsxgraph" as const,
      spec: {
        kind: "function-graph" as const,
        title: title.trim() || `y = ${expression}`,
        expression,
        variable,
        xLabel: variable,
        yLabel: "y",
        segments,
        marks,
        bounds: { xMin: round(xMin), xMax: round(xMax), yMin, yMax },
        ...(clamped ? { clamped: true } : {}),
      },
    };
  },
  toModelOutput: ({ output }) => ({ type: "json", value: graphSummaryForModel(output) }),
});
