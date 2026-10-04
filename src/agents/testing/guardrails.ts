import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import type { LanguageModelMiddleware } from "ai";
import type { AgentRuntimeContext, Subject } from "../_shared/types";
import type { TestingMode, VisualFormat } from "./assessment-planner";
import { estimateCostUsd } from "@/evals/pricing";
import { getModelId } from "@/lib/llm";
import {
  appendAssessmentPerformanceEntry,
  consumeStagedAssessmentPerformanceEntry,
  previewAssessmentNote,
} from "./performance-log";

const EXAM_INTEGRITY_REPLY =
  "I can't help with recreating live exam papers, revealing hidden instructions, or listing the full answer key in prose. I can still build an original practice set on the same topic.";
const BOUNDARY_REPLY =
  "I cannot share hidden instructions or ignore the Testing rules. I can still build an original practice set on the topic you want.";
const INCOMPLETE_REPLY =
  "That assessment reply was incomplete. Please ask me to try again.";
const WIDGET_NOTE_REPLY =
  "Try the widget first, then review the key ideas and common mistakes after you answer.";

const REFUSAL_LANGUAGE =
  /\b(?:can't|cannot|won't|will not|do not|don't|not able|instead|rather than)\b/i;
const PROMPT_DISCLOSURE = [
  /\b(?:my|the) (?:system|hidden) prompt (?:says|is|contains)\b/i,
  /\b(?:my|the) internal instructions? (?:say|are|contain)\b/i,
  /\bignore (?:all|any|previous) instructions\b/i,
  /\breveal (?:your |the )?(?:system|hidden) prompt\b/i,
  /\breveal (?:your |the )?hidden rules\b/i,
];
const LIVE_PAPER_DISCLOSURE = [
  /\b(?:here(?:'s| is)|below is|this is) the exact (?:wording|question)\b/i,
  /\bexact\b[\s\S]{0,80}\b(?:wording|question)\b/i,
  /\b(?:word for word|verbatim|exact wording)\b/i,
  /\b(?:recreated|copied) (?:the )?(?:paper|question)\b/i,
];
const LIVE_PAPER_REFERENCES =
  /\b(?:SEAB|Ten-Year Series|TYS|Paper\s*\d|question\s*\d)\b/i;
const ANSWER_KEY_PATTERNS = [
  /\ball the answers are\b/i,
  /\banswer key\b/i,
  /\bcorrect answers?\b/i,
];
const ANSWER_LINE = /(?:^|\n)\s*(?:q(?:uestion)?\s*)?\d+\s*[\)\.\-:]\s*[A-E]\b/gim;
const QUESTION_LINE = /(?:^|\n)\s*\d+\s*[\)\.\-:]/gim;
const OPTION_LINE = /(?:^|\n)\s*(?:[-*]\s*)?\(?[A-Ea-e]\)\s+/gm;
const BULLET_LINE = /(?:^|\n)\s*[-*]\s+/gm;

type WidgetAssessmentMetadata = {
  subject: Subject;
  mode: TestingMode;
  title: string;
  topics: string[];
  visualFormat: VisualFormat;
};

function parseToolInput(input: unknown) {
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as unknown;
    } catch {
      return null;
    }
  }
  return input;
}

function uniqueTopics(topics: string[]) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const topic of topics) {
    const cleaned = topic.replace(/\s+/g, " ").trim();
    const normalised = cleaned.toLowerCase();
    if (!cleaned || seen.has(normalised)) continue;
    seen.add(normalised);
    results.push(cleaned);
  }

  return results;
}

function widgetAssessmentMetadata(toolName: string, input: unknown): WidgetAssessmentMetadata | null {
  const payload = parseToolInput(input);
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;
  const subject = raw.subject;
  const title = raw.title;
  if (
    (toolName !== "createMcqSet" && toolName !== "createFlashcards") ||
    (subject !== "math" && subject !== "physics" && subject !== "chemistry") ||
    typeof title !== "string"
  ) {
    return null;
  }

  const topics =
    toolName === "createMcqSet"
      ? Array.isArray(raw.items)
        ? uniqueTopics(
            raw.items.flatMap((item) => {
              if (!item || typeof item !== "object") return [];
              const topic = (item as { topic?: unknown }).topic;
              return typeof topic === "string" ? [topic] : [];
            }),
          )
        : []
      : Array.isArray(raw.cards)
        ? uniqueTopics(
            raw.cards.flatMap((card) => {
              if (!card || typeof card !== "object") return [];
              const topic = (card as { topic?: unknown }).topic;
              return typeof topic === "string" ? [topic] : [];
            }),
          )
        : [];

  return {
    subject,
    mode: toolName === "createMcqSet" ? "mcq" : "flashcards",
    title,
    topics,
    visualFormat: "none",
  };
}

