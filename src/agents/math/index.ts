import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool, webSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildMathInstructions, MATH_PROMPT_VERSION } from "./prompts";
import { equationSolverTool } from "./tools";

export function createMathAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "math",
    model: getModel(),
    instructions: buildMathInstructions(ctx),
    tools: {
      equationSolver: equationSolverTool,
      documentSearch: documentSearchTool("math"),
      webSearch: webSearchTool,
    },
    stopWhen: stepCountIs(8),
    temperature: 0.2,
  });
}

export const mathMeta = {
  id: "math" as const,
  owner: "Gu Haixiang",
  promptVersion: MATH_PROMPT_VERSION,
};
