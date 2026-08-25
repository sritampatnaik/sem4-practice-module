import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildTestingInstructions, TESTING_PROMPT_VERSION } from "./prompts";
import {
  createFlashcardsTool,
  createMcqSetTool,
  createMermaidDiagramTool,
  getRecentPerformanceTool,
  planAssessmentTool,
  recordPerformanceTool,
} from "./tools";

export function createTestingAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "testing",
    model: getModel(),
    instructions: buildTestingInstructions(ctx),
    tools: {
      planAssessment: planAssessmentTool,
      getRecentPerformance: getRecentPerformanceTool(ctx),
      createMcqSet: createMcqSetTool,
      createFlashcards: createFlashcardsTool,
      createMermaidDiagram: createMermaidDiagramTool,
      recordPerformance: recordPerformanceTool(ctx),
      documentSearchMath: documentSearchTool("math"),
      documentSearchPhysics: documentSearchTool("physics"),
      documentSearchChemistry: documentSearchTool("chemistry"),
    },
    stopWhen: stepCountIs(10),
    temperature: 0.5,
  });
}

export const testingMeta = {
  id: "testing" as const,
  owner: "Muhammad Harun Bin Abdul Rashid",
  promptVersion: TESTING_PROMPT_VERSION,
};
