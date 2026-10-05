// Math eval v2: generated cases whose answer key comes from code, not from an LLM.
//
// Each template draws its numbers from a seeded generator and computes the answer with
// mathjs (exact Fraction arithmetic). A spec names the template, the profile and the
// layer; makeGeneratedItem turns it into an EvalItem, in the same spec → builder pattern
// as makeRoutingItem in routing.ts.
//
// Layers (the id prefix carries the layer, because EvalItem has no shared field for it):
//   math-gen-computed-*     literal answer check, mustInclude: [answer]
//   math-gen-exact-*        fraction or surd answers, judge-scored
//   math-gen-hint-*         "Give me a hint, not the answer", mustNotInclude: [answer]
//   math-gen-planted-*      worked solution with one wrong step inserted by code
//   math-gen-consistency-*  one problem asked three ways, one computed answer
//   math-gen-exam-*         exam-style cases (3 s.f., multi-step, log laws), literal check
//   math-holdout-*          held-out computed and exam-style cases, drawn from a different seed.
//                           Never use these to tune the prompt or the tools.
import { all, create } from "mathjs";
import type { StudentProfile } from "@/agents/_shared/types";
import type { EvalItem } from "../types";
import { jcAlex, primaryAlex, secondaryAlex } from "./profiles";

/** A separate mathjs instance, so the agent's solver instance is never touched. */
const exact = create(all, { number: "Fraction" });
/** Floating-point instance for trigonometry and 3 s.f. answers. */
const approx = create(all);

export const DEV_SEED = 20261005;
/** Default held-out seed. Set MATH_HOLDOUT_SEED on the server to redraw at report time. */
export const DEFAULT_HOLDOUT_SEED = 77031;

export function holdoutSeed(): number {
  const raw = typeof process !== "undefined" ? process.env?.MATH_HOLDOUT_SEED : undefined;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed !== DEV_SEED ? parsed : DEFAULT_HOLDOUT_SEED;
}

// ---------- seeded random numbers ----------

export type Rng = () => number;

/** mulberry32: small, fast and deterministic for a given seed. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function int(rng: Rng, lo: number, hi: number) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function pick<T>(rng: Rng, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)];
}

/** Short stable hash (FNV-1a) used to make ids depend on the drawn numbers. */
function shortHash(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 6);
}

// ---------- exact arithmetic helpers ----------

/** Evaluates an expression exactly and returns its decimal string, or undefined if it recurs. */
export function exactDecimal(expression: string): string | undefined {
  const value = exact.evaluate(expression);
  const text = exact.format(value, { fraction: "decimal" });
  return text.includes("(") ? undefined : text;
}

/** Evaluates an expression exactly and returns "a/b" (or "a" when whole). */
export function exactRatio(expression: string): string {
  return exact.format(exact.evaluate(expression), { fraction: "ratio" }).replace(/\/1$/, "");
}

/** Exact square root of an expression whose value is a perfect square, else undefined. */
export function exactSqrt(expression: string): string | undefined {
  const value = Number(exactRatio(expression));
  const root = Math.round(Math.sqrt(value));
  return Number.isInteger(value) && root * root === value ? String(root) : undefined;
}

/** k√s with s square-free, for a positive integer n = k²s. */
export function simplifySurd(n: number): { k: number; s: number; text: string } {
  let k = 1;
  let s = n;
  for (let f = 2; f * f <= s; f += 1) {
    while (s % (f * f) === 0) {
      s /= f * f;
      k *= f;
    }
  }
  const text = s === 1 ? `${k}` : k === 1 ? `√${s}` : `${k}√${s}`;
  return { k, s, text };
}

/**
 * A literal answer the code check can trust: an integer or a short decimal with at least
 * two digits and below 1000 (so no thousands separator), and no more than three
 * significant figures after the point for decimals.
 */
export function isLiteralAnswer(answer: string) {
  if (!/^\d+(\.\d+)?$/.test(answer)) return false;
  const digits = answer.replace(".", "").replace(/^0+/, "");
  if (answer.replace(".", "").length < 2) return false;
  if (Number(answer) >= 1000) return false;
  return !answer.includes(".") || digits.length <= 3;
}

/** Wraps a negative number in brackets for working such as 3 − (−2). */
function signed(value: number) {
  return value < 0 ? `(${value})` : `${value}`;
}

/** "x^3", "2x^3", "x", "3x" for a positive coefficient. */
function term(coefficient: number, power: number) {
  const c = coefficient === 1 ? "" : `${coefficient}`;
  return power === 1 ? `${c}x` : `${c}x^${power}`;
}

/**
 * A value to 3 significant figures, as SEAB asks for non-exact answers. Undefined when the
 * rounding is ambiguous (close to a half), ends in a zero that a reply might drop, or
 * would need standard form.
 */
export function sig3(value: number): string | undefined {
  if (!(value > 0) || value >= 1000) return undefined;
  const text = value.toPrecision(3);
  if (text.includes("e") || (text.includes(".") && text.endsWith("0"))) return undefined;
  const scaled = value / 10 ** (Math.floor(Math.log10(value)) - 2);
  return Math.abs(scaled - Math.floor(scaled) - 0.5) < 0.02 ? undefined : text;
}

// ---------- templates ----------

export type Band = "primary" | "secondary" | "jc";

export type Problem = {
  topic: string;
  band: Band;
  prompt: string;
  /** Computed answer as the reply should write it. */
  answer: string;
  /** Short worked solution, built from the same numbers. */
  working: string;
};

type Template = { topic: string; band: Band; draw: (rng: Rng) => Problem | undefined };

const TRIPLES: ReadonlyArray<[number, number, number]> = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

const NAMES = ["Ali", "Mei Ling", "Ravi", "Siti", "Jun Wei", "Priya"] as const;

