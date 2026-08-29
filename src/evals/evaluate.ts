import { evaluatorsForSuite, type Evaluator } from "./evaluator-types";
import { listEvaluators } from "./evaluators";
import { scoreWithLlmJudge } from "./judge";
import { scoreAgainstScaffold } from "./score";
import type { EvalCheck, EvalItem, GoldRouting } from "./types";

export type EvaluatedScore = {
  accuracy: number;
  passed: boolean;
  checks: EvalCheck[];
};

function codeScore(
  evaluator: Evaluator,
  options: {
    item: EvalItem;
    actualText: string;
    toolCalls: string[];
    actualRouting?: GoldRouting;
  },
): EvaluatedScore {
  const scored = scoreAgainstScaffold(options);
  const threshold = evaluator.config.passThreshold ?? 0.7;
  return {
    accuracy: scored.accuracy,
    passed: scored.passed && scored.accuracy >= threshold,
    checks: scored.checks.map((check) => ({
      ...check,
      name: `${evaluator.id}:${check.name}`,
    })),
  };
}

export async function evaluateItem(options: {
  item: EvalItem;
  actualText: string;
  toolCalls: string[];
  actualRouting?: GoldRouting;
}): Promise<EvaluatedScore> {
  const evaluators = evaluatorsForSuite(listEvaluators(), options.item.suiteId);
  const parts: EvaluatedScore[] = [];
  for (const evaluator of evaluators) {
    if (evaluator.kind === "llm") {
      try {
        parts.push(await scoreWithLlmJudge({ evaluator, ...options }));
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        parts.push({
          accuracy: 0,
          passed: false,
          checks: [{ name: `${evaluator.id}:error`, passed: false, detail }],
        });
      }
    } else {
      parts.push(codeScore(evaluator, options));
    }
  }
  if (!parts.length) return scoreAgainstScaffold(options);
  const accuracy = parts.reduce((sum, part) => sum + part.accuracy, 0) / parts.length;
  return {
    accuracy: Number(accuracy.toFixed(3)),
    passed: parts.every((part) => part.passed),
    checks: parts.flatMap((part) => part.checks),
  };
}
