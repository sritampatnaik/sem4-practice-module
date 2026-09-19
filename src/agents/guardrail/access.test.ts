import assert from "node:assert/strict";
import test from "node:test";
import { isAdminUser, parseEmailList } from "./access";
import { notifyRecipients } from "./notify";
import { resetGuardrailMemoryForTests, storeGuardrailAlert } from "./store";

test("admin role gate", () => {
  assert.deepEqual(parseEmailList("Parent@School.edu.sg, tutor@moe.edu.sg"), [
    "parent@school.edu.sg",
    "tutor@moe.edu.sg",
  ]);
  assert.deepEqual(parseEmailList("not-an-email"), []);

  assert.equal(isAdminUser({ email: "admin@school.edu.sg", role: "admin" }), true);
  assert.equal(isAdminUser({ email: "staff@school.edu.sg" }), false);
  assert.equal(isAdminUser({ email: "tutor@school.edu.sg", role: "tutor" }), false);
  assert.equal(isAdminUser({ email: "parent@home.sg", role: "parent" }), false);
  assert.equal(isAdminUser({ email: "student@school.edu.sg", role: "student" }), false);
  assert.equal(isAdminUser(null), false);

  const previous = {
    emails: process.env.METS_ADMIN_EMAILS,
    parent: process.env.METS_PARENT_NOTIFY_EMAIL,
  };
  try {
    process.env.METS_ADMIN_EMAILS = "staff@school.edu.sg";
    process.env.METS_PARENT_NOTIFY_EMAIL = "parent@home.sg";
    assert.deepEqual(notifyRecipients("carer@family.sg").sort(), [
      "carer@family.sg",
      "parent@home.sg",
      "staff@school.edu.sg",
    ]);
    assert.equal(
      isAdminUser({ email: "staff@school.edu.sg" }),
      false,
      "notify emails must not open /admin",
    );
  } finally {
    setEnv("METS_ADMIN_EMAILS", previous.emails);
    setEnv("METS_PARENT_NOTIFY_EMAIL", previous.parent);
  }
});

test("in-memory alerts dedupe the same snippet", async () => {
  resetGuardrailMemoryForTests();
  const stored = await storeGuardrailAlert({
    sessionId: "sess-1",
    userId: null,
    studentName: "Aisha",
    studentEmail: null,
    snippet: "I'm a failure and I'll never pass.",
    reason: "Disappointment language.",
    categories: ["disappointment"],
    severity: "medium",
    promptVersion: "1.0.0",
  });
  assert.equal(stored.studentName, "Aisha");
  assert.match(stored.id, /^gr_/);

  const dup = await storeGuardrailAlert({
    sessionId: "sess-1",
    userId: null,
    studentName: "Aisha",
    studentEmail: null,
    snippet: "I'm a failure and I'll never pass.",
    reason: "Disappointment language.",
    categories: ["disappointment"],
    severity: "medium",
    promptVersion: "1.0.0",
  });
  assert.equal(dup.id, stored.id);
});

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
