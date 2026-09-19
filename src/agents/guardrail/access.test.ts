import assert from "node:assert/strict";
import test from "node:test";
import { adminDevBypassEnabled, isAdminUser, parseEmailList, parseRoleList } from "./access";
import { notifyRecipients } from "./notify";
import { resetGuardrailMemoryForTests, storeGuardrailAlert } from "./store";

test("admin email and role gates", () => {
  assert.deepEqual(parseEmailList("Parent@School.edu.sg, tutor@moe.edu.sg"), [
    "parent@school.edu.sg",
    "tutor@moe.edu.sg",
  ]);
  assert.deepEqual(parseEmailList("not-an-email"), []);
  assert.deepEqual(parseRoleList(undefined), ["admin", "tutor", "parent"]);

  const previous = {
    emails: process.env.METS_ADMIN_EMAILS,
    roles: process.env.METS_ADMIN_ROLES,
    parent: process.env.METS_PARENT_NOTIFY_EMAIL,
    dev: process.env.METS_ADMIN_DEV,
    node: process.env.NODE_ENV,
  };

  try {
    process.env.METS_ADMIN_EMAILS = "staff@school.edu.sg";
    process.env.METS_ADMIN_ROLES = "admin";
    process.env.METS_PARENT_NOTIFY_EMAIL = "parent@home.sg";
    process.env.METS_ADMIN_DEV = "1";
    setEnv("NODE_ENV", "development");

    assert.equal(isAdminUser({ email: "staff@school.edu.sg" }), true);
    assert.equal(isAdminUser({ email: "student@school.edu.sg" }), false);
    assert.equal(isAdminUser({ email: "student@school.edu.sg", role: "admin" }), true);
    assert.equal(isAdminUser({ email: "student@school.edu.sg", role: "student" }), false);
    assert.equal(adminDevBypassEnabled(), true);

    setEnv("NODE_ENV", "production");
    assert.equal(adminDevBypassEnabled(), false);

    assert.deepEqual(notifyRecipients("carer@family.sg").sort(), [
      "carer@family.sg",
      "parent@home.sg",
      "staff@school.edu.sg",
    ]);
  } finally {
    setEnv("METS_ADMIN_EMAILS", previous.emails);
    setEnv("METS_ADMIN_ROLES", previous.roles);
    setEnv("METS_PARENT_NOTIFY_EMAIL", previous.parent);
    setEnv("METS_ADMIN_DEV", previous.dev);
    setEnv("NODE_ENV", previous.node);
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
