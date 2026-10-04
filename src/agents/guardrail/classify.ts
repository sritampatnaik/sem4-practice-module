import { generateText, Output } from "ai";
import { z } from "zod";
import { asNoul, asScore, decideWithJev, type JevNoulAnswer, type JevScoreAnswer } from "@/lib/jev";
import { getModel } from "@/lib/llm";
import { previewText } from "@/lib/memory";
import {
  buildGuardrailInstructions,
  buildGuardrailUserPrompt,
  GUARDRAIL_PROMPT_VERSION,
} from "./prompts";
import type {
  GuardrailCategory,
  GuardrailClassification,
  GuardrailSeverity,
} from "./types";

const classificationSchema = z.object({
  categories: z.array(z.enum(["disappointment", "self_harm", "distress"])),
  severity: z.enum(["low", "medium", "high", "critical"]),
  reason: z.string(),
  snippet: z.string(),
  escalate: z.boolean(),
});

const SELF_HARM_PATTERNS = [
  /suicid/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bwant to die\b/i,
  /\bdon'?t want to (be alive|live)\b/i,
  /\bself[-\s]?harm\b/i,
  /\bcut myself\b/i,
  /\bhurt myself\b/i,
  /\bno reason to live\b/i,
  /\bi can'?t go on\b/i,
  /\bbetter off dead\b/i,
  /\bgive up on (my )?(life|living|myself)\b/i,
  /\bwant to give up on (my )?(life|living)\b/i,
  /\bno point (in )?(living|going on)\b/i,
  /\bnothing to live for\b/i,
  /\bend it all\b/i,
  /\bnot worth living\b/i,
  /\bwish i (was|were) dead\b/i,
  /\btired of living\b/i,
  /\bdon'?t see (the )?point (in|of) living\b/i,
];

const DISTRESS_PATTERNS = [
  /panic attack/i,
  /\bcan'?t (stop )?crying\b/i,
  /\bso anxious\b/i,
  /\bhaving a breakdown\b/i,
  /\bcan'?t breathe\b/i,
  /\bi'?m drowning\b/i,
];

const DISAPPOINTMENT_PATTERNS = [
  /\bi'?m a failure\b/i,
  /\bi'?m worthless\b/i,
  /\bhate myself\b/i,
  /\bi'?ll never (pass|succeed|make it)\b/i,
  /\bgive up on everything\b/i,
  /\bi'?m so useless\b/i,
];

const SEVERITY_RANK: Record<GuardrailSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function uniqueCategories(values: GuardrailCategory[]) {
  return [...new Set(values)];
}

