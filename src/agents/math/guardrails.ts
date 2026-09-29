import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import type { LanguageModelMiddleware } from "ai";

const SAFE_REPLY = "Let's keep this respectful. I'm happy to keep working through the maths with you.";
const INCOMPLETE_REPLY = "That explanation was incomplete. Please ask me to try again.";
const DISCLOSURE_REPLY =
  "I can't share my instructions, but I can explain the mathematics behind any answer I give.";
const TRUNCATED_NOTE = "My answer was cut short here. Ask me to continue if you need the rest.";

// A narrow backstop for abuse; the prompt carries the wider tone rules.
const ABUSIVE_OUTPUT = [
  /\b(?:you are|you're) (?:an? |so )?(?:idiot|moron|stupid|worthless)\b/i,
  /\b(?:fuck|shithead)\b/i,
];

// The system prompt should never be echoed back, whatever the student asks.
const PROMPT_DISCLOSURE = [
  /You are the METS Mathematics Agent/i,
  /\bmy (?:system )?(?:prompt|instructions) (?:are|is|say)\b/i,
];

/**
 * Tidies a Math reply without changing any mathematics.
 *
 * It never invents or corrects a value: the only edits are removing markup the
 * student should not receive, and repairing delimiters so the maths renders.
 */
export function normaliseMathReply(text: string): string {
  if (ABUSIVE_OUTPUT.some((pattern) => pattern.test(text))) return SAFE_REPLY;
  if (PROMPT_DISCLOSURE.some((pattern) => pattern.test(text))) return DISCLOSURE_REPLY;

  const repaired = text
    .replace(/\r\n?/g, "\n")
    .split(/(```[\s\S]*?```)/)
    .map((part, index) => {
      // Odd indices are fenced code, which is left exactly as written.
      if (index % 2) return part;
      let next = part
        // Graphs must come from drawMathGraph, which is bounded and testable.
        // Stripping image markup stops the model drawing its own instead. The
        // open-ended forms catch a reply cut off in the middle of an image.
        .replace(/[ \t]*!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/[ \t]*!\[[^\]]*\]\([^)]*$/, "")
        .replace(/[ \t]*data:image\/[\w.+-]+;base64,[A-Za-z0-9+/=]*/gi, "")
        .replace(/[ \t]*<img\b[^>]*>/gi, "")
        .replace(/[ \t]*<img\b[^>]*$/i, "")
        .replace(/[ \t]*<svg\b[\s\S]*?<\/svg>/gi, "")
        .replace(/[ \t]*<svg\b[\s\S]*$/i, "")
        // Normalise LaTeX delimiters to the $ forms the chat renders.
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => `$${body.trim()}$`);
      // An unclosed display block swallows the rest of the answer.
      if ((next.match(/\$\$/g)?.length ?? 0) % 2) next += "\n$$";
      return next.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    })
    .join("")
    .trim();

  return repaired || INCOMPLETE_REPLY;
}

/** Applied to both generated and streamed replies, with no extra model calls. */
export const mathGuardrails: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapGenerate: async ({ doGenerate }) => {
    const result = await doGenerate();
    const content = result.content.map((part) =>
      part.type === "text" ? { ...part, text: normaliseMathReply(part.text) } : part,
    );
    // A reply stopped by the length cap must not read as a finished answer.
    if (result.finishReason.unified === "length") content.push({ type: "text", text: TRUNCATED_NOTE });
    return { ...result, content };
  },
  wrapStream: async ({ doStream }) => {
    const result = await doStream();
    const blocks = new Map<string, string>();
    return {
      ...result,
      stream: result.stream.pipeThrough(
        new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
          transform(chunk, controller) {
            if (chunk.type === "text-start") blocks.set(chunk.id, "");
            if (chunk.type === "text-delta") {
              // Hold the whole block: a stripped pattern could straddle two chunks.
              if (blocks.has(chunk.id)) blocks.set(chunk.id, blocks.get(chunk.id)! + chunk.delta);
              return;
            }
            if (chunk.type === "text-end" && blocks.has(chunk.id)) {
              controller.enqueue({
                type: "text-delta",
                id: chunk.id,
                delta: normaliseMathReply(blocks.get(chunk.id)!),
              });
              blocks.delete(chunk.id);
            }
            if (chunk.type === "finish" || chunk.type === "error") {
              // Never release half an explanation after an interrupted reply.
              const hadOpenBlock = blocks.size > 0;
              for (const id of blocks.keys()) {
                controller.enqueue({ type: "text-delta", id, delta: INCOMPLETE_REPLY });
                controller.enqueue({ type: "text-end", id });
              }
              blocks.clear();
              // A reply stopped by the length cap must not read as a finished answer.
              if (chunk.type === "finish" && chunk.finishReason.unified === "length" && !hadOpenBlock) {
                const id = "math-truncated-note";
                controller.enqueue({ type: "text-start", id });
                controller.enqueue({ type: "text-delta", id, delta: TRUNCATED_NOTE });
                controller.enqueue({ type: "text-end", id });
              }
            }
            controller.enqueue(chunk);
          },
          flush(controller) {
            for (const id of blocks.keys()) {
              controller.enqueue({ type: "text-delta", id, delta: INCOMPLETE_REPLY });
              controller.enqueue({ type: "text-end", id });
            }
            blocks.clear();
          },
        }),
      ),
    };
  },
};
