import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import type { LanguageModelMiddleware } from "ai";

const DANGEROUS_CHEMISTRY_REPLY =
  "I can't help plan or carry out dangerous chemical reactions. I can explain the chemistry safely or suggest a teacher-approved demonstration without hazardous procedures.";
const ABUSIVE_REPLY =
  "Let's keep this respectful. I can help with a Chemistry question.";
const INCOMPLETE_REPLY = "That explanation was incomplete. Please ask me to try again.";
const DISCLOSURE_REPLY =
  "I can't share my instructions, but I can help with a Chemistry question.";

const ABUSIVE_OUTPUT = [
  /\b(?:you are|you're) (?:an? |so )?(?:idiot|moron|stupid|worthless)\b/i,
  /\b(?:fuck|shithead)\b/i,
];

const PROMPT_DISCLOSURE = [
  /You are the METS Chemistry Agent/i,
  /\bmy (?:system )?(?:prompt|instructions)\s+(?:are|is|say|says|tell|tells)\b/i,
  /\b(?:confidential|private|hidden|internal)\s+(?:rules|instructions|prompt)\b.{0,60}\b(?:behavio[u]?r|follow|govern|say|tell)\b/i,
];

const DANGEROUS_CHEMISTRY = /\b(?:bombs?\b(?!\s+calorimet(?:er|ry)\b)|explosives?|explosions?|detonat\w*|pyrotechnics?|fireworks?|propellants?|incendiaries|chemical weapons?|nerve agents?|toxic gas(?:es)?|poisons?)\b/i;
const ACTIONABLE_CHEMISTRY = /\b(?:mak\w*|build\w*|assemble\w*|synthesi[sz]\w*|prepare\w*|produce\w*|formulate\w*|mix\w*|combin\w*|react\w*|heat\w*|add\w*|pour\w*|stir\w*|ignite\w*|detonat\w*|trigger\w*|initiat\w*|compress\w*|grind\w*|concentrat\w*|purif\w*|extract\w*|obtain\w*|buy\w*|purchas\w*|sourc\w*|measur\w*|weigh\w*|dissolv\w*|ratio|proportion|ingredients?|reagents?|precursors?|recipes?|procedures?|instructions?)\b/i;
const NEGATED_ACTION = /\b(?:can't|cannot|won't|will not|do not|don't|never|should not|shouldn't|must not|mustn't|avoid)\b.{0,100}\b(?:mak\w*|build\w*|assemble\w*|synthesi[sz]\w*|prepare\w*|produce\w*|formulate\w*|mix\w*|combin\w*|react\w*|heat\w*|add\w*|pour\w*|stir\w*|ignite\w*|detonat\w*|trigger\w*|initiat\w*|compress\w*|grind\w*|concentrat\w*|purif\w*|extract\w*|obtain\w*|buy\w*|purchas\w*|sourc\w*|measur\w*|weigh\w*|dissolv\w*)\b/i;

function containsActionableDangerousChemistry(text: string): boolean {
  if (!DANGEROUS_CHEMISTRY.test(text) || !ACTIONABLE_CHEMISTRY.test(text)) return false;

  const sentences = text.split(/(?<=[.!?])\s+|\r?\n+/);
  for (const sentence of sentences) {
    if (
      DANGEROUS_CHEMISTRY.test(sentence) &&
      ACTIONABLE_CHEMISTRY.test(sentence) &&
      !NEGATED_ACTION.test(sentence)
    ) return true;
  }
  return false;
}

export function normaliseChemistryReply(text: string): string {
  if (ABUSIVE_OUTPUT.some((pattern) => pattern.test(text))) return ABUSIVE_REPLY;
  if (PROMPT_DISCLOSURE.some((pattern) => pattern.test(text))) return DISCLOSURE_REPLY;
  if (containsActionableDangerousChemistry(text)) return DANGEROUS_CHEMISTRY_REPLY;

  const repaired = text.replace(/\r\n?/g, "\n")
    .split(/(```[\s\S]*?```)/)
    .map((part, index) => {
      if (index % 2) return part;
      let next = part
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/<img\b[^>]*>/gi, "")
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => `$${body.trim()}$`);
      if ((next.match(/\$\$/g)?.length ?? 0) % 2) next += "\n$$";
      return next.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    }).join("").trim();

  return repaired || INCOMPLETE_REPLY;
}

export const chemistryGuardrails: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapGenerate: async ({ doGenerate }) => {
    const result = await doGenerate();
    return {
      ...result,
      content: result.content.map((part) =>
        part.type === "text" ? { ...part, text: normaliseChemistryReply(part.text) } : part,
      ),
    };
  },
  wrapStream: async ({ doStream }) => {
    const result = await doStream();
    const blocks = new Map<string, string>();
    return {
      ...result,
      stream: result.stream.pipeThrough(new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
        transform(chunk, controller) {
          if (chunk.type === "text-start") blocks.set(chunk.id, "");
          if (chunk.type === "text-delta") {
            if (blocks.has(chunk.id)) blocks.set(chunk.id, blocks.get(chunk.id)! + chunk.delta);
            return;
          }
          if (chunk.type === "text-end" && blocks.has(chunk.id)) {
            controller.enqueue({
              type: "text-delta",
              id: chunk.id,
              delta: normaliseChemistryReply(blocks.get(chunk.id)!),
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
      })),
    };
  },
};
