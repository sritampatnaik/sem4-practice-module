import { ToolLoopAgent, stepCountIs, wrapLanguageModel } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool, webSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildMathInstructions, MATH_PROMPT_VERSION } from "./prompts";
import { examFactsTool } from "./exam-facts";
import { requiredFirstStepTool } from "./first-step";
import { drawMathGraphTool, equationSolverTool } from "./tools";
import { mathGuardrails } from "./guardrails";

/**
 * Output cap per step. The longest normal reply in the 2026-09-29 baseline was
 * 364 tokens; the one runaway (a self-drawn graph) reached 16,414. 2,000 leaves
 * room for a long multi-part worked solution while bounding cost, and the
 * guardrail tells the student when a reply was cut short.
 */
export const MATH_MAX_OUTPUT_TOKENS = 2000;

export function createMathAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "math",
    model: wrapLanguageModel({ model: getModel(), middleware: mathGuardrails }),
    instructions: buildMathInstructions(ctx),
    tools: {
      equationSolver: equationSolverTool,
      drawMathGraph: drawMathGraphTool,
      documentSearch: documentSearchTool("math"),
      examFacts: examFactsTool,
      webSearch: webSearchTool,
    },
    prepareStep: ({ stepNumber, messages }) => {
      if (stepNumber !== 0) return {};
      const toolName = requiredFirstStepTool(messages);
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