export const TEMPLATES = {
  trigTan: {
    topic: "trigonometric ratio (tan)",
    band: "secondary",
    draw: (rng) => {
      const [o, a] = pick(rng, TRIPLES);
      const k = int(rng, 2, 6);
      const adjacent = k * a;
      const answer = exactDecimal(`${adjacent} * ${o} / ${a}`);
      if (!answer) return undefined;
      return {
        topic: "trigonometric ratio (tan)",
        band: "secondary",
        prompt: `In a right-angled triangle, tan θ = ${o}/${a}. The side adjacent to θ is ${adjacent} cm. Find the side opposite θ.`,
        answer,
        working: `tan θ = opposite / adjacent, so opposite = ${adjacent} × ${o}/${a} = ${answer} cm.`,
      };
    },
  },
  trigSin: {
    topic: "trigonometric ratio (sin)",
    band: "secondary",
    draw: (rng) => {
      const [o, a, h] = pick(rng, TRIPLES);
      const k = int(rng, 2, 6);
      const hyp = k * h;
      const opposite = exactDecimal(`${hyp} * ${o} / ${h}`);
      const answer = exactSqrt(`${hyp}^2 - (${hyp} * ${o} / ${h})^2`);
      if (!opposite || !answer) return undefined;
      return {
        topic: "trigonometric ratio (sin)",
        band: "secondary",
        prompt: `In a right-angled triangle, sin θ = ${o}/${h} and the hypotenuse is ${hyp} cm. Find the side adjacent to θ.`,
        answer,
        working: `Opposite = ${hyp} × ${o}/${h} = ${opposite} cm. Adjacent = √(${hyp}² − ${opposite}²) = ${answer} cm (or cos θ = ${a}/${h}).`,
      };
    },
  },
  logEquation: {
    topic: "logarithm equation",
    band: "secondary",
    draw: (rng) => {
      const base = pick(rng, [2, 3, 5]);
      const power = int(rng, 2, base === 2 ? 8 : 4);
      const shift = int(rng, 2, 19);
      const answer = exactDecimal(`${base}^${power} + ${shift}`);
      if (!answer) return undefined;
      return {
        topic: "logarithm equation",
        band: "secondary",
        prompt: `Solve log_${base}(x − ${shift}) = ${power}.`,
        answer,
        working: `x − ${shift} = ${base}^${power}, so x = ${base}^${power} + ${shift} = ${answer}.`,
      };
    },
  },
  expEquation: {
    topic: "exponential equation",
    band: "secondary",
    draw: (rng) => {
      const base = pick(rng, [2, 3]);
      const power = int(rng, 3, base === 2 ? 9 : 5);
      const shift = int(rng, 7, 15);
      const rhs = exactDecimal(`${base}^${power}`);
      const answer = exactDecimal(`${power} + ${shift}`);
      if (!rhs || !answer) return undefined;
      return {
        topic: "exponential equation",
        band: "secondary",
        prompt: `Solve ${base}^(x − ${shift}) = ${rhs}.`,
        answer,
        working: `${rhs} = ${base}^${power}, so x − ${shift} = ${power} and x = ${answer}.`,
      };
    },
  },
  inequalityLargest: {
    topic: "linear inequality",
    band: "secondary",
    draw: (rng) => {
      const a = int(rng, 3, 9);
      const b = int(rng, 2, 30);
      const c = b + a * int(rng, 10, 40) + int(rng, 1, a - 1);
      const bound = exactRatio(`(${c} - ${b}) / ${a}`);
      const answer = String(Math.ceil((c - b) / a) - 1);
      return {
        topic: "linear inequality",
        band: "secondary",
        prompt: `Find the largest integer x that satisfies ${a}x + ${b} < ${c}.`,
        answer,
        working: `${a}x < ${c - b}, so x < ${bound}. The largest integer is ${answer}.`,
      };
    },
  },
  inequalitySmallest: {
    topic: "linear inequality",
    band: "secondary",
    draw: (rng) => {
      const a2 = int(rng, 2, 5);
      const a1 = a2 + int(rng, 2, 4);
      const b1 = int(rng, 3, 20);
      const b2 = int(rng, 10, 60);
      const bound = exactRatio(`(${b1} + ${b2}) / (${a1} - ${a2})`);
      const answer = String(Math.floor((b1 + b2) / (a1 - a2)) + 1);
      return {
        topic: "linear inequality",
        band: "secondary",
        prompt: `Find the smallest integer x that satisfies ${a1}x − ${b1} > ${a2}x + ${b2}.`,
        answer,
        working: `${a1 - a2}x > ${b1 + b2}, so x > ${bound}. The smallest integer is ${answer}.`,
      };
    },
  },
  gradient: {
    topic: "coordinate geometry (gradient)",
    band: "secondary",
    draw: (rng) => {
      const m = int(rng, 10, 19);
      const x1 = int(rng, -5, 5);
      const y1 = int(rng, -9, 9);
      const run = int(rng, 2, 5);
      const x2 = x1 + run;
      const y2 = y1 + m * run;
      const answer = exactDecimal(`(${y2} - (${y1})) / (${x2} - (${x1}))`);
      if (!answer) return undefined;
      return {
        topic: "coordinate geometry (gradient)",
        band: "secondary",
        prompt: `Find the gradient of the line through A(${x1}, ${y1}) and B(${x2}, ${y2}).`,
        answer,
        working: `Gradient = (${y2} − ${signed(y1)}) / (${x2} − ${signed(x1)}) = ${y2 - y1}/${run} = ${answer}.`,
      };
    },
  },
  distance: {
    topic: "coordinate geometry (distance)",
    band: "secondary",
    draw: (rng) => {
      const [dx, dy] = pick(rng, TRIPLES);
      const k = int(rng, 1, 3);
      const x1 = int(rng, -6, 6);
      const y1 = int(rng, -6, 6);
      const x2 = x1 + k * dx;
      const y2 = y1 - k * dy;
      const answer = exactSqrt(`(${x2} - (${x1}))^2 + (${y2} - (${y1}))^2`);
      if (!answer) return undefined;
      return {
        topic: "coordinate geometry (distance)",
        band: "secondary",
        prompt: `Find the distance between P(${x1}, ${y1}) and Q(${x2}, ${y2}).`,
        answer,
        working: `PQ = √(${k * dx}² + ${k * dy}²) = √${(k * dx) ** 2 + (k * dy) ** 2} = ${answer} units.`,
      };
    },
  },
  mean: {
    topic: "mean",
    band: "primary",
    draw: (rng) => {
      const target = int(rng, 30, 80);
      const scores = [0, 1, 2, 3].map(() => target + int(rng, -15, 15));
      const last = 5 * target - scores.reduce((sum, value) => sum + value, 0);
      if (Math.abs(last - target) > 15) return undefined;
      scores.push(last);
      const answer = exactDecimal(`(${scores.join(" + ")}) / 5`);
      if (!answer) return undefined;
      const name = pick(rng, NAMES);
      return {
        topic: "mean",
        band: "primary",
        prompt: `${name} scored ${scores.join(", ")} marks in five spelling tests. What is the average score?`,
        answer,
        working: `Total = ${scores.join(" + ")} = ${5 * target}. Average = ${5 * target} ÷ 5 = ${answer}.`,
      };
    },
  },
  median: {
    topic: "median",
    band: "secondary",
    draw: (rng) => {
      const values = [0, 1, 2, 3, 4, 5].map(() => int(rng, 10, 60));
      const sorted = [...values].sort((x, y) => x - y);
      const answer = exactDecimal(`(${sorted[2]} + ${sorted[3]}) / 2`);
      if (!answer || new Set(values).size !== values.length) return undefined;
      return {
        topic: "median",
        band: "secondary",
        prompt: `Find the median of the data set: ${values.join(", ")}.`,
        answer,
        working: `In order: ${sorted.join(", ")}. The median is (${sorted[2]} + ${sorted[3]}) ÷ 2 = ${answer}.`,
      };
    },
  },
  combinations: {
    topic: "combinations (nCr)",
    band: "jc",
    draw: (rng) => {
      const n = int(rng, 7, 12);
      const r = int(rng, 2, 4);
      const answer = String(exact.combinations(n, r));
      return {
        topic: "combinations (nCr)",
        band: "jc",
        prompt: `A committee of ${r} is chosen from ${n} students. In how many ways can the committee be chosen?`,
        answer,
        working: `Order does not matter: ${n}C${r} = ${answer}.`,
      };
    },
  },
  permutations: {
    topic: "permutations (nPr)",
    band: "jc",
    draw: (rng) => {
      const n = int(rng, 5, 9);
      const r = int(rng, 2, 3);
      const answer = String(exact.permutations(n, r));
      return {
        topic: "permutations (nPr)",
        band: "jc",
        prompt: `In how many ways can ${r} of ${n} different books be arranged in a row on a shelf?`,
        answer,
        working: `Order matters: ${n}P${r} = ${answer}.`,
      };
    },
  },
  percentage: {
    topic: "percentage",
    band: "primary",
    draw: (rng) => {
      const price = 20 * int(rng, 3, 30);
      const percent = pick(rng, [15, 20, 25, 30, 35, 40, 45]);
      const answer = exactDecimal(`${percent} / 100 * ${price}`);
      if (!answer) return undefined;
      return {
        topic: "percentage",
        band: "primary",
        prompt: `A bicycle costs $${price}. During a sale, its price is reduced by ${percent}%. How much money is taken off the price?`,
        answer,
        working: `${percent}% of $${price} = ${percent}/100 × ${price} = $${answer}.`,
      };
    },
  },
  ratio: {
    topic: "ratio",
    band: "primary",
    draw: (rng) => {
      const a = int(rng, 2, 5);
      const b = int(rng, a + 1, 9);
      const total = (a + b) * int(rng, 4, 12);
      const [first, second] = [pick(rng, NAMES), pick(rng, NAMES)];
      if (first === second) return undefined;
      const answer = exactDecimal(`${total} / (${a} + ${b}) * ${b}`);
      if (!answer) return undefined;
      return {
        topic: "ratio",
        band: "primary",
        prompt: `${first} and ${second} share ${total} stickers in the ratio ${a} : ${b}. How many stickers does ${second} get?`,
        answer,
        working: `${a + b} units = ${total}, so 1 unit = ${total / (a + b)}. ${second} gets ${b} units = ${answer}.`,
      };
    },
  },
  apSum: {
    topic: "AP sum",
    band: "jc",
    draw: (rng) => {
      const a = int(rng, 2, 9);
      const d = int(rng, 2, 5);
      const n = int(rng, 8, 16);
      const answer = exactDecimal(`${n} / 2 * (2 * ${a} + (${n} - 1) * ${d})`);
      if (!answer) return undefined;
      return {
        topic: "AP sum",
        band: "jc",
        prompt: `Find the sum of the first ${n} terms of the arithmetic progression ${a}, ${a + d}, ${a + 2 * d}, ...`,
        answer,
        working: `S_${n} = ${n}/2 × (2(${a}) + ${n - 1}(${d})) = ${answer}.`,
      };
    },
  },
  gpSum: {
    topic: "GP sum",
    band: "jc",
    draw: (rng) => {
      const a = int(rng, 2, 7);
      const r = pick(rng, [2, 3]);
      const n = int(rng, 4, r === 2 ? 7 : 5);
      const answer = exactDecimal(`${a} * (${r}^${n} - 1) / (${r} - 1)`);
      if (!answer) return undefined;
      return {
        topic: "GP sum",
        band: "jc",
        prompt: `Find the sum of the first ${n} terms of the geometric progression ${a}, ${a * r}, ${a * r * r}, ...`,
        answer,
        working: `S_${n} = ${a}(${r}^${n} − 1)/(${r} − 1) = ${answer}.`,
      };
    },
  },
  integralQuadratic: {
    topic: "definite integral",
    band: "jc",
    draw: (rng) => {
      const c2 = pick(rng, [3, 6, 9]);
      const c1 = pick(rng, [2, 4, 6]);
      const lower = int(rng, 0, 2);
      const upper = lower + int(rng, 2, 3);
      const F = (x: number) => `(${c2 / 3} * ${x}^3 + ${c1 / 2} * ${x}^2)`;
      const answer = exactDecimal(`${F(upper)} - ${F(lower)}`);
      if (!answer) return undefined;
      return {
        topic: "definite integral",
        band: "jc",
        prompt: `Evaluate the definite integral of (${c2}x^2 + ${c1}x) dx from x = ${lower} to x = ${upper}.`,
        answer,
        working: `Antiderivative ${term(c2 / 3, 3)} + ${term(c1 / 2, 2)}. Value = ${F(upper)} − ${F(lower)} = ${answer}.`,
      };
    },
  },
  integralCubic: {
    topic: "definite integral",
    band: "jc",
    draw: (rng) => {
      const c3 = pick(rng, [4, 8]);
      const c0 = int(rng, 2, 9);
      const lower = int(rng, 0, 1);
      const upper = lower + 2;
      const F = (x: number) => `(${c3 / 4} * ${x}^4 + ${c0} * ${x})`;
      const answer = exactDecimal(`${F(upper)} - ${F(lower)}`);
      if (!answer) return undefined;
      return {
        topic: "definite integral",
        band: "jc",
        prompt: `Evaluate the definite integral of (${c3}x^3 + ${c0}) dx from x = ${lower} to x = ${upper}.`,
        answer,
        working: `Antiderivative ${term(c3 / 4, 4)} + ${term(c0, 1)}. Value = ${F(upper)} − ${F(lower)} = ${answer}.`,
      };
    },
  },
  binomialExact: {
    topic: "binomial probability",
    band: "jc",
    draw: (rng) => {
      const n = int(rng, 2, 5);
      const p = pick(rng, ["0.2", "0.3", "0.4", "0.5", "0.6"]);
      const k = int(rng, 1, n - 1);
      const answer = exactDecimal(`${exact.combinations(n, k)} * ${p}^${k} * (1 - ${p})^${n - k}`);
      if (!answer) return undefined;
      return {
        topic: "binomial probability",
        band: "jc",
        prompt: `X ~ B(${n}, ${p}). Find P(X = ${k}) exactly, as a decimal.`,
        answer,
        working: `P(X = ${k}) = ${n}C${k} (${p})^${k} (${exactDecimal(`1 - ${p}`)})^${n - k} = ${answer}.`,
      };
    },
  },
  binomialAtMostOne: {
    topic: "binomial probability",
    band: "jc",
    draw: (rng) => {
      const n = int(rng, 2, 4);
      const p = pick(rng, ["0.1", "0.2", "0.3", "0.4", "0.5"]);
      const q = exactDecimal(`1 - ${p}`);
      const answer = exactDecimal(`(1 - ${p})^${n} + ${n} * ${p} * (1 - ${p})^${n - 1}`);
      if (!answer || !q) return undefined;
      return {
        topic: "binomial probability",
        band: "jc",
        prompt: `A player wins each round of a game with probability ${p}, independently of other rounds. In ${n} rounds, find the probability of at most one win, as an exact decimal.`,
        answer,
        working: `P(X ≤ 1) = (${q})^${n} + ${n}(${p})(${q})^${n - 1} = ${answer}.`,
      };
    },
  },
  // Exam-style templates: the conventions and multi-step structure of SEAB papers.
  examTrigAngle: {
    topic: "trigonometry to 3 s.f.",
    band: "secondary",
    draw: (rng) => {
      const angle = int(rng, 22, 68);
      if ([30, 45, 60].includes(angle)) return undefined;
      const ab = int(rng, 6, 20);
      const full = approx.evaluate(`${ab} * tan(${angle} deg)`) as number;
      const answer = sig3(full);
      if (!answer) return undefined;
      return {
        topic: "trigonometry to 3 s.f.",
        band: "secondary",
        prompt: `In triangle ABC, angle ABC = 90°, angle BAC = ${angle}° and AB = ${ab} cm. Find the length of BC, giving your answer correct to 3 significant figures.`,
        answer,
        working: `tan ${angle}° = BC / ${ab}, so BC = ${ab} tan ${angle}° = ${full.toFixed(4)}... = ${answer} cm (3 s.f.).`,
      };
    },
  },
  examLogLaws: {
    topic: "logarithm laws",
    band: "secondary",
    draw: (rng) => {
      const a = int(rng, 4, 6);
      const c = int(rng, 1, a - 1);
      const k = 2 ** a - 2 ** c;
      const n = a + c;
      // x(x − k) = 2^n has roots 2^a and −2^c; the negative root is rejected.
      const disc = exactSqrt(`${k}^2 + 4 * 2^${n}`);
      if (!disc) return undefined;
      const answer = exactDecimal(`(${k} + ${disc}) / 2`);
      const rejected = exactDecimal(`(${k} - ${disc}) / 2`);
      if (!answer || !rejected) return undefined;
      return {
        topic: "logarithm laws",
        band: "secondary",
        prompt: `Solve the equation log_2 x + log_2 (x − ${k}) = ${n}.`,
        answer,
        working: `log_2 [x(x − ${k})] = ${n}, so x² − ${k}x − ${2 ** n} = 0, giving x = ${answer} or x = ${rejected}. Reject ${rejected} because log_2 x needs x > 0, so x = ${answer}.`,
      };
    },
  },
  examRatioChange: {
    topic: "ratio before and after",
    band: "primary",
    draw: (rng) => {
      const p = int(rng, 2, 5);
      const q = p + 2 * int(rng, 1, 3);
      const unit = int(rng, 4, 20);
      const given = ((q - p) * unit) / 2;
      const [first, second] = [pick(rng, NAMES), pick(rng, NAMES)];
      if (first === second) return undefined;
      const answer = exactDecimal(`${p} * (2 * ${given} / (${q} - ${p}))`);
      if (!answer) return undefined;
      return {
        topic: "ratio before and after",
        band: "primary",
        prompt: `${first} and ${second} had marbles in the ratio ${p} : ${q}. After ${second} gave ${given} marbles to ${first}, they had the same number of marbles. How many marbles did ${first} have at first?`,
        answer,
        working: `The difference is ${q - p} units. Giving ${given} marbles closes a gap of ${2 * given}, so ${q - p} units = ${2 * given} and 1 unit = ${unit}. ${first} had ${p} units = ${answer} marbles.`,
      };
    },
  },
  examBinomial: {
    topic: "binomial probability to 3 s.f.",
    band: "jc",
    draw: (rng) => {
      const n = int(rng, 8, 15);
      const p = pick(rng, ["0.15", "0.2", "0.25", "0.3", "0.35"]);
      const k = int(rng, 1, 3);
      const terms = Array.from({ length: k + 1 }, (_, r) => `${exact.combinations(n, r)} * ${p}^${r} * (1 - ${p})^${n - r}`);
      const full = Number(exactRatio(terms.join(" + ")).split("/").reduce((x, y) => String(Number(x) / Number(y))));
      const answer = sig3(full);
      if (!answer) return undefined;
      return {
        topic: "binomial probability to 3 s.f.",
        band: "jc",
        prompt: `The probability that a randomly chosen student wears spectacles is ${p}. In a random sample of ${n} students, find the probability that at most ${k} of them wear spectacles, giving your answer to 3 significant figures.`,
        answer,
        working: `X ~ B(${n}, ${p}). P(X ≤ ${k}) = ${full.toFixed(5)}... = ${answer} (3 s.f.).`,
      };
    },
  },
  examArrangement: {
    topic: "arrangements with a restriction",
    band: "jc",
    draw: (rng) => {
      const n = int(rng, 5, 6);
      const together = rng() < 0.5;
      const [all, block] = [approx.factorial(n), approx.factorial(n - 1)];
      const expression = together ? `2 * ${block}` : `${all} - 2 * ${block}`;
      const answer = exactDecimal(expression);
      if (!answer) return undefined;
      return {
        topic: "arrangements with a restriction",
        band: "jc",
        prompt: `${n} people, including Ali and Ben, sit in a row. In how many ways can they sit if Ali and Ben ${together ? "must sit next to each other" : "must not sit next to each other"}?`,
        answer,
        working: together
          ? `Treat Ali and Ben as one unit: ${n - 1}! arrangements, times 2 for their order = ${answer}.`
          : `All arrangements ${n}! minus those with them together 2 × ${n - 1}! = ${answer}.`,
      };
    },
  },
} satisfies Record<string, Template>;

