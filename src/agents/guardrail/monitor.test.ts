import assert from "node:assert/strict";
import test from "node:test";
import {
  listGuardrailAlerts,
  monitorStudentTurn,
  resetGuardrailMemoryForTests,
} from "./index";

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("I want to give up on life stores an open staff alert", async () => {
  const previous = {
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    googleApi: process.env.GOOGLE_API_KEY,
    typesafe: process.env.TYPESAFE_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  try {
    setEnv("OPENAI_API_KEY", undefined);
    setEnv("GOOGLE_GENERATIVE_AI_API_KEY", undefined);
    setEnv("GEMINI_API_KEY", undefined);
    setEnv("GOOGLE_API_KEY", undefined);
    setEnv("TYPESAFE_API_KEY", undefined);
    setEnv("SUPABASE_URL", undefined);
    setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    resetGuardrailMemoryForTests();

    const result = await monitorStudentTurn({
      sessionId: "sess-give-up-on-life",
      studentName: "Aisha",
      studentText: "I want to give up on life",
    });

    assert.equal(result.hit, true);
    assert.ok(result.alert);
    assert.ok(result.alert.categories.includes("self_harm"));
    assert.equal(result.alert.severity, "critical");
    assert.equal(result.alert.acknowledgedAt, null);
    assert.match(result.alert.snippet, /I want to give up on life/i);

    const open = (await listGuardrailAlerts()).filter(
      (alert) => !alert.acknowledgedAt && alert.sessionId === "sess-give-up-on-life",
    );
    assert.equal(open.length, 1);
  } finally {
    setEnv("OPENAI_API_KEY", previous.openai);
    setEnv("GOOGLE_GENERATIVE_AI_API_KEY", previous.google);
    setEnv("GEMINI_API_KEY", previous.gemini);
    setEnv("GOOGLE_API_KEY", previous.googleApi);
    setEnv("TYPESAFE_API_KEY", previous.typesafe);
    setEnv("SUPABASE_URL", previous.supabaseUrl);
    setEnv("SUPABASE_SERVICE_ROLE_KEY", previous.supabaseKey);
  }
});
