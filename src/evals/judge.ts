import { generateText, Output } from "ai";
import { z } from "zod";
import { getModel, getModelId } from "@/lib/llm";
import { toDatasetItem } from "./dataset-item";
import type { Evaluator } from "./evaluator-types";
import type { EvalCheck, EvalItem, GoldRouting } from "./types";

const judgeSchema = z.object({
  accuracy: z.number(),
  passed: z.boolean(),
  checks: z.array(
    z.object({
      name: z.string(),
      passed: z.boolean(),
      detail: z.string(),
    }),
  ),
});

export async function scoreWithLlmJudge(options: {
  evaluator: Evaluator;
  item: EvalItem;
  actualText: string;
  toolCalls: string[];
  actualRouting?: GoldRouting;
}): Promise<{ accuracy: number; passed: boolean; checks: EvalCheck[]; model: string }> {
  const { evaluator, item, actualText, toolCalls, actualRouting } = options;
  const threshold = evaluator.config.passThreshold ?? 0.7;
  const dataset = toDatasetItem(item);
  const result = await generateText({
    model: getModel(),
    system: evaluator.config.prompt?.trim() || "Score the tutor reply against the gold eval JSON.",
    prompt: JSON.stringify(
      {
        dataset,
        actual: {
          text: actualText,
          toolCalls,
          routing: actualRouting ?? null,
        },
      },
      null,
      2,
    ),
    output: Output.object({ schema: judgeSchema }),
    temperature: 0,
  });
  const judged = result.output;
  if (!judged) {
    return {
      accuracy: 0,
      passed: false,
      checks: [{ name: `${evaluator.id}:error`, passed: false, detail: "Judge returned no score." }],
      model: getModelId(),
    };
  }
  const accuracy = Math.min(1, Math.max(0, judged.accuracy));
  return {
    accuracy: Number(accuracy.toFixed(3)),
    passed: judged.passed && accuracy >= threshold,
    checks: judged.checks.map((check) => ({
      ...check,
      name: `${evaluator.id}:${check.name}`,
    })),
    model: getModelId(),
  };
}