export type TemplateName = keyof typeof TEMPLATES;

/**
 * Draws a problem whose answer passes the literal-answer rules and does not appear in
 * the prompt. Rejected draws are redrawn from the same stream, so the result is still a
 * pure function of the seed.
 */
export function drawProblem(name: TemplateName, rng: Rng): Problem {
  const template: Template = TEMPLATES[name];
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const problem = template.draw(rng);
    if (problem && isLiteralAnswer(problem.answer) && !problem.prompt.includes(problem.answer)) {
      return problem;
    }
  }
  throw new Error(`Template ${name} could not draw a valid problem`);
}

// ---------- specs and builder ----------

const PROFILE: Record<Band, StudentProfile> = {
  primary: primaryAlex,
  secondary: secondaryAlex,
  jc: jcAlex,
};

type GeneratedSpec = {
  id: string;
  title: string;
  prompt: string;
  band: Band;
  contract: string;
  goldReply: string;
  mustInclude?: string[];
  mustNotInclude?: string[];
  requiredTools?: string[];
};

function makeGeneratedItem(spec: GeneratedSpec): EvalItem {
  return {
    id: spec.id,
    suiteId: "math",
    kind: "teaching",
    title: spec.title,
    prompt: spec.prompt,
    profile: PROFILE[spec.band],
    targetAgent: "math",
    scaffold: {
      contract: spec.contract,
      goldReply: spec.goldReply,
      mustInclude: spec.mustInclude,
      mustNotInclude: spec.mustNotInclude,
      requiredTools: spec.requiredTools,
      source: "math-generated",
    },
  };
}

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** One template per topic for the dev set, the other for the held-out set. */
const COMPUTED_PAIRS: ReadonlyArray<[TemplateName, TemplateName]> = [
  ["trigTan", "trigSin"],
  ["logEquation", "expEquation"],
  ["inequalityLargest", "inequalitySmallest"],
  ["gradient", "distance"],
  ["mean", "median"],
  ["combinations", "permutations"],
  ["percentage", "ratio"],
  ["apSum", "gpSum"],
  ["integralQuadratic", "integralCubic"],
  ["binomialExact", "binomialAtMostOne"],
];

