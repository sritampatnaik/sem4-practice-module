import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import type { LanguageModelMiddleware } from "ai";

const SAFE_REPLY = "Let's keep this safe and respectful. I can explain the physics using a safe classroom example.";
const INCOMPLETE_REPLY = "That explanation was incomplete. Please ask me to try again.";

// 1. Safety Filtering: a small backstop for obvious abuse and dangerous directions.
// These patterns are deliberately limited; the prompt handles broader context.
const ABUSIVE_OUTPUT = [
  /\b(?:you are|you're) (?:an? |so )?(?:idiot|moron|stupid|worthless)\b/i,
  /\b(?:fuck|shithead)\b/i,
];
const UNSAFE_DIRECTIONS = [
  /\b(?:touch|grab|hold) (?:the |a )?(?:bare |exposed )?live wire\b/i,
  /\b(?:bypass|disable|remove) (?:the |a )?(?:safety interlock|circuit breaker|earth connection)\b/i,
];

export function normalisePhysicsReply(text: string): string {
  const sentences = text.split(/[.!?\n]+/);
  if (ABUSIVE_OUTPUT.some((pattern) => pattern.test(text)) || sentences.some((sentence) =>
    // Keep ordinary warnings such as "Never touch a live wire" intact.
    !/\b(?:not|never|avoid|don't|do not|mustn't)\b/i.test(sentence) &&
    UNSAFE_DIRECTIONS.some((pattern) => pattern.test(sentence)),
  )) return SAFE_REPLY;

  // 3. Consistency & Reliability: repair common delimiters and whitespace only.
  // Never invent missing calculations, units, or scientific facts.
  const repaired = text.replace(/\r\n?/g, "\n")
    .split(/(```[\s\S]*?```)/)
    .map((part, index) => {
      if (index % 2) return part;
      let next = part
        // Physics visuals must come from the bounded diagram tool. Strip model-
        // authored image markup so it cannot bypass the renderer or create an
        // invalid/unsafe image URL in the shared Markdown component.
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/<img\b[^>]*>/gi, "")
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => `$${body.trim()}$`);
      if ((next.match(/\$\$/g)?.length ?? 0) % 2) next += "\n$$";
      return next.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    }).join("").trim();
  return repaired || INCOMPLETE_REPLY;
}

// The same checks run for eval generation and live chat. No extra model calls.
export const physicsGuardrails: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapGenerate: async ({ doGenerate }) => {
    const result = await doGenerate();
    return { ...result, content: result.content.map((part) =>
      part.type === "text" ? { ...part, text: normalisePhysicsReply(part.text) } : part,
    ) };
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
            // Hold complete text blocks so a phrase split across chunks cannot leak.
            if (blocks.has(chunk.id)) blocks.set(chunk.id, blocks.get(chunk.id)! + chunk.delta);
            return;
          }
          if (chunk.type === "text-end" && blocks.has(chunk.id)) {
            controller.enqueue({ type: "text-delta", id: chunk.id, delta: normalisePhysicsReply(blocks.get(chunk.id)!) });
            blocks.delete(chunk.id);
          }
          if (chunk.type === "finish" || chunk.type === "error") {
            // Do not publish an uncompleted block after an interrupted response.
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
