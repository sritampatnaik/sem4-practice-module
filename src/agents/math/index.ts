import { ToolLoopAgent, stepCountIs, wrapLanguageModel } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool, webSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildMathInstructions, MATH_PROMPT_VERSION } from "./prompts";
import { drawMathGraphTool, equationSolverTool } from "./tools";
import { mathGuardrails } from "./guardrails";

type MathToolName = "equationSolver" | "drawMathGraph" | "documentSearch";

/**
 * Output cap per step. The longest normal reply in the 2026-09-29 baseline was
 * 364 tokens; the one runaway (a self-drawn graph) reached 16,414. 2,000 leaves
 * room for a long multi-part worked solution while bounding cost, and the
 * guardrail tells the student when a reply was cut short.
 */
export const MATH_MAX_OUTPUT_TOKENS = 2000;

/**
 * Picks the tool the first step must use, where the question makes it obvious.
 *
 * Prompt instructions alone do not guarantee a tool call, and an unverified
 * calculation or an ungrounded syllabus claim is exactly what this agent must
 * not produce. Anything ambiguous returns undefined and the model chooses.
 */
export function requiredFirstStepTool(messages: Array<{ role?: string; content?: unknown }>) {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  const text = typeof latest?.content === "string" ? latest.content : JSON.stringify(latest?.content ?? "");

  // Asking about the syllabus or the paper must be answered from evidence,
  // never from the model's recollection of a mark scheme.
  if (
    /\b(syllabus|in (?:the )?(?:primary|secondary|o-level|a-level|h1|h2)|examinable|exam format|paper [12]|marks?|mark scheme|calculator|formula (?:sheet|list)|mf27|weighting)\b/i.test(
      text,
    )
  ) {
    return "documentSearch" as const;
  }

  // An explicit request to see the shape.
  if (/\b(sketch|draw|plot|graph|curve)\b/i.test(text)) {
    return "drawMathGraph" as const;
  }

  // Arithmetic and algebra that should be checked rather than asserted: either
  // a verb asking for it, or numbers joined by an operator ("3/4 of 12").
  const asksToCalculate =
    /\b(solve|differentiate|derivative|simplify|expand|factorise|factorize|evaluate|calculate|compute|work out|roots?|turning point)\b/i.test(
      text,
    );
  const hasArithmetic =
    /\d\s*[-+*/×÷^]\s*\d/.test(text) ||
    /\d\s*(?:times|plus|minus|divided by|multiplied by)\s*\d/i.test(text);
  if (asksToCalculate || hasArithmetic) {
    return "equationSolver" as const;
  }

  return undefined;
}

export function createMathAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "math",
    model: wrapLanguageModel({ model: getModel(), middleware: mathGuardrails }),
    instructions: buildMathInstructions(ctx),
    tools: {
      equationSolver: equationSolverTool,
      drawMathGraph: drawMathGraphTool,
      documentSearch: documentSearchTool("math"),
      webSearch: webSearchTool,
    },
    prepareStep: ({ stepNumber, messages }) => {
      if (stepNumber !== 0) return {};
      const toolName: MathToolName | undefined = requiredFirstStepTool(messages);
      return toolName ? { toolChoice: { type: "tool", toolName } } : {};
    },
    stopWhen: stepCountIs(8),
    maxOutputTokens: MATH_MAX_OUTPUT_TOKENS,
    temperature: 0.2,
  });
}

export const mathMeta = {
  id: "math" as const,
  owner: "Gu Haixiang",
  promptVersion: MATH_PROMPT_VERSION,
};
