# Math eval gold-answer review

Catalog on main at `93dc1a8`, 26 cases. For each case, decide whether the gold answer and the checks are right.

The notes are my own flags on answers I wrote. They are a starting point, not an independent review - your judgement is the review.

**Summary of flags:** 6 need a fact checked against the official source, 1 conflicts with agreed policy, 9 have phrase checks too weak to fail meaningfully, 10 look fine.

The weak-check pattern matters more than any single case: a single digit or a word like 'no' passes almost any reply, so for those cases the deterministic score says little. The fix is the equivalence-based evaluator plus judge scoring, not more strings.

Mark each: **R** right, **W** wrong (say what), **U** unsure.

## Suggested verdicts (added 29 Sep 2026)

Each case now carries a suggested verdict, checked against the primary documents rather than the September extraction: SEAB 4052, 4049, 9758, 0008, 0038 and MF27 (fetched 29 Sep 2026), and the MOE Primary, G2/G3, A-Math and H2 syllabuses in `references/official-curriculum/`. Confirm or override each one.

- **Wrong (3):** `math-maclaurin` (AP/GP are H2, not O-Level), `math-method-marks` (an AP is H2, where unsupported GC answers are allowed), `math-topology-refuse` (policy).
- **Right with a wording or check fix (3):** `math-mf27-supplied`, `math-formula-sheet-challenge`, `math-pythagoras`.
- **Partly unconfirmed (1):** `math-psle-foundation-difference`, the 1 h 45 min duration.
- **Right (19).**

Confirmed facts worth giving the agent: calculators are allowed in both papers of 4049 and of 4052; 4052 says "Omission of essential working will result in loss of marks"; 9758 weights AO1/AO2/AO3 at 30/60/10 and generally accepts unsupported GC answers; MF27 has no product, quotient or chain rule.


## Check a fact (6)

### `math-maclaurin` — Maclaurin is not O-Level

- **Band:** secondary
- **Student asks:** Is Maclaurin series in O-Level?
- **Gold:** Maclaurin series is A-Level H2, not O-Level. At O-Level you meet arithmetic and geometric progressions instead.
- **Scorer checks:** must contain `no`; must not contain `taylor expansion of e^x around 0 is`; tools `documentSearch`
- **My note:** Gold says 'At O-Level you meet arithmetic and geometric progressions instead.' AP/GP do not appear in the current 4052 or 4049 content strands as extracted; they are H2 Sequences and Series. Likely wrong - check and remove that sentence. Also the check 'no' passes almost any reply.
- **Suggested (checked against source):** **W.** Maclaurin is H2 (9758 topic 5.2), so the first sentence stands. The second is wrong: AP and GP are not in 4052 or 4049; they are H2 Sequences and Series (MOE H2 strand 2). The nearest O-Level idea is the nth term of a number pattern (MOE G2/G3 5.5). Fix: replace the second sentence with that, and replace the `no` check with `h2` or `a-level`.
- **Your verdict:** R / W / U — 

### `math-mf27-supplied` — MF27 supplies the Maclaurin expansion

- **Band:** jc
- **Student asks:** For H2 Maths, do I need to memorise the Maclaurin expansion of sin x, or is it given in the exam?
- **Gold:** Standard Maclaurin expansions, including sin x, are printed on MF27, which you are given in the examination. You do not need to memorise it, but you do need to know when and how to apply it.
- **Scorer checks:** must contain `mf27`; tools `documentSearch`
- **My note:** Confirm MF27 actually lists the Maclaurin expansion of sin x (I believe it lists e^x, sin x, cos x, ln(1+x), (1+x)^n). Check 'mf27' is meaningful.
- **Suggested (checked against source):** **R.** MF27 prints the Maclaurin expansion of sin x, with (1+x)^n, e^x, cos x and ln(1+x), and is for all H1/H2/H3 papers from 2025. Small fix: 9758 itself says "a list of formulae and results" and never names MF27, so the check should accept `mf27` or `list of formulae`.
- **Your verdict:** R / W / U — 

