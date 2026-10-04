/**
 * Which tool the first step must use, where the question makes it obvious.
 *
 * A prompt instruction alone does not guarantee a tool call, and an unchecked
 * calculation or an ungrounded exam claim is exactly what this agent must not
 * produce. The rules are deliberately few and general; anything ambiguous
 * returns undefined and the model chooses. Each rule is tested with phrasings
 * that are not in the eval set (first-step.test.ts), including ones it must
 * leave alone.
 */

export type MathToolName = "equationSolver" | "drawMathGraph" | "documentSearch" | "examFacts";

// Exam format: named on its own, or a format word next to a named exam.
const EXAM_FORMAT_TERM = /\b(mf27|formula (?:sheet|list)|list of formulae|mark scheme|method marks)\b/i;
const FOUNDATION_VS_STANDARD = /\bfoundation\b[\s\S]{0,60}\bstandard\b|\bstandard\b[\s\S]{0,60}\bfoundation\b/i;
const NAMED_EXAM = /\b(paper [12]?|exams?|examination|psle|o-level|a-level|h[12]|additional maths)\b/i;
const FORMAT_WORD = /\b(marks?|marked|calculators?|durations?|how long|weight(?:ing|ings|ed)?|format|formulae?|given|grade)\b/i;

const SYLLABUS_COVERAGE = /\b(syllabus|examinable|in (?:the )?(?:primary|secondary|o-level|a-level|h1|h2))\b/i;

const SEE_THE_SHAPE = /\b(sketch|draw|plot|graph|curve)\b/i;

const CALCULATION_VERB =
  /\b(solve|differentiate|derivative|integrate|simplify|expand|factorise|factorize|evaluate|calculate|compute|work out|roots?|turning point)\b/i;
const OPERATOR_BETWEEN_NUMBERS = [/\d\s*[-+*/×÷^]\s*\d/, /\d\s*(?:times|plus|minus|divided by|multiplied by)\s*\d/i];
const QUANTITY_QUESTION =
  /\b(how (?:many|much|far|long|old)|find (?:the|its|their|[a-z]\b)|probability of|what (?:fraction|percentage)|sum of|total|average|area|perimeter|volume)\b/i;
const NUMBER = /\d|\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|hundred|thousand|half|quarter|dozen)\b/i;

const RULES: Array<{ tool: MathToolName; matches: (text: string) => boolean }> = [
  // How an examination works comes from the checked exam facts, never from
  // recollection. A format word only counts next to a named exam, so
  // "Ali scored 45 marks" stays a word problem.
  {
    tool: "examFacts",
    matches: (text) =>
      EXAM_FORMAT_TERM.test(text) ||
      FOUNDATION_VS_STANDARD.test(text) ||
      (NAMED_EXAM.test(text) && FORMAT_WORD.test(text)),
  },
  // Whether a topic is in a syllabus comes from the syllabus documents.
  { tool: "documentSearch", matches: (text) => SYLLABUS_COVERAGE.test(text) },
  // An explicit request to see the shape.
  { tool: "drawMathGraph", matches: (text) => SEE_THE_SHAPE.test(text) },
  // A calculation is checked rather than asserted: a verb asking for one, an
  // operator between numbers, or a word problem (numbers plus a quantity
  // question). The solver cannot integrate, but it checks an integral by
  // differentiating the answer.
  {
    tool: "equationSolver",
    matches: (text) =>
      CALCULATION_VERB.test(text) ||
      OPERATOR_BETWEEN_NUMBERS.some((pattern) => pattern.test(text)) ||
      (QUANTITY_QUESTION.test(text) && NUMBER.test(text)),
  },
];

export function requiredFirstStepTool(
  messages: Array<{ role?: string; content?: unknown }>,
): MathToolName | undefined {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  const text = typeof latest?.content === "string" ? latest.content : JSON.stringify(latest?.content ?? "");
  return RULES.find((rule) => rule.matches(text))?.tool;
}
