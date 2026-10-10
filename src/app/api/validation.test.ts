import assert from "node:assert/strict";
import test from "node:test";
import { POST as authPost } from "./auth/route";
import { DELETE as deleteEvalItem, POST as addEvalItem, PUT as saveEvalItem } from "./evals/items/route";
import { DELETE as deleteEvaluator, PUT as saveEvaluators } from "./evals/evaluators/route";
import { POST as runEvals } from "./evals/run/route";
import { GET as getHarnessFixtures, POST as runHarness } from "./testing-harness/route";

function jsonRequest(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("auth rejects malformed sign-in input before attempting cloud authentication", async () => {
  const invalidEmail = await authPost(jsonRequest("http://localhost/api/auth", "POST", {
    email: "not-an-email",
    password: "long-enough",
  }));
  assert.equal(invalidEmail.status, 400);
  assert.deepEqual(await invalidEmail.json(), { error: "Enter a valid email." });

  const shortPassword = await authPost(jsonRequest("http://localhost/api/auth", "POST", {
    email: "student@example.com",
    password: "short",
  }));
  assert.equal(shortPassword.status, 400);
  assert.deepEqual(await shortPassword.json(), { error: "Password must be at least 6 characters." });
});

test("eval item endpoints reject invalid requests without changing the catalog", async () => {
  const invalidSuite = await addEvalItem(jsonRequest("http://localhost/api/evals/items", "POST", {
    suiteId: "unknown",
  }));
  assert.equal(invalidSuite.status, 400);
  assert.deepEqual(await invalidSuite.json(), { error: "suiteId is required." });

  const missingId = await deleteEvalItem(new Request("http://localhost/api/evals/items", { method: "DELETE" }));
  assert.equal(missingId.status, 400);
  assert.deepEqual(await missingId.json(), { error: "id is required." });

  const malformedDraft = await saveEvalItem(jsonRequest("http://localhost/api/evals/items", "PUT", {}));
  assert.equal(malformedDraft.status, 400);
  assert.equal(typeof (await malformedDraft.json()).error, "string");
});

test("evaluator endpoints reject missing payloads and identifiers", async () => {
  const missingPayload = await saveEvaluators(jsonRequest("http://localhost/api/evals/evaluators", "PUT", {}));
  assert.equal(missingPayload.status, 400);
  assert.deepEqual(await missingPayload.json(), { error: "evaluators or evaluator is required." });

  const missingId = await deleteEvaluator(new Request("http://localhost/api/evals/evaluators", { method: "DELETE" }));
  assert.equal(missingId.status, 400);
  assert.deepEqual(await missingId.json(), { error: "id is required." });
});

test("testing harness lists fixtures without invoking a model", async () => {
  const response = await getHarnessFixtures();
  assert.equal(response.status, 200);
  const fixtures = await response.json() as {
    profiles: Record<string, { gradeLevel: string }>;
    scenarios: Array<{ id: string }>;
  };
  assert.equal(fixtures.profiles.secondaryOLevel.gradeLevel, "secondary");
  assert.ok(fixtures.scenarios.some((scenario) => scenario.id === "secondary-kinematics-mcq"));
});

test("testing harness reports a missing provider key before running a scenario", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const response = await runHarness(jsonRequest("http://localhost/api/testing-harness", "POST", {
      scenarioId: "does-not-matter-without-a-key",
    }));
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /OPENAI_API_KEY is not set/);
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("eval runner rejects a missing model key before starting a streamed job", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const response = await runEvals(jsonRequest("http://localhost/api/evals/run", "POST", {
      suiteId: "physics",
      model: "gpt-4o",
    }));
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /OPENAI_API_KEY is missing/);
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
