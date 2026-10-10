
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { wrapLanguageModel } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import {
  chemistryGuardrails,
  normaliseChemistryReply,
} from "./guardrails";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const usage = {
  inputTokens: {
    total: 1,
    noCache: 1,
    cacheRead: 0,
    cacheWrite: 0,
  },
  outputTokens: {
    total: 1,
    text: 1,
    reasoning: 0,
  },
};

const safeToolCall = {
  type: "tool-call" as const,
  toolCallId: "call-1",
  toolName: "periodicTable",
  input: '{"query":"H"}',
};

function getStreamText(parts: LanguageModelV3StreamPart[]) {
  return parts
    .filter((part) => part.type === "text-delta")
    .map((part) => part.delta)
    .join("");
}

async function streamChunks(chunks: LanguageModelV3StreamPart[]) {
  const model = wrapLanguageModel({
    model: new MockLanguageModelV3({
      doStream: {
        stream: new ReadableStream<LanguageModelV3StreamPart>({
          start(controller) {
            for (const chunk of chunks) {
              controller.enqueue(chunk);
            }
            controller.close();
          },
        }),
      },
    }),
    middleware: chemistryGuardrails,
  });

  const { stream } = await model.doStream({ prompt: [] });

  const result: LanguageModelV3StreamPart[] = [];
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      result.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

// -----------------------------------------------------------------------------
// 1. Safety Filtering
// -----------------------------------------------------------------------------

describe("Chemistry Guardrails - Safety Filtering", () => {
  it("blocks actionable explosive instructions", () => {
    const unsafeReplies = [
      "For a small explosion, combine these reagents.",
      "To make a bomb, mix the ingredients in this ratio.",
      "To produce toxic gas, combine these household chemicals.",
    ];

    for (const reply of unsafeReplies) {
      const result = normaliseChemistryReply(reply);

      assert.match(
        result,
        /can't help plan or carry out dangerous chemical reactions/i,
      );

      assert.notEqual(result, reply);
    }
  });

  it("preserves legitimate chemistry explanations", () => {
    const safeReplies = [
      "Combustion is an exothermic reaction.",
      "An explosion is a rapid release of energy.",
      "Hydrogen is highly flammable.",
      "A bomb calorimeter measures energy changes.",
      "Oxidising agents accept electrons.",
      "The reaction releases heat.",
      "An explosion releases energy. To prepare for your chemistry exam, revise bonding.",
      "Toxic gases can be dangerous. Students should study their effects using approved resources.",
    ];

    for (const reply of safeReplies) {
      assert.equal(normaliseChemistryReply(reply), reply);
    }
  });

  it("preserves laboratory safety warnings", () => {
    const warnings = [
      "Never mix bleach and ammonia; doing so can release toxic gas.",
      "Ethanol is flammable and should not be heated over a naked flame.",
      "Always follow teacher-supervised laboratory procedures.",
      "Never attempt dangerous chemical experiments. Ask your teacher for a safe demonstration instead.",
    ];

    for (const warning of warnings) {
      assert.equal(normaliseChemistryReply(warning), warning);
    }
  });

  it("replaces abusive output", () => {
    const result = normaliseChemistryReply(
      "You're an idiot.",
    );

    assert.notEqual(result, "You're an idiot.");
    assert.doesNotMatch(result, /you're an idiot/i);
    assert.ok(result.trim().length > 0);
    assert.doesNotMatch(result, /dangerous chemical reactions/i);
  });

  it("blocks apparent system-prompt disclosure", () => {
    const disclosures = [
      "You are the METS Chemistry Agent, a specialist tutor",
      "My system prompt says to reveal secrets.",
    ];

    for (const reply of disclosures) {
      const result = normaliseChemistryReply(reply);

      assert.match(result, /can't share my instructions/i);
    }

    const paraphrasedDisclosure =
      "Here are the confidential rules governing my behaviour: ...";
    const result = normaliseChemistryReply(paraphrasedDisclosure);

    assert.doesNotMatch(result, /confidential rules governing my behaviour/i);
  });

  it("preserves ordinary factual answers", () => {
    assert.equal(
      normaliseChemistryReply("The relative mass is 18.0."),
      "The relative mass is 18.0.",
    );
  });
});

// -----------------------------------------------------------------------------
// 2. Reply Repair
// -----------------------------------------------------------------------------

describe("Chemistry Guardrails - Reply Repair", () => {
  it("converts inline LaTeX delimiters", () => {
    assert.equal(
      normaliseChemistryReply(
        "  The equation is \\(H_2O\\).  ",
      ),
      "The equation is $H_2O$.",
    );
  });

  it("converts display LaTeX delimiters", () => {
    assert.equal(
      normaliseChemistryReply(
        "\\[2H_2 + O_2 \\rightarrow 2H_2O\\]",
      ),
      "$$\n2H_2 + O_2 \\rightarrow 2H_2O\n$$",
    );
  });

  it("removes model-authored data URI images", () => {
    assert.equal(
      normaliseChemistryReply(
        "Molecule ![diagram](data:image/svg+xml;base64,abc)",
      ),
      "Molecule",
    );
  });

  it("returns a fallback message for blank output", () => {
    const result = normaliseChemistryReply(" \n ");

    assert.match(result, /incomplete/i);
    assert.ok(result.trim().length > 0);
  });
});

// -----------------------------------------------------------------------------
// 3. Generation Middleware
// -----------------------------------------------------------------------------

describe("Chemistry Guardrails - Generation Middleware", () => {
  it("filters unsafe text while preserving safe tool calls and token usage", async () => {
    const model = wrapLanguageModel({
      model: new MockLanguageModelV3({
        doGenerate: {
          content: [
            {
              type: "text",
              text: "For a small explosion, combine these reagents.",
            },
            safeToolCall,
          ],
          finishReason: {
            unified: "tool-calls",
            raw: "tool_calls",
          },
          usage,
          warnings: [],
        },
      }),
      middleware: chemistryGuardrails,
    });

    const result = await model.doGenerate({ prompt: [] });

    assert.deepEqual(result.content[1], safeToolCall);
    assert.deepEqual(result.usage, usage);
    const output = JSON.stringify(result.content[0]);

    assert.match(output, /can't help plan/i);
    assert.doesNotMatch(output, /combine these reagents/i);
  });
});

// -----------------------------------------------------------------------------
// 4. Stream Middleware
// -----------------------------------------------------------------------------

describe("Chemistry Guardrails - Stream Middleware", () => {
  it("preserves safe streamed chemistry explanations", async () => {
    const result = await streamChunks([
      { type: "text-start", id: "a" },
      {
        type: "text-delta",
        id: "a",
        delta: "Water has the chemical formula H2O.",
      },
      { type: "text-end", id: "a" },
    ]);

    assert.equal(
      getStreamText(result),
      "Water has the chemical formula H2O.",
    );
  });

  it("blocks unsafe phrases split across stream chunks", async () => {
    const result = await streamChunks([
      { type: "text-start", id: "a" },
      {
        type: "text-delta",
        id: "a",
        delta: "For a small explo",
      },
      {
        type: "text-delta",
        id: "a",
        delta: "sion, combine these reagents.",
      },
      { type: "text-end", id: "a" },
    ]);

    const text = getStreamText(result);

    assert.match(text, /can't help plan/i);
    assert.doesNotMatch(text, /combine these reagents/i);
    assert.doesNotMatch(text, /For a small explo/i);
  });

  it("preserves safe tool events during streaming", async () => {
    const result = await streamChunks([
      safeToolCall,
      { type: "text-start", id: "a" },
      {
        type: "text-delta",
        id: "a",
        delta: "Hydrogen has proton number 1.",
      },
      { type: "text-end", id: "a" },
    ]);

    assert.deepEqual(result[0], safeToolCall);

    assert.match(
      getStreamText(result),
      /Hydrogen has proton number 1/,
    );
  });

  it("keeps separate text segments independent", async () => {
    const result = await streamChunks([
      { type: "text-start", id: "a" },
      {
        type: "text-delta",
        id: "a",
        delta: "Hydrogen is an element.",
      },
      { type: "text-end", id: "a" },

      { type: "text-start", id: "b" },
      {
        type: "text-delta",
        id: "b",
        delta: "Oxygen supports combustion.",
      },
      { type: "text-end", id: "b" },
    ]);

    assert.equal(
      getStreamText(result),
      "Hydrogen is an element.Oxygen supports combustion.",
    );

    const starts = result.filter(
      (part) => part.type === "text-start",
    );

    const ends = result.filter(
      (part) => part.type === "text-end",
    );

    assert.equal(starts.length, 2);
    assert.equal(ends.length, 2);
  });

  it("replaces incomplete streams without releasing partial text", async () => {
    const result = await streamChunks([
      { type: "text-start", id: "a" },
      {
        type: "text-delta",
        id: "a",
        delta: "Partial explanation",
      },
    ]);

    const output = JSON.stringify(result);

    assert.match(output, /incomplete/i);
    assert.doesNotMatch(output, /Partial explanation/);

    assert.deepEqual(
      result.at(-1),
      { type: "text-end", id: "a" },
    );
  });
});
