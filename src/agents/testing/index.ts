import { ToolLoopAgent, stepCountIs } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildTestingInstructions, TESTING_PROMPT_VERSION } from "./prompts";
import {
  createFlashcardsTool,
  createMcqSetTool,
  createMermaidDiagramTool,
  getPhysicsAssessmentSourceTool,
  getRecentPerformanceTool,
  planAssessmentTool,
  recordPerformanceTool,
} from "./tools";

type TestingToolName = "getPhysicsAssessmentSource";

function requiredFirstStepTool(messages: Array<{ role?: string; content?: unknown }>) {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  const text =
    typeof latest?.content === "string"
      ? latest.content
      : JSON.stringify(latest?.content ?? "");

  if (
    /\b(physics|kinematics|acceleration|velocity|speed|force|motion|moment|pressure|density|wave|light|lens|circuit|current|voltage|resistance|magnetism|electromagnetism)\b/i.test(
      text
    )
  ) {
    return "getPhysicsAssessmentSource" as const;
  }

  return undefined;
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
      const toolName: TestingToolName | undefined = requiredFirstStepTool(messages);
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