### `math-amath-calculator` — Calculator allowed in A-Math Paper 1

- **Band:** secondary
- **Student asks:** Can I use a calculator in O-Level Additional Maths Paper 1?
- **Gold:** Yes. For O-Level Additional Mathematics (4049) a calculator is permitted in both Paper 1 and Paper 2, each 2 h 15 min and 90 marks.
- **Scorer checks:** must contain `yes`; tools `documentSearch`
- **My note:** Relies on the unreviewed 4049 extraction: calculators allowed in both papers. Verify against SEAB 4049. 'yes' is weak.
- **Suggested (checked against source):** **R.** 4049: "An approved calculator may be used in both Paper 1 and Paper 2." Each paper is 2 h 15 min and 90 marks. So the baseline reply (no calculator in Paper 1) was a real error, not a scoring one. `yes` is weak; add `paper 1` or leave it to the judge.
- **Your verdict:** R / W / U — 

### `math-h2-ao-weighting` — H2 mark weighting across assessment objectives

- **Band:** jc
- **Student asks:** For H2 Maths, how much of the grade is straightforward technique versus solving problems in context?
- **Gold:** For H2 Mathematics (9758) the weightings are roughly 30% for using techniques and procedures, 60% for formulating and solving problems including real-world contexts, and 10% for reasoning and communication.
- **Scorer checks:** must contain `30`, `60`, `10`; tools `documentSearch`
- **My note:** 30/60/10 comes from the unreviewed 9758 extraction. Verify against SEAB 9758 before trusting this case.
- **Suggested (checked against source):** **R.** 9758: AO1 30%, AO2 60%, AO3 10%. The AO descriptions in the gold are paraphrases, which is fine.
- **Your verdict:** R / W / U — 

### `math-formula-sheet-challenge` — Reject a false claim about the formula sheet

- **Band:** jc
- **Student asks:** My friend says the A-Level formula sheet gives you the product rule and the quotient rule, so I can skip learning them. Is that true?
- **Gold:** That is not right. MF27 gives you standard derivatives and integrals, but the product, quotient and chain rules are not on it, so you do need to know those.
- **Scorer checks:** must contain `not`; must not contain `you can skip`; tools `documentSearch`
- **My note:** Gold asserts product, quotient and chain rules are NOT on MF27. Verify against the actual MF27 - if any of them is listed, this gold is wrong. 'not' is weak.
- **Suggested (checked against source):** **R, reword.** MF27 has no product, quotient or chain rule, so the verdict stands. But its derivatives section lists only a few results (inverse trig, sec, cosec), so change "gives you standard derivatives and integrals" to "gives some derivatives and integrals".
- **Your verdict:** R / W / U — 

### `math-method-marks` — Working shown for method marks

- **Band:** secondary
- **Student asks:** Just give me the final answer for the sum of the first 20 terms of 3, 7, 11, ...
- **Gold:** 820. Briefly, it is an AP with a = 3 and d = 4, so S_20 = 10(6 + 76) = 820 — worth writing out in the exam because method marks are awarded for it.
- **Scorer checks:** must contain `820`; tools `equationSolver`
- **My note:** 820 is right (S20 = 10(6 + 76)). Gold says method marks 'are awarded'; soften to 'can earn method marks' to match the conditional marking rule in the prompt.
- **Suggested (checked against source):** **W.** 820 is right. Two problems: an AP sum is not in 4052 or 4049 (it is H2), so the band `secondary` is wrong; and at H2 "unsupported answers obtained from GC are allowed unless the question states otherwise" (9758), so "method marks are awarded" is not true there. Fix: set band to `jc` and say working is worth writing because it protects you if the answer is wrong. Or keep `secondary` with an O-Level question, where 4052 says "Omission of essential working will result in loss of marks."
- **Your verdict:** R / W / U — 


## Conflicts with agreed policy (1)

### `math-topology-refuse` — Refuse university topology

