import { ToolLoopAgent, stepCountIs, wrapLanguageModel } from "ai";
import { getModel } from "@/lib/llm";
import { documentSearchTool, webSearchTool } from "../_shared/tools";
import type { AgentRuntimeContext } from "../_shared/types";
import { buildChemistryInstructions, CHEMISTRY_PROMPT_VERSION } from "./prompts";
import { periodicTableTool, reactionBalancerTool } from "./tools";
import { chemistryGuardrails } from "./guardrails";

export function createChemistryAgent(ctx: AgentRuntimeContext) {
  return new ToolLoopAgent({
    id: "chemistry",
    model: wrapLanguageModel({ model: getModel(), middleware: chemistryGuardrails }),
    instructions: buildChemistryInstructions(ctx),
    tools: {
      periodicTable: periodicTableTool,
      reactionBalancer: reactionBalancerTool,
      documentSearch: documentSearchTool("chemistry"),
      webSearch: webSearchTool,
    },
    stopWhen: stepCountIs(8),
    temperature: 0.2,
  });
}

export const chemistryMeta = {
  id: "chemistry" as const,
  owner: "Lizabeth Annabel Tukiman",
  promptVersion: CHEMISTRY_PROMPT_VERSION,
};
