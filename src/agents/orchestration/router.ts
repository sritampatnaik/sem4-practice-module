import { generateText, Output } from "ai";
import { z } from "zod";
import {
  asChoice,
  decideWithJev,
  type JevChoiceAnswer,
  type JevResponse,
} from "@/lib/jev";
import { getModel } from "@/lib/llm";
import {
  AGENT_IDS,
  GRADE_LEVELS,
  INTENTS,
  type AgentId,
  type AgentRuntimeContext,
  type GradeLevel,
  type Intent,
  type RoutingDecision,
  SUBJECTS,
} from "../_shared/types";

import {
  buildRoutingInstructions,
  ROUTING_PROMPT_VERSION,
} from "./prompts";

export const ROUTING_JEV_MIN_CONFIDENCE = 0.55;

const routingSchema = z.object({
  intent: z.enum(INTENTS),
  subject: z.enum(["math", "physics", "chemistry", "none"]),
  agent: z.enum(AGENT_IDS),
  gradeLevel: z.enum(GRADE_LEVELS),
  rationale: z.string(),
  confidence: z.number(),
});

const ROUTING_QUESTIONS = {
  intent: {
    type: "choice" as const,
    instructions:
      "What does the student want on this turn? Prefer testing only when they clearly want questions now. Greetings, profile questions, off-topic chat, and unclear subjects are general.",
    criteria: {
      teaching: "Explanations, worked solutions, or concept help for a school subject",
      testing: "Quizzes, MCQs, flashcards, practice questions, or being tested now",
      general:
        "Greetings, profile questions, off-topic, unclear subject, or questions about METS itself",
    },
  },
  subject: {
    type: "choice" as const,
    instructions:
      "Which school subject is this about? Infer from the problem, not just keywords. A kinematics word problem is physics, not math, unless they ask only for the algebra.",
    criteria: {
      math: "Mathematics including algebra, calculus, geometry, statistics, or Additional Mathematics",
      physics:
        "Physics including forces, motion, kinematics, waves, electricity, circuits, or optics",
      chemistry:
        "Chemistry including moles, bonding, acids, organic, redox, or the periodic table",
      none: "No school subject, or the subject is unclear",
    },
  },
  agent: {
    type: "choice" as const,
    instructions:
      "Which METS agent should answer this turn? Choose orchestration if the subject is unclear, this is a greeting, or they are asking about METS.",
    criteria: {
      math: "Teach mathematics",
      physics: "Teach physics",
      chemistry: "Teach chemistry",
      testing: "Generate a quiz, MCQ set, or flashcards",
      orchestration: "Concierge: greet, clarify, or stay off specialist teaching",
    },
  },
  gradeLevel: {
    type: "choice" as const,
    instructions:
      "Which Singapore grade band does this query belong to? Prefer the student's profile band unless the query clearly belongs to another.",
    criteria: {
      primary: "Primary 1 to 6",
      secondary: "Secondary 1 to 5 / O-Level / N-Level",
      jc: "Junior College / A-Level",
    },
  },
};

function lastUserText(messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser?.parts) return "";
  return lastUser.parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n");
}

