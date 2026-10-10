import assert from "node:assert/strict";
import test from "node:test";
import {
  asChoice,
  asNoul,
  asScore,
  clamp01,
  decideWithJev,
  getJevModelId,
  isJevConfigured,
} from "./jev";

const previous = {
  key: process.env.TYPESAFE_API_KEY,
  model: process.env.TYPESAFE_MODEL,
  fetch: globalThis.fetch,
};

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function restore() {
  setEnv("TYPESAFE_API_KEY", previous.key);
  setEnv("TYPESAFE_MODEL", previous.model);
  globalThis.fetch = previous.fetch;
}

test("jev answer helpers", () => {
  assert.equal(clamp01(1.4), 1);
  assert.equal(clamp01(-0.2), 0);
  assert.equal(
    asChoice({ type: "choice", choice: "physics", confidence: 0.9, probabilities: {} })?.choice,
    "physics",
  );
  assert.equal(asChoice({ type: "noul", noul: 0.4 }), null);
  assert.equal(asNoul({ type: "noul", noul: 1.2 })?.noul, 1);
  assert.equal(asScore({ type: "score", score: 2.1, confidence: 0.8 })?.score, 2.1);
});

test("jev is optional and maps a successful decide call", async () => {
  try {
    setEnv("TYPESAFE_API_KEY", "");
    setEnv("TYPESAFE_MODEL", undefined);
    assert.equal(isJevConfigured(), false);
    assert.equal(getJevModelId(), "jev-1.13.0");
    assert.equal(
      await decideWithJev({ state: "hi", questions: { ok: { type: "noul", instructions: "yes?" } } }),
      null,
    );

    setEnv("TYPESAFE_API_KEY", "ts_test");
    setEnv("TYPESAFE_MODEL", "jev-1.13.0");
    assert.equal(isJevConfigured(), true);

    let called = 0;
    globalThis.fetch = (async () => {
      called += 1;
      return {
        ok: true,
        json: async () => ({
          model: "jev-1.13.0",
          answers: { urgent: { type: "noul", noul: 0.81 } },
          usage: { input_tokens: 12, output_tokens: 3 },
        }),
      };
    }) as unknown as typeof fetch;

    const decided = await decideWithJev({
      state: "I was charged twice.",
      questions: { urgent: { type: "noul", instructions: "Escalate now?" } },
    });
    assert.equal(called, 1);
    assert.equal(decided?.model, "jev-1.13.0");
    assert.equal(asNoul(decided?.answers.urgent)?.noul, 0.81);
    assert.equal(decided?.usage?.inputTokens, 12);
  } finally {
    restore();
  }
});
