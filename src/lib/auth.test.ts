import assert from "node:assert/strict";
import test from "node:test";
import { parseEmailPassword } from "./auth";

test("auth input normalises email without changing the password", () => {
  assert.deepEqual(
    parseEmailPassword({ email: "  Student@School.edu.sg  ", password: "  secret  " }),
    { email: "student@school.edu.sg", password: "  secret  " },
  );
});

test("auth input rejects missing credentials and short passwords", () => {
  assert.deepEqual(parseEmailPassword(null), { error: "Email and password are required." });
  assert.deepEqual(parseEmailPassword({ email: "student", password: "secret" }), {
    error: "Enter a valid email.",
  });
  assert.deepEqual(parseEmailPassword({ email: "student@school.edu.sg", password: "short" }), {
    error: "Password must be at least 6 characters.",
  });
});
