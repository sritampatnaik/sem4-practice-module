import { ToolLoopAgent, stepCountIs, wrapLanguageModel } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { createTestingGuardrails } from "./guardrails";
import { buildTestingInstructions, TESTING_PROMPT_VERSION } from "./prompts";
import { selectAssessmentSourceTool } from "./subject-source";
import {
  buildCreateFlashcardsTool,
  buildCreateMcqSetTool,
  createChemistryAssessmentSourceTool,
  createMathAssessmentSourceTool,
  createPhysicsAssessmentSourceTool,
  createMermaidDiagramTool,
  getRecentPerformanceTool,
  getTopicScoreContextTool,
  planAssessmentTool,
  recordPerformanceTool,
} from "./tools";

function requiredFirstStepTool(
  messages: Array<{ role?: string; content?: unknown }>,
) {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  const text =
    typeof latest?.content === "string"
      ? latest.content
      : JSON.stringify(latest?.content ?? "");

  const looksLikeAssessmentRequest =
    /\b(?:quiz|mcq|mcqs|flashcards?|revision cards?|study cards?|test me|practice questions?|assessment)\b/i.test(
      text,
    );
  const sourceTool = selectAssessmentSourceTool(text);

  if (looksLikeAssessmentRequest && sourceTool) {
    return sourceTool;
  }

  return sourceTool;
}

export function createTestingAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "testing",
    model: wrapLanguageModel({ model: getModel(), middleware: createTestingGuardrails(ctx) }),
    instructions: buildTestingInstructions(ctx),
    tools: {
      planAssessment: planAssessmentTool,
      getTopicScoreContext: getTopicScoreContextTool(ctx),
      getRecentPerformance: getRecentPerformanceTool(ctx),
      getPhysicsAssessmentSource: createPhysicsAssessmentSourceTool(ctx),
      getMathAssessmentSource: createMathAssessmentSourceTool(ctx),
      getChemistryAssessmentSource: createChemistryAssessmentSourceTool(ctx),
      createMcqSet: buildCreateMcqSetTool(ctx),
      createFlashcards: buildCreateFlashcardsTool(ctx),
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