function pick<T extends string>(value: string, allowed: readonly T[]): T | null {
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export type RoutingTurnResult = RoutingDecision & {
  usage?: { inputTokens?: number; outputTokens?: number };
};

export function applyRoutingConsistency(input: {
  intent: Intent;
  subject: RoutingDecision["subject"];
  agent: AgentId;
  gradeLevel: GradeLevel;
  confidence: number;
  rationale: string;
}): RoutingDecision {
  let { intent, subject, agent } = input;

  if (intent === "testing") {
    agent = "testing";
  } else if (intent === "general" || subject === "none") {
    agent = "orchestration";
    if (intent === "general") subject = "none";
  } else if (intent === "teaching") {
    agent = subject;
  }

  if (input.confidence < ROUTING_JEV_MIN_CONFIDENCE) {
    return {
      intent: "general",
      subject: "none",
      agent: "orchestration",
      gradeLevel: input.gradeLevel,
      rationale: `Jev was unsure (${pct(input.confidence)}%), so the concierge will clarify.`,
      confidence: input.confidence,
      promptVersion: ROUTING_PROMPT_VERSION,
    };
  }

  return {
    intent,
    subject,
    agent,
    gradeLevel: input.gradeLevel,
    rationale: input.rationale,
    confidence: input.confidence,
    promptVersion: ROUTING_PROMPT_VERSION,
  };
}

export function decisionFromJevRouting(options: {
  answers: {
    intent: JevChoiceAnswer;
    subject: JevChoiceAnswer;
    agent: JevChoiceAnswer;
    gradeLevel?: JevChoiceAnswer;
  };
  profileGrade: GradeLevel;
  usage?: { inputTokens?: number; outputTokens?: number };
}): RoutingTurnResult | null {
  const intent = pick(options.answers.intent.choice, INTENTS);
  const subject = pick(options.answers.subject.choice, [...SUBJECTS, "none"] as const);
  const agent = pick(options.answers.agent.choice, AGENT_IDS);
  const gradeLevel =
    (options.answers.gradeLevel
      ? pick(options.answers.gradeLevel.choice, GRADE_LEVELS)
      : null) ?? options.profileGrade;

  if (!intent || !subject || !agent) return null;

  const confidence = Math.min(options.answers.intent.confidence, options.answers.agent.confidence);
  const routed = applyRoutingConsistency({
    intent,
    subject,
    agent,
    gradeLevel,
    confidence,
    rationale: `Jev routed to ${agent} (${intent}${subject === "none" ? "" : `, ${subject}`}) at ${pct(confidence)} confidence.`,
  });

  return { ...routed, usage: options.usage };
}

function routingFromJevResponse(
  response: JevResponse,
  profileGrade: GradeLevel,
): RoutingTurnResult | null {
  const intent = asChoice(response.answers.intent);
  const subject = asChoice(response.answers.subject);
  const agent = asChoice(response.answers.agent);
  const gradeLevel = asChoice(response.answers.gradeLevel);
  if (!intent || !subject || !agent) return null;
  return decisionFromJevRouting({
    answers: { intent, subject, agent, gradeLevel: gradeLevel ?? undefined },
    profileGrade,
    usage: response.usage,
  });
}

export function heuristicRoute(query: string, gradeLevel: RoutingDecision["gradeLevel"]): RoutingDecision {
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

async function classifyWithLlm(options: {
  ctx: AgentRuntimeContext;
  query: string;
}): Promise<RoutingTurnResult> {
  const result = await generateText({
    model: getModel(),
    system: buildRoutingInstructions(options.ctx),
    prompt: `Student grade band: ${options.ctx.profile.gradeLevel}\nLatest message:\n${options.query}`,
    output: Output.object({ schema: routingSchema }),
    temperature: 0,
  });

  const routed = result.output;
  const usage = {
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
  };
  if (!routed) {
    return { ...heuristicRoute(options.query, options.ctx.profile.gradeLevel), usage };
  }
  return {
    ...routed,
    gradeLevel: routed.gradeLevel || options.ctx.profile.gradeLevel,
    promptVersion: ROUTING_PROMPT_VERSION,
    usage,
  };
}

export async function routeStudentTurn(options: {
  ctx: AgentRuntimeContext;
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>;
}): Promise<RoutingTurnResult> {
  const query = lastUserText(options.messages);
  const gradeLevel = options.ctx.profile.gradeLevel;

  try {
    const jev = await decideWithJev({
      state: {
        studentGradeBand: gradeLevel,
        studentYear: options.ctx.profile.grade ?? null,
        latestMessage: query,
      },
      questions: ROUTING_QUESTIONS,
    });
    const routed = jev ? routingFromJevResponse(jev, gradeLevel) : null;
    if (routed) return routed;
  } catch {
    // Fall through to the LLM classifier, then keywords.
  }

  try {
    return await classifyWithLlm({ ctx: options.ctx, query });
  } catch {
    return heuristicRoute(query, gradeLevel);
  }
}
