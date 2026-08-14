import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import type { AgentRuntimeContext } from "../_shared/types";
import {
  buildOrchestrationInstructions,
  ORCHESTRATION_PROMPT_VERSION,
} from "./prompts";

export function createOrchestrationAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "orchestration",
    model: getModel(),
    instructions: buildOrchestrationInstructions(ctx),
    stopWhen: stepCountIs(4),
    temperature: 0.4,
  });
}

export const orchestrationMeta = {
  id: "orchestration" as const,
  owner: "Sritam Patnaik",
  promptVersion: ORCHESTRATION_PROMPT_VERSION,
};
