// SCAFFOLD STATUS — not a trusted baseline.
// Review of 12 September 2026 (src/agents/math/REVIEW-2026-09-12.md) established that a
// `requiredTools` name check cannot show which mode ran, with what inputs, or whether the
// calculation actually succeeded, and that literal `mustInclude` strings can reject
// mathematically correct LaTeX. Treat results as development signal only until richer tool
// evidence and a mathematics-aware scorer are agreed with the shared evaluation owner.
//
// Gold answers were checked against the SEAB and MOE documents on 29 September 2026
// (src/agents/math/runs/2026-09-29-gold-review.md). Where a correct reply can be written
// several ways (1/2 or \frac{1}{2}), the literal check is dropped and the judge decides,
// until the shared scorer can test mathematical equivalence.
import type { EvalItem } from "../types";
import { jcAlex, primaryAlex, secondaryAlex } from "./profiles";

export const mathItems: EvalItem[] = [
  {
    id: "math-three-quarters",
    suiteId: "math",
    kind: "teaching",
    title: "3/4 of 12 with working",
    prompt: "What is 3/4 of 12? Show working.",
    profile: primaryAlex,
    targetAgent: "math",
    scaffold: {
      contract: "Primary arithmetic. Show working and verify with equationSolver. Answer is 9.",
      goldReply:
        "Of means multiply. Compute (3/4) × 12 = 9. Check with equationSolver before stating the final answer.",
      mustInclude: ["9"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-maclaurin",
    suiteId: "math",
    kind: "teaching",
    title: "Maclaurin is not O-Level",
    prompt: "Is Maclaurin series in O-Level?",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Search the syllabus map. Say no: Maclaurin series is H2 (9758 topic 5.2). Do not teach it as O-Level. Arithmetic and geometric progressions are also H2, not O-Level.",
      goldReply:
        "No. Maclaurin series is A-Level H2 Mathematics, not O-Level. The nearest O-Level idea is finding an expression for the nth term of a number pattern.",
      mustInclude: ["a-level"],
      mustNotInclude: ["taylor expansion of e^x around 0 is"],
      requiredTools: ["documentSearch"],
    },
  },
  {
    id: "math-product-rule",
    suiteId: "math",
    kind: "teaching",
    title: "H2 product rule",
    prompt: "Differentiate x^2 sin x for H2. Name the method.",
    profile: jcAlex,
    targetAgent: "math",
    scaffold: {
      contract: "Name product rule, show d/dx(x^2 sin x) = 2x sin x + x^2 cos x.",
      goldReply:
        "Use the product rule. Let u = x^2, v = sin x. Then dy/dx = 2x sin x + x^2 cos x.",
      mustInclude: ["product rule", "2x"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-leftover",
    suiteId: "math",
    kind: "teaching",
    title: "Primary leftover",
    prompt: "I have 23 sweets and give 8 away. How many are left?",
    profile: primaryAlex,
    targetAgent: "math",
    scaffold: {
      contract: "Simple subtraction with working. Answer 15.",
      goldReply: "23 − 8 = 15 sweets left. Check with equationSolver.",
      mustInclude: ["15"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-quadratic",
    suiteId: "math",
    kind: "teaching",
    title: "Complete the square",
    prompt: "Solve x^2 + 6x + 5 = 0 by completing the square. Show working.",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Name completing the square and show the steps. Roots x = -1 and x = -5. Verify with equationSolver in 'solve' mode, which returns polynomial roots; 'evaluate' cannot solve an equation.",
      goldReply:
        "Complete the square: (x + 3)^2 - 4 = 0, so x + 3 = ±2. Hence x = -1 or x = -5, which equationSolver confirms in solve mode.",
      mustInclude: ["-1", "-5"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-pythagoras",
    suiteId: "math",
    kind: "teaching",
    title: "Pythagoras",
    prompt: "A right triangle has legs 3 cm and 4 cm. Find the hypotenuse.",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract: "Name Pythagoras. Hypotenuse 5 cm.",
      goldReply: "By Pythagoras, c^2 = 3^2 + 4^2 = 25, so c = 5 cm.",
      // "pythagor" accepts both Pythagoras' theorem and the Pythagorean theorem.
      mustInclude: ["5", "pythagor"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-topology-beyond-syllabus",
    suiteId: "math",
    kind: "teaching",
    title: "University topic is labelled and pointed back to the syllabus",
    prompt: "Teach me algebraic topology and homology groups.",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Out of band, but not refused. Say it is university mathematics beyond O-Level, point to the closest in-syllabus topics, and at most give a short, clearly labelled orientation rather than a full lesson.",
      goldReply:
        "Algebraic topology is university mathematics, well beyond O-Level, so it is not in your syllabus. Very roughly, it studies the properties of shapes that survive stretching, and homology is a way of counting holes. The closest things in your syllabus are sets and Venn diagrams, coordinate geometry and vectors, which are good foundations if you want to go further later.",
      mustInclude: ["university"],
    },
  },
  {
    id: "math-simultaneous",
    suiteId: "math",
    kind: "teaching",
    title: "Simultaneous equations",
    prompt: "Solve 2x + y = 7 and x - y = 2.",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract: "Show elimination or substitution. x = 3, y = 1.",
      goldReply: "Add the equations: 3x = 9 so x = 3. Then y = 1.",
      mustInclude: ["3", "1"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-probability",
    suiteId: "math",
    kind: "teaching",
    title: "Simple probability",
    prompt: "A fair six-sided die is rolled. Probability of an even number?",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract: "Even faces 2,4,6 so 3/6 = 1/2.",
      goldReply: "Even outcomes are 2, 4 and 6. Probability = 3/6 = 1/2.",
      // NOTE: a literal check rejects valid LaTeX such as \\frac{1}{2}. Needs a
      // mathematics-aware scorer; see src/agents/math/REVIEW-2026-09-12.md.
      mustInclude: ["1", "2"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-calculus-primary",
    suiteId: "math",
    kind: "teaching",
    title: "Calculus is not Primary",
    prompt: "Is differentiation in the Primary syllabus?",
    profile: primaryAlex,
    targetAgent: "math",
    scaffold: {
      contract: "Search syllabus. Answer no. Offer fractions or area instead.",
      goldReply:
        "Differentiation is not in the Primary syllabus. At Primary we work with whole numbers, fractions, and area.",
      mustInclude: ["no"],
      mustNotInclude: ["dy/dx"],
      requiredTools: ["documentSearch"],
    },
  },
  {
    id: "math-mf27-supplied",
    suiteId: "math",
    kind: "teaching",
    title: "MF27 supplies the Maclaurin expansion",
    prompt:
      "For H2 Maths, do I need to memorise the Maclaurin expansion of sin x, or is it given in the exam?",
    profile: jcAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Check the exam facts for MF27. Say the standard Maclaurin expansions, including sin x, are on MF27 (the list of formulae and results given in every H1/H2 paper), so recall drilling is unnecessary. The 9758 syllabus itself says 'a list of formulae and results' and does not name MF27, so either name is correct.",
      goldReply:
        "Standard Maclaurin expansions, including sin x, are printed on MF27, which you are given in the examination. You do not need to memorise it, but you do need to know when and how to apply it.",
      // Matches "MF27 list of formulae", "formula list" and "List of Formulae and Results".
      mustInclude: ["formula"],
      requiredTools: ["examFacts"],
    },
  },
  {
    id: "math-amath-calculator",
    suiteId: "math",
    kind: "teaching",
    title: "Calculator allowed in A-Math Paper 1",
    prompt: "Can I use a calculator in O-Level Additional Maths Paper 1?",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Check the exam facts for 4049. Calculators are permitted in both papers. Do not confuse this with PSLE Paper 1, which is non-calculator.",
      goldReply:
        "Yes. For O-Level Additional Mathematics (4049) a calculator is permitted in both Paper 1 and Paper 2, each 2 h 15 min and 90 marks.",
      mustInclude: ["yes"],
      requiredTools: ["examFacts"],
    },
  },
  {
    id: "math-psle-calculator",
    suiteId: "math",
    kind: "teaching",
    title: "No calculator in PSLE Paper 1",
    prompt: "For PSLE Maths, can I use my calculator in Paper 1?",
    profile: primaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Check the exam facts for PSLE Standard. Paper 1 is non-calculator; Paper 2 allows a calculator. State both rather than only the prohibition.",
      goldReply:
        "No, Paper 1 is a non-calculator paper. You may use an approved calculator in Paper 2.",
      mustInclude: ["no", "paper 2"],
      requiredTools: ["examFacts"],
    },
  },
  {
    id: "math-h2-ao-weighting",
    suiteId: "math",
    kind: "teaching",
    title: "H2 mark weighting across assessment objectives",
    prompt:
      "For H2 Maths, how much of the grade is straightforward technique versus solving problems in context?",
    profile: jcAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Check the exam facts for 9758. AO1 techniques 30%, AO2 formulate and solve problems 60%, AO3 reasoning and communication 10%. Do not invent a different split.",
      goldReply:
        "For H2 Mathematics (9758) the weightings are roughly 30% for using techniques and procedures, 60% for formulating and solving problems including real-world contexts, and 10% for reasoning and communication.",
      mustInclude: ["30", "60", "10"],
      requiredTools: ["examFacts"],
    },
  },
  {
    id: "math-psle-foundation-difference",
    suiteId: "math",
    kind: "teaching",
    title: "Foundation Maths is a separate assessment",
    prompt: "Is PSLE Foundation Maths just a shorter version of the Standard paper?",
    profile: primaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Check the exam facts for both PSLE formats. Foundation is 80 marks against Standard's 100 marks, with assessment objectives scoped to simple contexts. Describe it as a different assessment, not a lesser one. (The Foundation duration is not yet confirmed against the printed table, so it is left out.)",
      goldReply:
        "Not quite. Foundation Mathematics is its own assessment: 80 marks against 100 for Standard, and its objectives are written around simple contexts rather than being a trimmed Standard paper.",
      mustInclude: ["80"],
      requiredTools: ["examFacts"],
    },
  },
  {
    id: "math-formula-sheet-challenge",
    suiteId: "math",
    kind: "teaching",
    title: "Reject a false claim about the formula sheet",
    prompt:
      "My friend says the A-Level formula sheet gives you the product rule and the quotient rule, so I can skip learning them. Is that true?",
    profile: jcAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Check the exam facts for MF27. Standard differentiation rules are not on MF27 and must be known. Correct the student's premise rather than agreeing, and do not claim to have verified anything the retrieval did not support.",
      goldReply:
        "That is not right. MF27 lists some derivatives and integrals, but the product, quotient and chain rules are not on it, so you do need to know those.",
      mustInclude: ["not"],
      mustNotInclude: ["you can skip"],
      requiredTools: ["examFacts"],
    },
  },
  {
    id: "math-solve-no-real-roots",
    suiteId: "math",
    kind: "teaching",
    title: "No real roots stated honestly",
    prompt: "Solve x^2 + 4 = 0 for x.",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "equationSolver solve mode reports two complex roots and zero real roots. At O-Level the expected answer is that there are no real solutions. Do not present 2i as an O-Level answer without saying it is outside the band.",
      goldReply:
        "There are no real solutions: x^2 = -4 has no real square root, since a square is never negative. (Complex roots ±2i exist, but those are A-Level H2 content.)",
      mustInclude: ["no real"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-derivative-product-rule-tool",
    suiteId: "math",
    kind: "teaching",
    title: "Derivative verified in derivative mode",
    prompt: "Differentiate x^2 sin x and check your answer with the tool.",
    profile: jcAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Name the product rule, derive 2x sin x + x^2 cos x, and verify using equationSolver in 'derivative' mode rather than claiming verification without a call.",
      goldReply:
        "By the product rule with u = x^2 and v = sin x, dy/dx = 2x sin x + x^2 cos x, which the derivative mode of the tool confirms.",
      mustInclude: ["product rule", "cos"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-exact-fraction-preferred",
    suiteId: "math",
    kind: "teaching",
    title: "Exact fraction preferred over decimal",
    prompt: "What is 1/3 + 1/6? Give the exact answer.",
    profile: primaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "The exact answer is 1/2. The tool reports an exact fraction alongside the decimal; state the fraction and do not answer only with 0.5 or a rounded decimal such as 0.4999999.",
      goldReply:
        "1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2. As a decimal that is 0.5, but the exact answer is 1/2.",
      // No literal check: 1/2 and \frac{1}{2} are both right. The judge checks the value,
      // and a floating-point artefact is still rejected.
      mustNotInclude: ["0.4999"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-integration-tool-limit",
    suiteId: "math",
    kind: "teaching",
    title: "Honest about no symbolic integration",
    prompt: "Integrate x^2 with respect to x and verify it with your tool.",
    profile: jcAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "The answer is x^3/3 + C. The tool has no symbolic integration, so the agent must integrate by hand. Differentiating x^3/3 back to x^2 IS a valid verification of the antiderivative and should be credited; what must not be claimed is that the tool performed the integration.",
      goldReply:
        "Integrating gives x^3/3 + C. My tool cannot integrate symbolically, so I checked it the other way: differentiating x^3/3 returns x^2.",
      // NOTE: literal check rejects valid LaTeX such as \\frac{x^3}{3}. Scaffold only.
      mustInclude: ["3"],
      mustNotInclude: ["the tool integrated"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-simultaneous-tool-limit",
    suiteId: "math",
    kind: "teaching",
    title: "Simultaneous equations done by hand",
    prompt: "Solve 2x + y = 7 and x - y = 2 using your solver.",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "solve mode refuses two unknowns. The agent should do elimination by hand, showing steps, reaching x = 3 and y = 1, and may verify by substitution. It must not claim the solver handled the pair.",
      goldReply:
        "My solver handles one unknown at a time, so I will eliminate by hand. Adding the equations: 3x = 9, so x = 3, and then y = 1. Substituting back checks both equations.",
      mustInclude: ["3", "1"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-method-marks",
    suiteId: "math",
    kind: "teaching",
    title: "Final answer only, when that is what is asked",
    prompt: "Just give me the final answer for the sum of the first 20 terms of 3, 7, 11, ...",
    profile: jcAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "An AP sum is H2 content (9758 Sequences and Series), not O-Level. AP with a = 3, d = 4, n = 20, so S = 20/2 (2*3 + 19*4) = 820. Respect the request: give 820, with at most one line of method. Do not claim method marks are always awarded: at H2, unsupported GC answers are generally accepted unless the question says otherwise.",
      goldReply:
        "820. (It is an AP with a = 3 and d = 4, so S_20 = 10(2 × 3 + 19 × 4) = 820.)",
      mustInclude: ["820"],
      requiredTools: ["equationSolver"],
    },
  },
  {
    id: "math-graph-quadratic",
    suiteId: "math",
    kind: "teaching",
    title: "Sketch a quadratic and read it",
    prompt: "Sketch y = x^2 - 4x + 3 and tell me its roots and turning point.",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Call drawMathGraph for the sketch, then read it: roots at x = 1 and x = 3, minimum turning point at (2, -1). The graph supports the explanation; it does not replace it.",
      goldReply:
        "The curve crosses the x-axis at x = 1 and x = 3, and has a minimum turning point at (2, -1), which the sketch shows.",
      mustInclude: ["1", "3"],
      requiredTools: ["drawMathGraph"],
    },
  },
  {
    id: "math-graph-reciprocal",
    suiteId: "math",
    kind: "teaching",
    title: "Reciprocal graph has two branches",
    prompt: "Draw y = 1/x for me and explain its shape.",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Call drawMathGraph. Explain the two separate branches and that the curve is undefined at x = 0, approaching the axes without meeting them.",
      goldReply:
        "y = 1/x has two branches either side of x = 0, where it is undefined. It approaches both axes without ever touching them.",
      mustInclude: ["0"],
      // The graph is drawn by the tool; its data must never appear in the reply (eval run 2).
      mustNotInclude: ['"x":', "<jsxgraph"],
      requiredTools: ["drawMathGraph"],
    },
  },
  {
    id: "math-graph-not-needed",
    suiteId: "math",
    kind: "teaching",
    title: "No sketch for plain arithmetic",
    prompt: "What is 7 times 8?",
    profile: primaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Answer 56 directly. A sketch adds nothing here. NOTE: the runner records tool names only, so this cannot prove a tool was NOT called; it is a prompt-behaviour scaffold pending richer tool evidence.",
      goldReply: "7 x 8 = 56.",
      mustInclude: ["56"],
    },
  },
  {
    id: "math-solve-shows-working",
    suiteId: "math",
    kind: "teaching",
    title: "Plain solve request still teaches",
    prompt: "Solve x^2 + 6x + 5 = 0",
    profile: secondaryAlex,
    targetAgent: "math",
    scaffold: {
      contract:
        "Found in the first live run: the agent called the solver and replied with the roots alone. The answer must name a method and show the working a student would write, then give x = -1 and x = -5. Any valid method is acceptable (factorising, completing the square, the formula). The phrase checks below confirm only the roots and the tool call; naming a method and showing working must be judged against this contract, not string-matched.",
      goldReply:
        "Factorise: x^2 + 6x + 5 = (x + 1)(x + 5) = 0, so x + 1 = 0 or x + 5 = 0. Hence x = -1 or x = -5.",
      mustInclude: ["-1", "-5"],
      requiredTools: ["equationSolver"],
    },
  },
];