function computedItem(problem: Problem, prefix: string, label: string): EvalItem {
  return makeGeneratedItem({
    id: `${prefix}${slug(problem.topic)}-${shortHash(problem.prompt)}`,
    title: `${label}: ${problem.topic}`,
    prompt: problem.prompt,
    band: problem.band,
    contract: `Solve with working and check with equationSolver. The answer, computed by code, is ${problem.answer}${problem.answer.includes(".") && problem.prompt.includes("significant figures") ? " (3 s.f.)" : ""}.`,
    goldReply: problem.working,
    mustInclude: [problem.answer],
    requiredTools: ["equationSolver"],
  });
}

export function buildComputedItems(seed = DEV_SEED): EvalItem[] {
  const rng = seededRng(seed);
  return COMPUTED_PAIRS.map(([name]) => computedItem(drawProblem(name, rng), "math-gen-computed-", "Computed"));
}

export function buildHoldoutItems(seed = holdoutSeed()): EvalItem[] {
  const rng = seededRng(seed);
  const computed = COMPUTED_PAIRS.map(([, name]) => computedItem(drawProblem(name, rng), "math-holdout-", "Held-out"));
  // Exam templates are shared with the dev set, so a held-out draw that repeats a dev prompt is redrawn.
  const devPrompts = new Set(buildExamItems().map((item) => item.prompt));
  const exam = EXAM_TEMPLATES.map((name) => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const problem = drawProblem(name, rng);
      if (!devPrompts.has(problem.prompt)) return computedItem(problem, "math-holdout-exam-", "Held-out exam style");
    }
    throw new Error(`Held-out draw for ${name} keeps repeating the dev set`);
  });
  return [...computed, ...exam];
}

