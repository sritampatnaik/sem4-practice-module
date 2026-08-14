import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool, webSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildPhysicsInstructions, PHYSICS_PROMPT_VERSION } from "./prompts";
import { formulaLookupTool, unitConverterTool } from "./tools";

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
    stopWhen: stepCountIs(8),
    temperature: 0.2,
  });
}

export const physicsMeta = {
  id: "physics" as const,
  owner: "Chua Hieng Weih",
  promptVersion: PHYSICS_PROMPT_VERSION,
};