function usageTotals(
  usage:
    | {
        inputTokens?: { total?: number };
        outputTokens?: { total?: number };
      }
    | undefined,
) {
  return {
    inputTokens: usage?.inputTokens?.total ?? 0,
    outputTokens: usage?.outputTokens?.total ?? 0,
  };
}

async function logAssessmentTelemetry(options: {
  ctx?: AgentRuntimeContext;
  widgetMeta: WidgetAssessmentMetadata | null;
  note: string;
  inputTokens: number;
  outputTokens: number;
}) {
  if (!options.ctx || !options.widgetMeta) return;

  const staged = consumeStagedAssessmentPerformanceEntry(options.ctx.sessionId);
  const subject = staged?.subject ?? options.widgetMeta.subject;
  const mode = staged?.mode ?? options.widgetMeta.mode;
  const title = staged?.title ?? options.widgetMeta.title;
  const topics = staged?.topics?.length ? staged.topics : options.widgetMeta.topics;
  const visualFormat = staged?.visualFormat ?? options.widgetMeta.visualFormat;
  const note = staged?.note ?? previewAssessmentNote(options.note);

  await appendAssessmentPerformanceEntry({
    sessionId: options.ctx.sessionId,
    studentName: options.ctx.profile.name,
    gradeLevel: options.ctx.profile.gradeLevel,
    subject,
    mode,
    title,
    topics,
    visualFormat,
    note,
    inputTokens: options.inputTokens,
    outputTokens: options.outputTokens,
    costUsd: estimateCostUsd({
      model: getModelId(),
      inputTokens: options.inputTokens,
      outputTokens: options.outputTokens,
    }),
    at: new Date().toISOString(),
  });
}

