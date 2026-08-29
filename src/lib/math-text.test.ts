import assert from "node:assert/strict";
import { normalizeMathText } from "./math-text";

assert.equal(normalizeMathText("Force is \\(F = ma\\)."), "Force is $F = ma$.");
assert.match(normalizeMathText("The quadratic is \\[x = \\frac{-b}{2a}\\]"), /\$\$/);
assert.match(
  normalizeMathText("\\begin{align}a &= b \\\\ c &= d\\end{align}"),
  /\$\$\n\\begin\{align\}/,
);
assert.equal(
  normalizeMathText("Already $$E = mc^2$$ stays."),
  "Already $$E = mc^2$$ stays.",
);
assert.ok(normalizeMathText("```\n\\(keep\\)\n```").includes("\\(keep\\)"));
assert.ok(normalizeMathText("Open $$E = mc^2").endsWith("$$"));

console.log("math-text tests passed");