// ---------- exam-style cases ----------

const EXAM_TEMPLATES: TemplateName[] = [
  "examTrigAngle",
  "examLogLaws",
  "examRatioChange",
  "examBinomial",
  "examArrangement",
];

export function buildExamItems(seed = DEV_SEED): EvalItem[] {
  const rng = seededRng(seed + 5);
  return EXAM_TEMPLATES.map((name) => computedItem(drawProblem(name, rng), "math-gen-exam-", "Exam style"));
}

// ---------- exact-form cases (judge-scored) ----------

export function buildExactItems(seed = DEV_SEED): EvalItem[] {
  const rng = seededRng(seed + 1);
  const items: EvalItem[] = [];

  // Surd sum: √(p²s) + √(q²s) = (p + q)√s.
  {
    const s = pick(rng, [2, 3, 5, 6, 7]);
    const p = int(rng, 2, 4);
    const q = int(rng, p + 1, 6);
    const a = p * p * s;
    const b = q * q * s;
    const total = simplifySurd(Number(exactRatio(`(${p} + ${q})^2 * ${s}`)));
    const answer = `${p + q}√${s}`;
    if (total.text !== answer) throw new Error(`Surd check failed: ${total.text} vs ${answer}`);
    items.push(
      makeGeneratedItem({
        id: `math-gen-exact-surd-${shortHash(`${a}+${b}`)}`,
        title: "Exact form: simplify a surd sum (judge-scored)",
        prompt: `Simplify √${a} + √${b}, leaving your answer in surd form.`,
        band: "secondary",
        contract: `Exact answer, computed by code: ${answer} (√${a} = ${p}√${s}, √${b} = ${q}√${s}). A decimal alone is not acceptable.`,
        goldReply: `√${a} = ${p}√${s} and √${b} = ${q}√${s}, so the sum is ${answer}.`,
        requiredTools: ["equationSolver"],
      }),
    );
  }

  // Distance in surd form.
  {
    let dx = 0;
    let dy = 0;
    let surd = simplifySurd(1);
    do {
      dx = int(rng, 2, 6);
      dy = int(rng, 2, 6);
      surd = simplifySurd(Number(exactRatio(`${dx}^2 + ${dy}^2`)));
    } while (surd.s === 1 || surd.k === 1);
    const x1 = int(rng, -4, 4);
    const y1 = int(rng, -4, 4);
    items.push(
      makeGeneratedItem({
        id: `math-gen-exact-distance-${shortHash(`${x1},${y1},${dx},${dy}`)}`,
        title: "Exact form: distance as a surd (judge-scored)",
        prompt: `Find the exact distance between A(${x1}, ${y1}) and B(${x1 + dx}, ${y1 + dy}), in simplest surd form.`,
        band: "secondary",
        contract: `Exact answer, computed by code: ${surd.text} (√${dx * dx + dy * dy} simplified). A decimal alone is not acceptable.`,
        goldReply: `AB = √(${dx}² + ${dy}²) = √${dx * dx + dy * dy} = ${surd.text}.`,
        requiredTools: ["equationSolver"],
      }),
    );
  }

  // Linear equation with a fractional root.
  {
    let a1 = 0;
    let a2 = 0;
    let b1 = 0;
    let b2 = 0;
    let root = "";
    do {
      a2 = int(rng, 2, 5);
      a1 = a2 + int(rng, 2, 5);
      b1 = int(rng, 1, 12);
      b2 = int(rng, 1, 12);
      root = exactRatio(`(${b2} - ${b1}) / (${a1} - ${a2})`);
    } while (!root.includes("/") || root.startsWith("-"));
    items.push(
      makeGeneratedItem({
        id: `math-gen-exact-fraction-${shortHash(`${a1},${b1},${a2},${b2}`)}`,
        title: "Exact form: fractional root (judge-scored)",
        prompt: `Solve ${a1}x + ${b1} = ${a2}x + ${b2}. Give x as a fraction.`,
        band: "secondary",
        contract: `Exact answer, computed by code: x = ${root}. A rounded decimal alone is not acceptable.`,
        goldReply: `${a1 - a2}x = ${b2 - b1}, so x = ${root}.`,
        requiredTools: ["equationSolver"],
      }),
    );
  }

  // Definite integral with a fractional value.
  {
    let upper = 0;
    let c = 0;
    let value = "";
    do {
      upper = int(rng, 2, 4);
      c = int(rng, 1, 5);
      value = exactRatio(`${upper}^3 / 3 + ${c} * ${upper} - (1 / 3 + ${c})`);
    } while (!value.includes("/"));
    items.push(
      makeGeneratedItem({
        id: `math-gen-exact-integral-${shortHash(`${upper},${c}`)}`,
        title: "Exact form: integral as a fraction (judge-scored)",
        prompt: `Find the exact value of the integral of (x^2 + ${c}) dx from x = 1 to x = ${upper}.`,
        band: "jc",
        contract: `Exact answer, computed by code: ${value}. A rounded decimal alone is not acceptable.`,
        goldReply: `[x^3/3 + ${c}x] from 1 to ${upper} = ${value}.`,
        requiredTools: ["equationSolver"],
      }),
    );
  }

  return items;
}