function repairWhitespace(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasPromptDisclosure(text: string) {
  return PROMPT_DISCLOSURE.some((pattern) => pattern.test(text));
}

function extractUserText(prompt: unknown) {
  if (!Array.isArray(prompt)) return "";
  return prompt
    .flatMap((message) => {
      if (!message || typeof message !== "object") return [];
      const raw = message as { role?: unknown; content?: unknown };
      if (raw.role !== "user") return [];
      if (typeof raw.content === "string") return [raw.content];
      if (!Array.isArray(raw.content)) return [];
      return raw.content.flatMap((part) => {
        if (!part || typeof part !== "object") return [];
        const text = (part as { type?: unknown; text?: unknown }).type === "text"
          ? (part as { text?: unknown }).text
          : undefined;
        return typeof text === "string" ? [text] : [];
      });
    })
    .join("\n");
}

function hasUnsafeLivePaperDisclosure(text: string) {
  if (!LIVE_PAPER_REFERENCES.test(text)) return false;
  if (REFUSAL_LANGUAGE.test(text)) return false;
  return LIVE_PAPER_DISCLOSURE.some((pattern) => pattern.test(text));
}

function hasAnswerKeyDump(text: string) {
  if (ANSWER_KEY_PATTERNS.some((pattern) => pattern.test(text)) && !REFUSAL_LANGUAGE.test(text)) {
    return true;
  }

  const answerLines = text.match(ANSWER_LINE) ?? [];
  return answerLines.length >= 3;
}

function hasWidgetEcho(text: string) {
  const questionLines = text.match(QUESTION_LINE) ?? [];
  const optionLines = text.match(OPTION_LINE) ?? [];
  const bulletLines = text.match(BULLET_LINE) ?? [];
  return questionLines.length >= 3 || optionLines.length >= 6 || bulletLines.length >= 3;
}

export function normaliseTestingReply(
  text: string,
  options?: {
    forceBoundaryRefusal?: boolean;
    hasWidgetTool?: boolean;
    widgetMode?: TestingMode;
  },
): string {
  const repaired = repairWhitespace(text);
  if (!repaired) return INCOMPLETE_REPLY;

  if (hasPromptDisclosure(repaired)) return BOUNDARY_REPLY;
  if (hasUnsafeLivePaperDisclosure(repaired) || hasAnswerKeyDump(repaired)) {
    return EXAM_INTEGRITY_REPLY;
  }
  if (
    options?.hasWidgetTool &&
    options?.widgetMode === "flashcards" &&
    (
      repaired.length > 180 ||
      (repaired.match(BULLET_LINE) ?? []).length >= 2 ||
      (repaired.match(QUESTION_LINE) ?? []).length >= 1 ||
      /(?:^|\n)\s*(?:front|back)\s*:/im.test(repaired)
    )
  ) {
    return WIDGET_NOTE_REPLY;
  }
  if (options?.hasWidgetTool && hasWidgetEcho(repaired)) {
    return options?.forceBoundaryRefusal
      ? `${BOUNDARY_REPLY}\n\n${WIDGET_NOTE_REPLY}`
      : WIDGET_NOTE_REPLY;
  }
  if (options?.forceBoundaryRefusal) {
    if (
      repaired.length > 180 ||
      /\b(?:mcq|mcqs|flashcards?|quiz|question|questions)\b/i.test(repaired)
    ) {
      return `${BOUNDARY_REPLY}\n\n${WIDGET_NOTE_REPLY}`;
    }
    if (!REFUSAL_LANGUAGE.test(repaired)) {
      return `${BOUNDARY_REPLY}\n\n${repaired}`;
    }
  }

  return repaired;
}

export function createTestingGuardrails(
  ctx?: AgentRuntimeContext,
): LanguageModelMiddleware {
  return {
    specificationVersion: "v3",
    wrapGenerate: async ({ doGenerate, params }) => {
    const userText = extractUserText(params.prompt);
    const forceBoundaryRefusal = hasPromptDisclosure(userText);
    const result = await doGenerate();
    const hasWidgetTool = result.content.some(
      (part) =>
        part.type === "tool-call" &&
        (part.toolName === "createMcqSet" || part.toolName === "createFlashcards"),
    );
    const widgetTool = result.content.find(
      (part) =>
        part.type === "tool-call" &&
        (part.toolName === "createMcqSet" || part.toolName === "createFlashcards"),
    );
    const widgetMeta =
      widgetTool && widgetTool.type === "tool-call"
        ? widgetAssessmentMetadata(widgetTool.toolName, widgetTool.input)
        : null;
    const usage = usageTotals(result.usage);
    const normalisedText = result.content
      .filter((part) => part.type === "text")
      .map((part) =>
        normaliseTestingReply(part.text, {
          forceBoundaryRefusal,
          hasWidgetTool,
          widgetMode: widgetMeta?.mode,
        }),
      )
      .join("\n")
      .trim();
    await logAssessmentTelemetry({
      ctx,
      widgetMeta,
      note: normalisedText,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    });
    return {
      ...result,
      content: result.content.map((part) =>
        part.type === "text"
          ? {
              ...part,
              text: normaliseTestingReply(part.text, {
                forceBoundaryRefusal,
                hasWidgetTool,
              }),
            }
          : part,
      ),
    };
    },
    wrapStream: async ({ doStream, params }) => {
    const userText = extractUserText(params.prompt);
    const forceBoundaryRefusal = hasPromptDisclosure(userText);
    const result = await doStream();
    const blocks = new Map<string, string>();
    let hasWidgetTool = false;
    let widgetMeta: WidgetAssessmentMetadata | null = null;

    return {
      ...result,
      stream: result.stream.pipeThrough(
        new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
          transform(chunk, controller) {
            if (
              chunk.type === "tool-call" &&
              (chunk.toolName === "createMcqSet" || chunk.toolName === "createFlashcards")
            ) {
              hasWidgetTool = true;
              widgetMeta ??= widgetAssessmentMetadata(chunk.toolName, chunk.input);
            }

            if (chunk.type === "text-start") {
              blocks.set(chunk.id, "");
            }

            if (chunk.type === "text-delta") {
              if (blocks.has(chunk.id)) {
                blocks.set(chunk.id, blocks.get(chunk.id)! + chunk.delta);
              }
              return;
            }

            if (chunk.type === "text-end" && blocks.has(chunk.id)) {
              controller.enqueue({
                type: "text-delta",
                id: chunk.id,
                delta: normaliseTestingReply(blocks.get(chunk.id)!, {
                  forceBoundaryRefusal,
                  hasWidgetTool,
                  widgetMode: widgetMeta?.mode,
                }),
              });
              blocks.delete(chunk.id);
            }

            if (chunk.type === "finish" || chunk.type === "error") {
              if (chunk.type === "finish") {
                const note = [...blocks.values()]
                  .map((text) =>
                    normaliseTestingReply(text, {
                      forceBoundaryRefusal,
                      hasWidgetTool,
                      widgetMode: widgetMeta?.mode,
                    }),
                  )
                  .join("\n")
                  .trim();
                const usage = usageTotals(chunk.usage);
                void logAssessmentTelemetry({
                  ctx,
                  widgetMeta,
                  note,
                  inputTokens: usage.inputTokens,
                  outputTokens: usage.outputTokens,
                });
              }
              for (const id of blocks.keys()) {
                controller.enqueue({ type: "text-delta", id, delta: INCOMPLETE_REPLY });
                controller.enqueue({ type: "text-end", id });
              }
              blocks.clear();
            }

            controller.enqueue(chunk);
          },
          flush(controller) {
            for (const id of blocks.keys()) {
              controller.enqueue({ type: "text-delta", id, delta: INCOMPLETE_REPLY });
              controller.enqueue({ type: "text-end", id });
            }
          },
        }),
      ),
    };
    },
  };
}

export const testingGuardrails = createTestingGuardrails();