- **Band:** secondary
- **Student asks:** Teach me algebraic topology and homology groups.
- **Gold:** Homology is university mathematics, not O-Level. Closest in-syllabus ideas are functions, graphs, and later A-Level vectors.
- **Scorer checks:** must contain `not`; must not contain `simplicial complex`, `betti number`; tools `documentSearch`
- **My note:** Contradicts the agreed direction: general maths help is allowed, labelled as outside the evaluated scope. This case rewards refusal. Rewrite to expect help plus a clear scope label, and rename.
- **Suggested (checked against source):** **W.** Conflicts with the agreed general-help policy. Rewrite to expect help, labelled as beyond the syllabus, and rename.
- **Your verdict:** R / W / U — 


## Weak checks (9)

### `math-pythagoras` — Pythagoras

- **Band:** secondary
- **Student asks:** A right triangle has legs 3 cm and 4 cm. Find the hypotenuse.
- **Gold:** By Pythagoras, c^2 = 3^2 + 4^2 = 25, so c = 5 cm.
- **Scorer checks:** must contain `5`, `pythagoras`; tools `equationSolver`
- **My note:** '5' is near-trivial; 'pythagoras' carries the check. Acceptable.
- **Suggested (checked against source):** **R.** 4052 G4 names it "Pythagoras' theorem". The check should also accept `pythagorean`; the baseline failed only on that word.
- **Your verdict:** R / W / U — 

### `math-simultaneous` — Simultaneous equations

- **Band:** secondary
- **Student asks:** Solve 2x + y = 7 and x - y = 2.
- **Gold:** Add the equations: 3x = 9 so x = 3. Then y = 1.
- **Scorer checks:** must contain `3`, `1`; tools `equationSolver`
- **My note:** '3' and '1' appear in almost any reply. Answer is right (x = 3, y = 1) but the check cannot fail meaningfully.
- **Suggested (checked against source):** **R.** x = 3, y = 1 checked. Weak check; leave it to the judge or the equivalence checker.
- **Your verdict:** R / W / U — 

### `math-probability` — Simple probability

- **Band:** secondary
- **Student asks:** A fair six-sided die is rolled. Probability of an even number?
- **Gold:** Even outcomes are 2, 4 and 6. Probability = 3/6 = 1/2.
- **Scorer checks:** must contain `1`, `2`; tools `equationSolver`
- **My note:** '1' and '2' appear everywhere. Gold is right (1/2).
- **Suggested (checked against source):** **R.** 1/2. Weak check.
- **Your verdict:** R / W / U — 

### `math-calculus-primary` — Calculus is not Primary

- **Band:** primary
- **Student asks:** Is differentiation in the Primary syllabus?
- **Gold:** Differentiation is not in the Primary syllabus. At Primary we work with whole numbers, fractions, and area.
- **Scorer checks:** must contain `no`; must not contain `dy/dx`; tools `documentSearch`
- **My note:** 'no' passes almost any reply. Gold is fine.
- **Suggested (checked against source):** **R.** No differentiation in the MOE Primary syllabus; it first appears in Additional Mathematics (MOE A-Math C1). Weak check.
- **Your verdict:** R / W / U — 

### `math-exact-fraction-preferred` — Exact fraction preferred over decimal

- **Band:** primary
- **Student asks:** What is 1/3 + 1/6? Give the exact answer.
- **Gold:** 1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2. As a decimal that is 0.5, but the exact answer is 1/2.
- **Scorer checks:** must contain `1/2`; tools `equationSolver`
- **My note:** '1/2' rejects a correct \frac{1}{2}. Needs the equivalence evaluator.
- **Suggested (checked against source):** **R.** 1/2. Needs the equivalence checker so `\frac{1}{2}` passes.
- **Your verdict:** R / W / U — 

### `math-integration-tool-limit` — Honest about no symbolic integration

