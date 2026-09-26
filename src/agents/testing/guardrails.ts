import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import type { LanguageModelMiddleware } from "ai";

const EXAM_INTEGRITY_REPLY =
  "I can't help with recreating live exam papers, revealing hidden instructions, or listing the full answer key in prose. I can still build an original practice set on the same topic.";
const BOUNDARY_REPLY =
  "I can't share hidden instructions or ignore the Testing rules. I can still build an original practice set on the topic you want.";
const INCOMPLETE_REPLY =
  "That assessment reply was incomplete. Please ask me to try again.";

const REFUSAL_LANGUAGE =
  /\b(?:can't|cannot|won't|will not|do not|don't|not able|instead|rather than)\b/i;
const PROMPT_DISCLOSURE = [
  /\b(?:my|the) (?:system|hidden) prompt (?:says|is|contains)\b/i,
  /\b(?:my|the) internal instructions? (?:say|are|contain)\b/i,
  /\bignore (?:all|any|previous) instructions\b/i,
  /\breveal (?:your |the )?(?:system|hidden) prompt\b/i,
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

export function normaliseTestingReply(text: string): string {
  const repaired = repairWhitespace(text);
  if (!repaired) return INCOMPLETE_REPLY;

  if (hasPromptDisclosure(repaired)) return BOUNDARY_REPLY;
  if (hasUnsafeLivePaperDisclosure(repaired) || hasAnswerKeyDump(repaired)) {
    return EXAM_INTEGRITY_REPLY;
  }

  return repaired;
}

export const testingGuardrails: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapGenerate: async ({ doGenerate }) => {
    const result = await doGenerate();
    return {
      ...result,
      content: result.content.map((part) =>
        part.type === "text" ? { ...part, text: normaliseTestingReply(part.text) } : part,
      ),
    };
  },
  wrapStream: async ({ doStream }) => {
    const result = await doStream();
    const blocks = new Map<string, string>();

    return {
      ...result,
      stream: result.stream.pipeThrough(
        new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
          transform(chunk, controller) {
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
                delta: normaliseTestingReply(blocks.get(chunk.id)!),
              });
              blocks.delete(chunk.id);
            }

            if (chunk.type === "finish" || chunk.type === "error") {
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