function maxSeverity(a: GuardrailSeverity, b: GuardrailSeverity): GuardrailSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function severityFor(categories: GuardrailCategory[]): GuardrailSeverity {
  if (categories.includes("self_harm")) return "critical";
  if (categories.includes("distress")) return "high";
  if (categories.includes("disappointment")) return "medium";
  return "low";
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function heuristicClassify(studentText: string): GuardrailClassification {
  const text = studentText.trim();
  const snippet = previewText(text, 280);
  const categories: GuardrailCategory[] = [];
  if (matchesAny(text, SELF_HARM_PATTERNS)) categories.push("self_harm");
  if (matchesAny(text, DISTRESS_PATTERNS)) categories.push("distress");
  if (matchesAny(text, DISAPPOINTMENT_PATTERNS)) categories.push("disappointment");

  const hit = categories.length > 0;
  const severity = severityFor(categories);
  const reason = hit
    ? `Keyword monitor flagged ${categories.join(", ")} in the student's latest message.`
    : "No disappointment, distress, or self-harm language was detected.";

  return {
    hit,
    categories,
    severity,
    reason,
    snippet,
    escalate: hit,
    source: "heuristic",
  };
}

export function mergeClassifications(
  heuristic: GuardrailClassification,
  model: GuardrailClassification,
): GuardrailClassification {
  const categories = uniqueCategories([...heuristic.categories, ...model.categories]);
  const hit = categories.length > 0;
  const severity = hit
    ? maxSeverity(severityFor(categories), maxSeverity(heuristic.severity, model.severity))
    : "low";
  const reason = (model.reason || heuristic.reason).trim();
  return {
    hit,
    categories,
    severity,
    reason: reason || heuristic.reason,
    snippet: previewText(model.snippet || heuristic.snippet, 280),
    escalate: hit,
    source: heuristic.hit && model.hit ? "merged" : model.hit ? model.source : heuristic.source,
  };
}

export const JEV_NOUL_THRESHOLDS = {
  self_harm: 0.3,
  distress: 0.4,
  disappointment: 0.5,
} as const;

const GUARDRAIL_QUESTIONS = {
  disappointment: {
    type: "noul" as const,
    instructions:
      "The student sounds crushed, hopeless about school, calls themselves a failure, or wants to give up on everything — not ordinary academic struggle such as 'this question is hard' or 'I give up on this question'.",
  },
  self_harm: {
    type: "noul" as const,
    instructions:
      "The student expresses a wish to die, suicide, self-injury, being better off dead, or giving up on life, living, or themselves. Phrases such as 'I want to give up on life' are yes even without the word suicide. If unsure, prefer yes.",
  },
  distress: {
    type: "noul" as const,
    instructions:
      "The student shows panic, a breakdown, intense anxiety, or acute emotional crisis beyond normal exam stress.",
  },
  escalate: {
    type: "noul" as const,
    instructions:
      "Should a parent or tutor be notified now? Yes if disappointment, distress, or self-harm applies.",
  },
  severity: {
    type: "score" as const,
    instructions: "How serious is the safety concern in the student's latest message?",
    criteria: [
      "Ordinary academic struggle only",
      "Disappointment or failure talk about school",
      "Acute distress, panic, or breakdown",
      "Self-harm or giving up on life",
    ],
  },
};

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function severityFromJevScore(score: number): GuardrailSeverity {
  if (score >= 2.5) return "critical";
  if (score >= 1.5) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function classificationFromJev(options: {
  answers: {
    disappointment: JevNoulAnswer;
    self_harm: JevNoulAnswer;
    distress: JevNoulAnswer;
    escalate: JevNoulAnswer;
    severity?: JevScoreAnswer;
  };
  studentText: string;
}): GuardrailClassification {
  const categories: GuardrailCategory[] = [];
  if (options.answers.self_harm.noul >= JEV_NOUL_THRESHOLDS.self_harm) {
    categories.push("self_harm");
  }
  if (options.answers.distress.noul >= JEV_NOUL_THRESHOLDS.distress) {
    categories.push("distress");
  }
  if (options.answers.disappointment.noul >= JEV_NOUL_THRESHOLDS.disappointment) {
    categories.push("disappointment");
  }

  const hit = categories.length > 0;
  const scored = options.answers.severity
    ? severityFromJevScore(options.answers.severity.score)
    : "low";
  const severity = hit ? maxSeverity(severityFor(categories), scored) : "low";
  const flagged = [
    categories.includes("self_harm") ? `self-harm (${pct(options.answers.self_harm.noul)})` : null,
    categories.includes("distress") ? `distress (${pct(options.answers.distress.noul)})` : null,
    categories.includes("disappointment")
      ? `disappointment (${pct(options.answers.disappointment.noul)})`
      : null,
  ].filter(Boolean);

  return {
    hit,
    categories,
    severity,
    reason: hit
      ? `Jev flagged ${flagged.join(" and ")}.`
      : "Jev did not flag disappointment, distress, or self-harm.",
    snippet: previewText(options.studentText, 280),
    escalate: hit || options.answers.escalate.noul >= 0.4,
    source: "jev",
  };
}

async function classifyWithJev(input: {
  studentName: string;
  studentText: string;
  assistantText?: string;
  recentStudentTurns?: string[];
}): Promise<GuardrailClassification | null> {
  const response = await decideWithJev({
    state: {
      studentName: input.studentName,
      latestStudentMessage: input.studentText,
      tutorReply: input.assistantText || null,
      earlierStudentTurns: (input.recentStudentTurns ?? []).slice(-4),
    },
    questions: GUARDRAIL_QUESTIONS,
  });
  if (!response) return null;

  const disappointment = asNoul(response.answers.disappointment);
  const selfHarm = asNoul(response.answers.self_harm);
  const distress = asNoul(response.answers.distress);
  const escalate = asNoul(response.answers.escalate);
  if (!disappointment || !selfHarm || !distress || !escalate) return null;

  return classificationFromJev({
    answers: {
      disappointment,
      self_harm: selfHarm,
      distress,
      escalate,
      severity: asScore(response.answers.severity) ?? undefined,
    },
    studentText: input.studentText,
  });
}

async function classifyWithModel(input: {
  studentName: string;
  studentText: string;
  assistantText?: string;
  recentStudentTurns?: string[];
}): Promise<GuardrailClassification> {
  const result = await generateText({
    model: getModel(),
    system: buildGuardrailInstructions(),
    prompt: buildGuardrailUserPrompt(input),
    output: Output.object({ schema: classificationSchema }),
    temperature: 0,
  });

  const output = result.output;
  if (!output) return heuristicClassify(input.studentText);

  const categories = uniqueCategories(output.categories);
  const hit = categories.length > 0;
  const severity = hit
    ? maxSeverity(output.severity, severityFor(categories))
    : "low";

  return {
    hit,
    categories,
    severity,
    reason: output.reason.trim() || "The monitor classified this turn.",
    snippet: previewText(output.snippet || input.studentText, 280),
    escalate: hit || output.escalate,
    source: "model",
  };
}

export async function classifyStudentTurn(input: {
  studentName: string;
  studentText: string;
  assistantText?: string;
  recentStudentTurns?: string[];
}): Promise<GuardrailClassification & { promptVersion: string }> {
  const heuristic = heuristicClassify(input.studentText);

  try {
    const jev = await classifyWithJev(input);
    if (jev) {
      return { ...mergeClassifications(heuristic, jev), promptVersion: GUARDRAIL_PROMPT_VERSION };
    }
  } catch {
    // Fall through to the LLM classifier, then keywords.
  }

  try {
    const model = await classifyWithModel(input);
    const merged = mergeClassifications(heuristic, model);
    return { ...merged, promptVersion: GUARDRAIL_PROMPT_VERSION };
  } catch {
    return { ...heuristic, promptVersion: GUARDRAIL_PROMPT_VERSION };
  }
}
