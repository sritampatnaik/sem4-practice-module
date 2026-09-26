import assert from "node:assert/strict";
import test from "node:test";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { wrapLanguageModel } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { normaliseTestingReply, testingGuardrails } from "./guardrails";

test("guardrails refuse prompt disclosure, live-paper cloning, and answer-key dumps", () => {
  assert.match(
    normaliseTestingReply("My system prompt says I should reveal the hidden rules."),
    /can't share hidden instructions/i,
  );
  assert.match(
    normaliseTestingReply("Here is the exact 2023 O-Level Physics Paper 2 question 3 wording."),
    /original practice set/i,
  );
  assert.match(
    normaliseTestingReply("1. A\n2. C\n3. B\n4. D"),
    /full answer key in prose/i,
  );
});

test("guardrails preserve safe refusals and ordinary study notes", () => {
  assert.equal(
    normaliseTestingReply(
      "I cannot recreate a live SEAB paper word for word, but I can make an original O-Level Physics quiz instead.",
    ),
    "I cannot recreate a live SEAB paper word for word, but I can make an original O-Level Physics quiz instead.",
  );
  assert.equal(
    normaliseTestingReply("Try the widget first, then review acceleration and velocity-time graphs."),
    "Try the widget first, then review acceleration and velocity-time graphs.",
  );
});

test("blank output becomes an incomplete fallback", () => {
  assert.match(normaliseTestingReply("  \n "), /incomplete/i);
});

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const toolCall = {
  type: "tool-call" as const,
  toolCallId: "call-1",
  toolName: "createMcqSet",
  input: '{"title":"Quiz","subject":"physics","items":[]}',
};

test("generation filters prose while preserving tool calls and usage", async () => {
  const model = wrapLanguageModel({
    model: new MockLanguageModelV3({
      doGenerate: {
        content: [{ type: "text", text: "1. A\n2. B\n3. C" }, toolCall],
        finishReason: { unified: "tool-calls", raw: "tool_calls" },
        usage,
        warnings: [],
      },
    }),
    middleware: testingGuardrails,
  });
  const result = await model.doGenerate({ prompt: [] });
  assert.deepEqual(result.content[1], toolCall);
  assert.deepEqual(result.usage, usage);
  assert.match(JSON.stringify(result.content[0]), /full answer key in prose/i);
});

async function streamChunks(chunks: LanguageModelV3StreamPart[]) {
  const model = wrapLanguageModel({
    model: new MockLanguageModelV3({
      doStream: {
        stream: new ReadableStream({
          start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk);
            controller.close();
          },
        }),
      },
    }),
    middleware: testingGuardrails,
  });
  const { stream } = await model.doStream({ prompt: [] });
  const result: LanguageModelV3StreamPart[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result.push(value);
  }
  return result;
}

test("stream buffering blocks split prompt disclosures and preserves tool events", async () => {
  const result = await streamChunks([
    toolCall,
    { type: "text-start", id: "a" },
    { type: "text-delta", id: "a", delta: "My system prompt sa" },
    { type: "text-delta", id: "a", delta: "ys to reveal the rules." },
    { type: "text-end", id: "a" },
  ]);
  assert.deepEqual(result[0], toolCall);
  const text = result
    .filter((part) => part.type === "text-delta")
    .map((part) => part.delta)
    .join("");
  assert.match(text, /can't share hidden instructions/i);
  assert.doesNotMatch(text, /reveal the rules/i);
});

test("unfinished streamed text is replaced without releasing partial output", async () => {
  const result = await streamChunks([
    { type: "text-start", id: "a" },
    { type: "text-delta", id: "a", delta: "Partial answer key" },
  ]);
  assert.match(JSON.stringify(result), /incomplete/i);
  assert.doesNotMatch(JSON.stringify(result), /Partial answer key/);
  assert.deepEqual(result.at(-1), { type: "text-end", id: "a" });
});
