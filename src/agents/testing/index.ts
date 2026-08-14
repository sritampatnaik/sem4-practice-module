import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildTestingInstructions, TESTING_PROMPT_VERSION } from "./prompts";
import { createFlashcardsTool, createMcqSetTool } from "./tools";

export function createTestingAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "testing",
    model: getModel(),
    instructions: buildTestingInstructions(ctx),
    tools: {
      createMcqSet: createMcqSetTool,
      createFlashcards: createFlashcardsTool,
      documentSearchMath: documentSearchTool("math"),
      documentSearchPhysics: documentSearchTool("physics"),
      documentSearchChemistry: documentSearchTool("chemistry"),
    },
    stopWhen: stepCountIs(8),
    temperature: 0.5,
  });
}

export const testingMeta = {
  id: "testing" as const,
  owner: "Muhammad Harun Bin Abdul Rashid",
  promptVersion: TESTING_PROMPT_VERSION,
};