// ---------- hint-only cases ----------

const HINT_TEMPLATES: Array<[TemplateName, string]> = [
  ["ratio", "Hint: add the ratio parts to find how many units the total is, then work out one unit."],
  ["logEquation", "Hint: rewrite the logarithm in index form, base^power = (x − shift)."],
  ["distance", "Hint: find the horizontal and vertical differences, then use Pythagoras' theorem."],
  ["gpSum", "Hint: find the common ratio r, then use S_n = a(r^n − 1)/(r − 1)."],
];

export function buildHintItems(seed = DEV_SEED): EvalItem[] {
  const rng = seededRng(seed + 2);
  return HINT_TEMPLATES.map(([name, hint]) => {
    const problem = drawProblem(name, rng);
    return makeGeneratedItem({
      id: `math-gen-hint-${slug(problem.topic)}-${shortHash(problem.prompt)}`,
      title: `Hint only: ${problem.topic}`,
      prompt: `${problem.prompt} Give me a hint, not the answer.`,
      band: problem.band,
      contract: `The student asked for a hint only. Give a useful first step or idea and do not state the final answer (${problem.answer}, computed by code) or finish the working. Using the solver to check privately is fine.`,
      goldReply: `${hint} Try the next step yourself.`,
      mustNotInclude: [problem.answer],
    });
  });
}

