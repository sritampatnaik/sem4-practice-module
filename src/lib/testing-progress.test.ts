import assert from "node:assert/strict";
import test from "node:test";
import {
  listTestingAttemptSummaries,
  recordTestingAttempt,
  verifyConversationOwnership,
} from "./testing-progress";

const SUPABASE_ENV = [
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;

async function withoutSupabase(run: () => Promise<void>) {
  const previous = new Map(SUPABASE_ENV.map((name) => [name, process.env[name]]));
  for (const name of SUPABASE_ENV) delete process.env[name];
  try {
    await run();
  } finally {
    for (const name of SUPABASE_ENV) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("testing progress fails closed when persistence is not configured", async () => {
  await withoutSupabase(async () => {
    assert.equal(await verifyConversationOwnership("conversation-1", "student-1"), false);

    const recorded = await recordTestingAttempt({
      userId: "student-1",
      conversationId: "conversation-1",
      subject: "physics",
      mode: "mcq",
      title: "Forces quiz",
      score: 2,
      totalQuestions: 3,
      topics: ["Forces"],
    });
    assert.deepEqual(recorded, { ok: false, reason: "unconfigured" });

    const listed = await listTestingAttemptSummaries("student-1");
    assert.deepEqual(listed, {
      ok: false,
      reason: "unconfigured",
      summaries: [],
    });
  });
});
