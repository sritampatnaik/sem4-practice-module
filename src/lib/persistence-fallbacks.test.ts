import assert from "node:assert/strict";
import test from "node:test";
import type { ChatMemoryItem, StudentProfile } from "@/agents/_shared/types";
import {
  createConversation,
  ensureConversation,
  listConversationMessages,
  listConversations,
  touchConversation,
} from "./conversations";
import { getRecentChats, previewText, rememberTurn } from "./memory";
import {
  deleteStudentSession,
  getStudentByUserId,
  getStudentSession,
  upsertStudentSession,
} from "./students";

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

test("conversation helpers provide safe local fallbacks without Supabase", async () => {
  await withoutSupabase(async () => {
    assert.deepEqual(await listConversations("student-1"), []);

    const created = await createConversation("student-1", {
      id: "conversation-1",
      title: "  Forces revision  ",
    });
    assert.equal(created.id, "conversation-1");
    assert.equal(created.title, "Forces revision");
    assert.ok(Date.parse(created.createdAt));
    assert.ok(Date.parse(created.updatedAt));

    const untitled = await createConversation("student-1", {
      id: "conversation-2",
      title: "   ",
    });
    assert.equal(untitled.title, "New chat");

    assert.deepEqual(await ensureConversation("conversation-3", "student-1"), {
      id: "conversation-3",
      title: "New chat",
      createdAt: "",
      updatedAt: "",
    });
    assert.equal(await touchConversation("conversation-3", { title: "Kinematics" }), undefined);
    assert.deepEqual(
      await listConversationMessages("conversation-3", "student-1"),
      [],
    );
  });
});

test("memory keeps the latest ten turns when persistence is unavailable", async () => {
  await withoutSupabase(async () => {
    const sessionId = `memory-test-${crypto.randomUUID()}`;
    assert.deepEqual(await getRecentChats(sessionId), []);

    for (let index = 0; index < 12; index += 1) {
      const item: ChatMemoryItem = {
        role: index % 2 === 0 ? "user" : "assistant",
        text: `message ${index}`,
        agent: "physics",
        at: new Date(2026, 0, index + 1).toISOString(),
      };
      await rememberTurn(sessionId, item);
    }

    const recent = await getRecentChats(sessionId);
    assert.equal(recent.length, 10);
    assert.equal(recent[0]?.text, "message 2");
    assert.equal(recent[9]?.text, "message 11");
    assert.equal(previewText("  force   and   motion  "), "force and motion");
    assert.equal(previewText("abcdef", 4), "abc…");
  });
});

test("student helpers fail safely when persistence is unavailable", async () => {
  await withoutSupabase(async () => {
    const profile: StudentProfile = {
      name: "Aisha",
      gradeLevel: "secondary",
      grade: "sec3",
      diagnostic: { physics: "developing" },
      notes: ["Prefers worked examples."],
    };

    assert.deepEqual(await upsertStudentSession("session-1", profile), {
      ok: false,
      reason: "unconfigured",
    });
    assert.equal(await getStudentSession("session-1"), null);
    assert.equal(await getStudentByUserId("student-1"), null);
    assert.equal(await deleteStudentSession("session-1"), undefined);
  });
});
