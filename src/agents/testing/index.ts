import { ToolLoopAgent, stepCountIs, wrapLanguageModel } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { testingGuardrails } from "./guardrails";
import { buildTestingInstructions, TESTING_PROMPT_VERSION } from "./prompts";
import { extractAssessmentTopics } from "./assessment-planner";
import { selectAssessmentSourceTool } from "./subject-source";
import {
  createFlashcardsTool,
  createMcqSetTool,
  createMermaidDiagramTool,
  getChemistryAssessmentSourceTool,
  getMathAssessmentSourceTool,
  getPhysicsAssessmentSourceTool,
  getRecentPerformanceTool,
  getTopicScoreContextTool,
  planAssessmentTool,
  recordPerformanceTool,
} from "./tools";

function hasTopicScopedScoreHint(request: string, notes: string[]) {
  const topics = extractAssessmentTopics(request);
  if (!topics.length) return false;

  const topicWords = topics
    .flatMap((topic) => topic.toLowerCase().split(/\s+/))
    .filter((word) => word.length >= 3);

  return notes.some((note) => {
    const lower = note.toLowerCase();
    if (!topicWords.some((word) => lower.includes(word))) return false;
    return /\d+(?:\.\d+)?\s*%/.test(lower) && /trend[:\s]+(improving|regressing|stable|new)/i.test(lower);
  });
}

function requiredFirstStepTool(
  ctx: AgentRuntimeContext,
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

  if (looksLikeAssessmentRequest && hasTopicScopedScoreHint(text, ctx.profile.notes)) {
    return "getTopicScoreContext";
  }

  return selectAssessmentSourceTool(text);
}

export function createTestingAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "testing",
    model: wrapLanguageModel({ model: getModel(), middleware: testingGuardrails }),
    instructions: buildTestingInstructions(ctx),
    tools: {
      planAssessment: planAssessmentTool,
      getTopicScoreContext: getTopicScoreContextTool(ctx),
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
      const toolName = requiredFirstStepTool(ctx, messages);
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
