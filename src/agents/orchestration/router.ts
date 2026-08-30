import { generateText, Output } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/llm";
import type { AgentRuntimeContext, RoutingDecision } from "../_shared/types";
import {
  buildRoutingInstructions,
  ROUTING_PROMPT_VERSION,
} from "./prompts";

const routingSchema = z.object({
  intent: z.enum(["teaching", "testing", "general"]),
  subject: z.enum(["math", "physics", "chemistry", "none"]),
  agent: z.enum(["math", "physics", "chemistry", "testing", "orchestration"]),
  gradeLevel: z.enum(["primary", "secondary", "jc"]),
  rationale: z.string(),
  confidence: z.number(),
});

function lastUserText(messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser?.parts) return "";
  return lastUser.parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n");
}

export type RoutingTurnResult = RoutingDecision & {
  usage?: { inputTokens?: number; outputTokens?: number };
};

export async function routeStudentTurn(options: {
  ctx: AgentRuntimeContext;
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>;
}): Promise<RoutingTurnResult> {
  const query = lastUserText(options.messages);

  try {
    const result = await generateText({
      model: getModel(),
      system: buildRoutingInstructions(options.ctx),
      prompt: `Student grade band: ${options.ctx.profile.gradeLevel}\nLatest message:\n${query}`,
      output: Output.object({ schema: routingSchema }),
      temperature: 0,
    });

    const routed = result.output;
    const usage = {
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
    };
    if (!routed) {
      return { ...heuristicRoute(query, options.ctx.profile.gradeLevel), usage };
    }
    return {
      ...routed,
      gradeLevel: routed.gradeLevel || options.ctx.profile.gradeLevel,
      promptVersion: ROUTING_PROMPT_VERSION,
      usage,
    };
  } catch {
    return heuristicRoute(query, options.ctx.profile.gradeLevel);
  }
}

function heuristicRoute(query: string, gradeLevel: RoutingDecision["gradeLevel"]): RoutingDecision {
  const text = query.toLowerCase();
  const testing = /quiz|mcq|flashcard|test me|practice question|assessment/.test(text);
  const math = /math|algebra|calculus|equation|triangle|probability|differenti/.test(text);
  const physics = /physics|force|velocity|ohm|wave|newton|circuit|lens/.test(text);
  const chemistry = /chem|mole|bond|periodic|acid|organic|react/.test(text);

  const agent = testing
    ? "testing"
    : math
      ? "math"
      : physics
        ? "physics"
        : chemistry
          ? "chemistry"
          : "orchestration";

  return {
    intent: testing ? "testing" : agent === "orchestration" ? "general" : "teaching",
    subject: agent === "math" || agent === "physics" || agent === "chemistry" ? agent : "none",
    agent,
    gradeLevel,
    rationale: "Fallback keyword route after structured classification failed.",
    confidence: 0.35,
    promptVersion: ROUTING_PROMPT_VERSION,
  };
}