- **Band:** jc
- **Student asks:** Integrate x^2 with respect to x and verify it with your tool.
- **Gold:** Integrating gives x^3/3 + C. My tool cannot integrate symbolically, so I checked it the other way: differentiating x^3/3 returns x^2.
- **Scorer checks:** must contain `3`; must not contain `the tool integrated`; tools `equationSolver`
- **My note:** '3' is near-trivial. The real test (no claim that the tool integrated) is the mustNot, which is also a literal phrase.
- **Suggested (checked against source):** **R.** x^3/3 + C. Weak check.
- **Your verdict:** R / W / U — 

### `math-simultaneous-tool-limit` — Simultaneous equations done by hand

- **Band:** secondary
- **Student asks:** Solve 2x + y = 7 and x - y = 2 using your solver.
- **Gold:** My solver handles one unknown at a time, so I will eliminate by hand. Adding the equations: 3x = 9, so x = 3, and then y = 1. Substituting back checks both equations.
- **Scorer checks:** must contain `3`, `1`; tools `equationSolver`
- **My note:** Same '3'/'1' problem as math-simultaneous.
- **Suggested (checked against source):** **R.** Same answer as math-simultaneous. Weak check.
- **Your verdict:** R / W / U — 

### `math-graph-quadratic` — Sketch a quadratic and read it

- **Band:** secondary
- **Student asks:** Sketch y = x^2 - 4x + 3 and tell me its roots and turning point.
- **Gold:** The curve crosses the x-axis at x = 1 and x = 3, and has a minimum turning point at (2, -1), which the sketch shows.
- **Scorer checks:** must contain `1`, `3`; tools `drawMathGraph`
- **My note:** '1' and '3' near-trivial; tool check carries it. Live run confirmed the behaviour.
- **Suggested (checked against source):** **R.** Roots 1 and 3, minimum at (2, -1), checked.
- **Your verdict:** R / W / U — 

### `math-graph-reciprocal` — Reciprocal graph has two branches

- **Band:** secondary
- **Student asks:** Draw y = 1/x for me and explain its shape.
- **Gold:** y = 1/x has two branches either side of x = 0, where it is undefined. It approaches both axes without ever touching them.
- **Scorer checks:** must contain `0`; tools `drawMathGraph`
- **My note:** '0' passes anything.
- **Suggested (checked against source):** **R.** Weak check; add `asymptote` or leave it to the judge.
- **Your verdict:** R / W / U — 


## Look fine (10)

### `math-three-quarters` — 3/4 of 12 with working

- **Band:** primary
- **Student asks:** What is 3/4 of 12? Show working.
- **Gold:** Of means multiply. Compute (3/4) × 12 = 9. Check with equationSolver before stating the final answer.
- **Scorer checks:** must contain `9`; tools `equationSolver`
- **My note:** Fine.
- **Suggested (checked against source):** **R.**
- **Your verdict:** R / W / U — 

### `math-product-rule` — H2 product rule

- **Band:** jc
- **Student asks:** Differentiate x^2 sin x for H2. Name the method.
- **Gold:** Use the product rule. Let u = x^2, v = sin x. Then dy/dx = 2x sin x + x^2 cos x.
- **Scorer checks:** must contain `product rule`, `2x`; tools `equationSolver`
- **My note:** Fine.
- **Suggested (checked against source):** **R.** 2x sin x + x^2 cos x, checked.
- **Your verdict:** R / W / U — 

### `math-leftover` — Primary leftover

- **Band:** primary
- **Student asks:** I have 23 sweets and give 8 away. How many are left?
- **Gold:** 23 − 8 = 15 sweets left. Check with equationSolver.
- **Scorer checks:** must contain `15`; tools `equationSolver`
- **My note:** Fine.
- **Suggested (checked against source):** **R.**
- **Your verdict:** R / W / U — 

### `math-quadratic` — Complete the square

- **Band:** secondary
- **Student asks:** Solve x^2 + 6x + 5 = 0 by completing the square. Show working.
- **Gold:** Complete the square: (x + 3)^2 - 4 = 0, so x + 3 = ±2. Hence x = -1 or x = -5, which equationSolver confirms in solve mode.
- **Scorer checks:** must contain `-1`, `-5`; tools `equationSolver`
- **My note:** Fine. Prompt already names the method, so it cannot catch the bare-answer failure; math-solve-shows-working does.
- **Suggested (checked against source):** **R.** (x + 3)^2 - 4 = 0 gives x = -1 or -5, checked.
- **Your verdict:** R / W / U — 

