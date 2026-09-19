import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool, webSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildPhysicsInstructions, PHYSICS_PROMPT_VERSION } from "./prompts";
import { formulaLookupTool, unitConverterTool } from "./tools";

type PhysicsToolName = "formulaLookup" | "unitConverter" | "documentSearch";

function requiredFirstStepTool(messages: Array<{ role?: string; content?: unknown }>) {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  const text = typeof latest?.content === "string" ? latest.content : JSON.stringify(latest?.content ?? "");

  if (/\b(convert|conversion|km\/h|m\/s|celsius|kelvin|unit)\b/i.test(text)) {
    return "unitConverter" as const;
  }
  if (
    /\b(syllabus|curriculum|o-level or a-level|in (the )?(primary|secondary|jc|o-level|a-level)|grade band)\b/i.test(
      text,
    )
  ) {
    return "documentSearch" as const;
  }
  if (
    /\b(calculate|compute|find|solve|determine|formula|f\s*=\s*ma|ohm|suvat|wave equation|kinetic energy|potential energy|thin lens|sign convention)\b/i.test(
      text,
    ) && /\d|force|speed|velocity|resistance|energy|wave|lens|formula|ohm|suvat/i.test(text)
  ) {
    return "formulaLookup" as const;
  }
  return undefined;
}

export function createPhysicsAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "physics",
    model: getModel(),
    instructions: buildPhysicsInstructions(ctx),
    tools: {
      formulaLookup: formulaLookupTool,
      unitConverter: unitConverterTool,
      documentSearch: documentSearchTool("physics"),
      webSearch: webSearchTool,
    },
    prepareStep: ({ stepNumber, messages }) => {
      if (stepNumber !== 0) return {};
      const toolName: PhysicsToolName | undefined = requiredFirstStepTool(messages);
      return toolName ? { toolChoice: { type: "tool", toolName } } : {};
    },
    stopWhen: stepCountIs(8),
    temperature: 0.2,
  });
}

export const physicsMeta = {
  id: "physics" as const,
  owner: "Chua Hieng Weih",
  promptVersion: PHYSICS_PROMPT_VERSION,
};
