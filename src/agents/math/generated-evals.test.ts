import assert from "node:assert/strict";
import test from "node:test";
import {
  buildComputedItems,
  buildConsistencyItems,
  buildExactItems,
  buildGeneratedMathItems,
  buildHintItems,
  buildHoldoutItems,
  buildPlantedItems,
  DEFAULT_HOLDOUT_SEED,
  DEV_SEED,
  exactDecimal,
  isLiteralAnswer,
  simplifySurd,
} from "../../evals/catalog/math-generated";
import type { EvalItem } from "../../evals/types";

const nums = (text: string) => (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const answerOf = (item: EvalItem) => (item.scaffold.mustInclude ?? item.scaffold.mustNotInclude ?? [])[0];
const choose = (n: number, r: number): number => (r === 0 ? 1 : (choose(n - 1, r - 1) * n) / r);
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** Recomputes a computed case from the numbers in its prompt, with plain arithmetic. */
function recompute(item: EvalItem): number {
  const p = item.prompt;
  const n = nums(p.replace(/log_|\^|X ~ B/g, " "));
  if (/tan θ/.test(p)) return (n[2] * n[0]) / n[1];
  if (/sin θ/.test(p)) return Math.sqrt(n[2] ** 2 - ((n[2] * n[0]) / n[1]) ** 2);
  if (/log_/.test(p)) {
    const [base, shift, power] = nums(p.replace(/log_/, "").replace(/x − /, "x - "));
    return base ** power + Math.abs(shift);
  }
  if (/\^\(x − /.test(p)) {
    const [base, shift, rhs] = nums(p);
    return Math.log(rhs) / Math.log(base) + Math.abs(shift);
  }
  if (/largest integer/.test(p)) {
    const [a, b, c] = nums(p.replace(/x/g, " "));
    return Math.ceil((c - b) / a) - 1;
  }
  if (/smallest integer/.test(p)) {
    const m = p.match(/(\d+)x − (\d+) > (\d+)x \+ (\d+)/);
    assert.ok(m, p);
    const [a1, b1, a2, b2] = m.slice(1).map(Number);
    return Math.floor((b1 + b2) / (a1 - a2)) + 1;
  }
  if (/gradient/.test(p)) {
    const [x1, y1, x2, y2] = n;
    return (y2 - y1) / (x2 - x1);
  }
  if (/distance between P/.test(p)) {
    const [x1, y1, x2, y2] = n;
    return Math.hypot(x2 - x1, y2 - y1);
  }
  if (/average/.test(p)) return n.slice(0, 5).reduce((s, v) => s + v, 0) / 5;
  if (/median/.test(p)) {
    const s = [...n].sort((a, b) => a - b);
    return (s[2] + s[3]) / 2;
  }
  if (/committee/.test(p)) return choose(n[1], n[0]);
  if (/arranged in a row/.test(p)) return choose(n[1], n[0]) * [1, 1, 2, 6][n[0]];
  if (/reduced by/.test(p)) return (n[0] * n[1]) / 100;
  if (/stickers/.test(p)) return (n[0] / (n[1] + n[2])) * n[2];
  if (/arithmetic progression/.test(p)) {
    const [terms, a, second] = n;
    const d = second - a;
    return (terms / 2) * (2 * a + (terms - 1) * d);
  }
  if (/geometric progression/.test(p)) {
    const [terms, a, second] = n;
    const r = second / a;
    return (a * (r ** terms - 1)) / (r - 1);
  }
  if (/definite integral/.test(p)) {
    const m = p.match(/\((\d+)x\^(\d) \+ (\d+)(x?)\) dx from x = (\d+) to x = (\d+)/);
    assert.ok(m, p);
    const [c, power, c2, hasX, lo, hi] = [Number(m[1]), Number(m[2]), Number(m[3]), m[4], Number(m[5]), Number(m[6])];
    const F = (x: number) => (c * x ** (power + 1)) / (power + 1) + (hasX ? (c2 * x * x) / 2 : c2 * x);
    return F(hi) - F(lo);
  }
  if (/P\(X = /.test(p)) {
    const m = p.match(/B\((\d+), ([\d.]+)\)\. Find P\(X = (\d+)\)/);
    assert.ok(m, p);
    const [trials, prob, k] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return choose(trials, k) * prob ** k * (1 - prob) ** (trials - k);
  }
  if (/at most one win/.test(p)) {
    const m = p.match(/probability ([\d.]+),.* In (\d+) rounds/);
    assert.ok(m, p);
    const [prob, trials] = [Number(m[1]), Number(m[2])];
    return (1 - prob) ** trials + trials * prob * (1 - prob) ** (trials - 1);
  }
  throw new Error(`No recompute rule for: ${p}`);
}

test("exact helpers", () => {
  assert.equal(simplifySurd(45).text, "3√5");
  assert.equal(simplifySurd(49).text, "7");
  assert.equal(simplifySurd(7).text, "√7");
  assert.equal(exactDecimal("3 * 0.4^2 * 0.6"), "0.288");
  assert.equal(exactDecimal("1/3"), undefined);
  assert.ok(isLiteralAnswer("12") && isLiteralAnswer("0.288") && isLiteralAnswer("23.5"));
  assert.ok(!isLiteralAnswer("7") && !isLiteralAnswer("0.3125") && !isLiteralAnswer("1275") && !isLiteralAnswer("-12"));
});

test("computed and held-out answers match an independent recomputation", () => {
  for (const seed of [DEV_SEED, DEFAULT_HOLDOUT_SEED, 1, 42, 999]) {
    for (const item of [...buildComputedItems(seed), ...buildHoldoutItems(seed)]) {
      const answer = answerOf(item);
      assert.ok(close(Number(answer), recompute(item)), `${item.id}: ${answer} vs ${recompute(item)}`);
    }
  }
});

test("literal answers are well formed and never appear in the prompt", () => {
  for (const seed of [DEV_SEED, 7, 123]) {
    const items = buildGeneratedMathItems({ seed, holdout: seed + 1000 });
    for (const item of items) {
      for (const answer of [...(item.scaffold.mustInclude ?? []), ...(item.scaffold.mustNotInclude ?? [])]) {
        assert.ok(isLiteralAnswer(answer), `${item.id}: ${answer}`);
        assert.ok(!item.prompt.includes(answer), `${item.id}: answer ${answer} is in the prompt`);
      }
    }
  }
});

test("layer counts, prefixes and bands", () => {
  const items = buildGeneratedMathItems();
  const count = (prefix: string) => items.filter((item) => item.id.startsWith(prefix)).length;
  assert.equal(count("math-gen-computed-"), 10);
  assert.equal(count("math-holdout-"), 10);
  assert.equal(count("math-gen-exact-"), 4);
  assert.equal(count("math-gen-hint-"), 4);
  assert.equal(count("math-gen-planted-"), 4);
  assert.equal(count("math-gen-consistency-"), 3);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  const bands = new Set([...buildComputedItems(), ...buildHoldoutItems()].map((item) => item.profile.gradeLevel));
  assert.deepEqual([...bands].sort(), ["jc", "primary", "secondary"]);
  for (const item of buildExactItems()) {
    assert.match(item.title, /\(judge-scored\)$/);
    assert.equal(item.scaffold.mustInclude, undefined);
  }
  for (const item of buildHintItems()) {
    assert.match(item.prompt, /Give me a hint, not the answer\.$/);
    assert.equal(item.scaffold.mustInclude, undefined);
    assert.equal(item.scaffold.mustNotInclude?.length, 1);
  }
});

test("ids are deterministic for a seed, and the held-out seed draws different cases", () => {
  const ids = (items: EvalItem[]) => items.map((item) => item.id);
  assert.deepEqual(ids(buildGeneratedMathItems()), ids(buildGeneratedMathItems()));
  assert.deepEqual(ids(buildHoldoutItems(5)), ids(buildHoldoutItems(5)));
  assert.notDeepEqual(ids(buildHoldoutItems(5)), ids(buildHoldoutItems(6)));
  const dev = new Set(buildComputedItems().map((item) => item.prompt));
  assert.ok(buildHoldoutItems().every((item) => !dev.has(item.prompt)));
});

test("planted errors name one wrong step and the correct answer", () => {
  for (const seed of [DEV_SEED, 3, 77]) {
    for (const item of buildPlantedItems(seed)) {
      const step = Number(item.scaffold.contract.match(/^Step (\d+) is wrong/)?.[1]);
      assert.ok(step >= 1 && item.prompt.includes(`Step ${step}:`), item.id);
      assert.equal(item.scaffold.mustInclude?.length, 1);
    }
    const [ratio, linear, ap, integral] = buildPlantedItems(seed);
    const r = nums(ratio.prompt);
    assert.equal(Number(answerOf(ratio)), (r[0] / (r[1] + r[2])) * r[2]);
    const l = linear.prompt.match(/Solve (\d+)\(x − (\d+)\) \+ (\d+)x = (\d+)/);
    assert.ok(l);
    const [a, b, c, d] = l.slice(1).map(Number);
    assert.equal(Number(answerOf(linear)), (d + a * b) / (a + c));
    const apQuestion = ap.prompt.split("\n")[0];
    const [terms, first, second] = nums(apQuestion);
    assert.equal(Number(answerOf(ap)), (terms / 2) * (2 * first + (terms - 1) * (second - first)));
    const integralItem = { ...integral, prompt: integral.prompt.split("\n")[0] };
    assert.ok(close(Number(answerOf(integral)), recompute(integralItem)));
  }
});

test("consistency cases share one computed answer", () => {
  const items = buildConsistencyItems();
  assert.equal(items.length, 3);
  const answers = new Set(items.map(answerOf));
  assert.equal(answers.size, 1);
  assert.equal(Number(answerOf(items[0])), recompute(items[0]));
});