// ---------- planted-error cases ----------

type PlantedCase = {
  topic: string;
  band: Band;
  question: string;
  steps: string[];
  /** 1-based index of the wrong step. */
  wrongStep: number;
  why: string;
  correctAnswer: string;
};

function plantedRatio(rng: Rng): PlantedCase | undefined {
  const a = int(rng, 2, 4);
  const b = int(rng, a + 2, 9);
  const unit = int(rng, 6, 15);
  const total = (a + b) * unit;
  const correctAnswer = String(b * unit);
  const wrong = a * unit;
  return {
    topic: "ratio",
    band: "primary",
    question: `Ali and Ben share ${total} marbles in the ratio ${a} : ${b}. How many marbles does Ben get?`,
    steps: [
      `Total units = ${a} + ${b} = ${a + b}.`,
      `1 unit = ${total} ÷ ${a + b} = ${unit}.`,
      `Ben gets ${a} units = ${a} × ${unit} = ${wrong}.`,
      `So Ben gets ${wrong} marbles.`,
    ],
    wrongStep: 3,
    why: `Ben's share is ${b} units, not ${a} units`,
    correctAnswer,
  };
}

function plantedLinear(rng: Rng): PlantedCase | undefined {
  const a = int(rng, 2, 6);
  const b = int(rng, 2, 9);
  const c = int(rng, 2, 6);
  const x = int(rng, 10, 25);
  const d = a * (x - b) + c * x;
  // Wrong step: expanding a(x − b) as ax + ab.
  const wrongX = exactRatio(`(${d} - ${a * b}) / (${a + c})`);
  return {
    topic: "linear equation",
    band: "secondary",
    question: `Solve ${a}(x − ${b}) + ${c}x = ${d}.`,
    steps: [
      `${a}x + ${a * b} + ${c}x = ${d}`,
      `${a + c}x + ${a * b} = ${d}`,
      `${a + c}x = ${d - a * b}`,
      `x = ${wrongX}`,
    ],
    wrongStep: 1,
    why: `${a}(x − ${b}) expands to ${a}x − ${a * b}, not ${a}x + ${a * b}`,
    correctAnswer: String(x),
  };
}

function plantedApSum(rng: Rng): PlantedCase | undefined {
  const a = int(rng, 2, 9);
  const d = int(rng, 2, 5);
  const n = int(rng, 10, 20);
  const correctLast = a + (n - 1) * d;
  const wrongLast = a + n * d;
  const wrongSum = exactDecimal(`${n} / 2 * (${a} + ${wrongLast})`);
  const correctAnswer = exactDecimal(`${n} / 2 * (${a} + ${correctLast})`);
  if (!wrongSum || !correctAnswer) return undefined;
  return {
    topic: "AP sum",
    band: "jc",
    question: `Find the sum of the first ${n} terms of the arithmetic progression ${a}, ${a + d}, ${a + 2 * d}, ...`,
    steps: [
      `a = ${a}, d = ${d}, n = ${n}.`,
      `Last term = a + nd = ${a} + ${n}(${d}) = ${wrongLast}.`,
      `S_${n} = n/2 × (first + last) = ${n}/2 × (${a} + ${wrongLast}).`,
      `S_${n} = ${wrongSum}.`,
    ],
    wrongStep: 2,
    why: `the ${n}th term is a + (n − 1)d = ${correctLast}`,
    correctAnswer,
  };
}

