import { generateText, Output } from "ai";
import { z } from "zod";
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
    source: heuristic.hit && model.hit ? "merged" : model.hit ? "model" : heuristic.source,
  };
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
    const model = await classifyWithModel(input);
    const merged = mergeClassifications(heuristic, model);
    return { ...merged, promptVersion: GUARDRAIL_PROMPT_VERSION };
  } catch {
    return { ...heuristic, promptVersion: GUARDRAIL_PROMPT_VERSION };
  }
}