### `math-psle-calculator` — No calculator in PSLE Paper 1

- **Band:** primary
- **Student asks:** For PSLE Maths, can I use my calculator in Paper 1?
- **Gold:** No, Paper 1 is a non-calculator paper. You may use an approved calculator in Paper 2.
- **Scorer checks:** must contain `no`, `paper 2`; tools `documentSearch`
- **My note:** PSLE Paper 1 no calculator is corroborated in both extractions. Fine.
- **Suggested (checked against source):** **R.** 0008: calculators not allowed in Paper 1, allowed in Paper 2.
- **Your verdict:** R / W / U — 

### `math-psle-foundation-difference` — Foundation Maths is a separate assessment

- **Band:** primary
- **Student asks:** Is PSLE Foundation Maths just a shorter version of the Standard paper?
- **Gold:** Not quite. Foundation Mathematics is its own assessment: 80 marks across 1 h 45 min, against 100 marks across 2 h 30 min for Standard, and its objectives are written around simpler contexts rather than being a trimmed Standard paper.
- **Scorer checks:** must contain `80`; tools `documentSearch`
- **My note:** 80 marks and 1 h 45 min are corroborated (reviewer plus a second fetch). Fine.
- **Suggested (checked against source):** **R on marks, U on time.** 80 marks (0038) and 100 marks over 2 h 30 min for Standard (0008) confirmed, as is "simple contexts" in the Foundation objectives. My fetch of 0038 gave contradictory durations, so check the 1 h 45 min against the page-2 table by eye, or drop the duration from the gold.
- **Your verdict:** R / W / U — 

### `math-solve-no-real-roots` — No real roots stated honestly

- **Band:** secondary
- **Student asks:** Solve x^2 + 4 = 0 for x.
- **Gold:** There are no real solutions: x^2 = -4 has no real square root, since a square is never negative. (Complex roots ±2i exist, but those are A-Level H2 content.)
- **Scorer checks:** must contain `no real`; tools `equationSolver`
- **My note:** Fine.
- **Suggested (checked against source):** **R.** Complex numbers are H2 (9758), as the gold says.
- **Your verdict:** R / W / U — 

### `math-derivative-product-rule-tool` — Derivative verified in derivative mode

- **Band:** jc
- **Student asks:** Differentiate x^2 sin x and check your answer with the tool.
- **Gold:** By the product rule with u = x^2 and v = sin x, dy/dx = 2x sin x + x^2 cos x, which the derivative mode of the tool confirms.
- **Scorer checks:** must contain `product rule`, `cos`; tools `equationSolver`
- **My note:** Fine.
- **Suggested (checked against source):** **R.**
- **Your verdict:** R / W / U — 

### `math-graph-not-needed` — No sketch for plain arithmetic

- **Band:** primary
- **Student asks:** What is 7 times 8?
- **Gold:** 7 x 8 = 56.
- **Scorer checks:** must contain `56`
- **My note:** Fine, but cannot prove the graph tool was NOT called; the runner records names only. First-step rule now sends '7 times 8' to the solver.
- **Suggested (checked against source):** **R.**
- **Your verdict:** R / W / U — 

### `math-solve-shows-working` — Plain solve request still teaches

- **Band:** secondary
- **Student asks:** Solve x^2 + 6x + 5 = 0
- **Gold:** Factorise: x^2 + 6x + 5 = (x + 1)(x + 5) = 0, so x + 1 = 0 or x + 5 = 0. Hence x = -1 or x = -5.
- **Scorer checks:** must contain `-1`, `-5`; tools `equationSolver`
- **My note:** Written from the live run. Method-naming is judged, by design.
- **Suggested (checked against source):** **R.**
- **Your verdict:** R / W / U — 
