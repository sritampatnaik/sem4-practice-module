import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildTestingInstructions, TESTING_PROMPT_VERSION } from "./prompts";
import { selectAssessmentSourceTool } from "./subject-source";
import {
  createFlashcardsTool,
  createMcqSetTool,
  createMermaidDiagramTool,
  getChemistryAssessmentSourceTool,
  getMathAssessmentSourceTool,
  getPhysicsAssessmentSourceTool,
  getRecentPerformanceTool,
  planAssessmentTool,
  recordPerformanceTool,
} from "./tools";

function requiredFirstStepTool(messages: Array<{ role?: string; content?: unknown }>) {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  const text =
    typeof latest?.content === "string"
      ? latest.content
      : JSON.stringify(latest?.content ?? "");

  return selectAssessmentSourceTool(text);
}

export function createTestingAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "testing",
    model: getModel(),
    instructions: buildTestingInstructions(ctx),
    tools: {
      planAssessment: planAssessmentTool,
      getRecentPerformance: getRecentPerformanceTool(ctx),
      getPhysicsAssessmentSource: getPhysicsAssessmentSourceTool,
      getMathAssessmentSource: getMathAssessmentSourceTool,
      getChemistryAssessmentSource: getChemistryAssessmentSourceTool,
      createMcqSet: createMcqSetTool,
      createFlashcards: createFlashcardsTool,
      createMermaidDiagram: createMermaidDiagramTool,
      recordPerformance: recordPerformanceTool(ctx),
      documentSearchMath: documentSearchTool("math"),
      documentSearchPhysics: documentSearchTool("physics"),
      documentSearchChemistry: documentSearchTool("chemistry"),
    },
    prepareStep: ({ stepNumber, messages }) => {
      if (stepNumber !== 0) return {};
      const toolName = requiredFirstStepTool(messages);
      return toolName ? { toolChoice: { type: "tool", toolName } } : {};
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