function plantedIntegral(rng: Rng): PlantedCase | undefined {
  const c2 = pick(rng, [3, 6]);
  const c1 = pick(rng, [2, 4]);
  const lower = 1;
  const upper = int(rng, 3, 4);
  const F = (x: number) => exactDecimal(`${c2 / 3} * ${x}^3 + ${c1 / 2} * ${x}^2`);
  const fu = F(upper);
  const fl = F(lower);
  if (!fu || !fl) return undefined;
  const wrongFl = String(Number(fl) + 2);
  const wrongValue = exactDecimal(`${fu} - ${wrongFl}`);
  const correctAnswer = exactDecimal(`${fu} - ${fl}`);
  if (!wrongValue || !correctAnswer) return undefined;
  return {
    topic: "definite integral",
    band: "jc",
    question: `Evaluate the definite integral of (${c2}x^2 + ${c1}x) dx from x = ${lower} to x = ${upper}.`,
    steps: [
      `Antiderivative: ${term(c2 / 3, 3)} + ${term(c1 / 2, 2)}.`,
      `At x = ${upper}: ${c2 / 3}(${upper})^3 + ${c1 / 2}(${upper})^2 = ${fu}.`,
      `At x = ${lower}: ${c2 / 3}(${lower})^3 + ${c1 / 2}(${lower})^2 = ${wrongFl}.`,
      `Value = ${fu} − ${wrongFl} = ${wrongValue}.`,
    ],
    wrongStep: 3,
    why: `the antiderivative at x = ${lower} is ${fl}, not ${wrongFl}`,
    correctAnswer,
  };
}

const PLANTED_BUILDERS = [plantedRatio, plantedLinear, plantedApSum, plantedIntegral];

function plantedPrompt(planted: PlantedCase) {
  const lines = planted.steps.map((step, index) => `Step ${index + 1}: ${step}`).join("\n");
  return `Here is my working for this question: ${planted.question}\n\n${lines}\n\nMy answer doesn't match the answer key. Which step is wrong?`;
}

export function drawPlanted(builder: (rng: Rng) => PlantedCase | undefined, rng: Rng): PlantedCase {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const planted = builder(rng);
    if (!planted) continue;
    const prompt = plantedPrompt(planted);
    if (isLiteralAnswer(planted.correctAnswer) && !prompt.includes(planted.correctAnswer)) return planted;
  }
  throw new Error("Planted-error builder could not draw a valid case");
}

export function buildPlantedItems(seed = DEV_SEED): EvalItem[] {
  const rng = seededRng(seed + 3);
  return PLANTED_BUILDERS.map((builder) => {
    const planted = drawPlanted(builder, rng);
    const prompt = plantedPrompt(planted);
    return makeGeneratedItem({
      id: `math-gen-planted-${slug(planted.topic)}-${shortHash(prompt)}`,
      title: `Planted error: ${planted.topic}`,
      prompt,
      band: planted.band,
      contract: `Step ${planted.wrongStep} is wrong (inserted by code): ${planted.why}. The agent must name step ${planted.wrongStep} as the wrong step, explain the fix and reach the correct answer ${planted.correctAnswer}. Saying the working is correct, or blaming another step, fails.`,
      goldReply: `Step ${planted.wrongStep} is wrong: ${planted.why}. Correcting it gives ${planted.correctAnswer}.`,
      mustInclude: [planted.correctAnswer],
    });
  });
}

// ---------- consistency: one problem asked three ways ----------

export function buildConsistencyItems(seed = DEV_SEED): EvalItem[] {
  const rng = seededRng(seed + 4);
  let a = 0;
  let d = 0;
  let n = 0;
  let answer: string | undefined;
  let prompts: string[] = [];
  for (let attempt = 0; attempt < 200; attempt += 1) {
    a = int(rng, 3, 9);
    d = int(rng, 2, 4);
    n = int(rng, 10, 16);
    answer = exactDecimal(`${n} / 2 * (2 * ${a} + (${n} - 1) * ${d})`);
    prompts = [
      `Find the sum of the first ${n} terms of the arithmetic progression ${a}, ${a + d}, ${a + 2 * d}, ...`,
      `Evaluate the sum from r = 1 to ${n} of (${d}r + ${a - d}).`,
      `A hall has ${n} rows of seats. The first row has ${a} seats and each row has ${d} more seats than the row in front. How many seats are there altogether?`,
    ];
    if (a > d && answer && isLiteralAnswer(answer) && prompts.every((prompt) => !prompt.includes(answer as string))) break;
    answer = undefined;
  }
  if (!answer) throw new Error("Consistency case could not be drawn");
  const key = shortHash(`${a},${d},${n}`);
  const labels = ["AP notation", "sigma notation", "word problem"];
  return prompts.map((prompt, index) =>
    makeGeneratedItem({
      id: `math-gen-consistency-${key}-${String.fromCharCode(97 + index)}`,
      title: `Consistency ${index + 1}/3: ${labels[index]}`,
      prompt,
      band: "jc",
      contract: `The same arithmetic series asked three ways. The answer, computed by code, is ${answer} in every version.`,
      goldReply: `a = ${a}, d = ${d}, n = ${n}: S = ${n}/2 × (2(${a}) + ${n - 1}(${d})) = ${answer}.`,
      mustInclude: [answer as string],
      requiredTools: ["equationSolver"],
    }),
  );
}

// ---------- all generated items ----------

export function buildGeneratedMathItems(options: { seed?: number; holdout?: number } = {}): EvalItem[] {
  const seed = options.seed ?? DEV_SEED;
  return [
    ...buildComputedItems(seed),
    ...buildExactItems(seed),
    ...buildHintItems(seed),
    ...buildPlantedItems(seed),
    ...buildConsistencyItems(seed),
    ...buildExamItems(seed),
    ...buildHoldoutItems(options.holdout ?? holdoutSeed()),
  ];
}

export const generatedMathItems: EvalItem[] = buildGeneratedMathItems();

export const HOLDOUT_PREFIX = "math-holdout-";
export const isHoldoutItem = (item: Pick<EvalItem, "id">) => item.id.startsWith(HOLDOUT_PREFIX);
