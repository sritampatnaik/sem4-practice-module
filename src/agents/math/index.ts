import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool, webSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildMathInstructions, MATH_PROMPT_VERSION } from "./prompts";
import { equationSolverTool } from "./tools";

function requiredFirstStepTool(
  messages: Array<{ role?: string; content?: unknown }>,
) {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  const text =
    typeof latest?.content === "string"
      ? latest.content
      : JSON.stringify(latest?.content ?? "");

  if (
    /\b(?:what is|solve|differentiat|integrat|show working|simplif|factor|probability|triangle|equation)\b/i.test(
      text,
    )
  ) {
    return "equationSolver";
  }

  if (
    /\b(?:is .* in|syllabus|o-?level|a-?level|h1|h2|primary|university|topology|homology|maclaurin)\b/i.test(
      text,
    )
  ) {
    return "documentSearch";
  }

  return undefined;
}

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
    prepareStep: ({ stepNumber, messages }) => {
      if (stepNumber !== 0) return {};
      const toolName = requiredFirstStepTool(messages);
      return toolName ? { toolChoice: { type: "tool", toolName } } : {};
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
