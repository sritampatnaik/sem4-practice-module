import assert from "node:assert/strict";
import { applyDiagnosticAnswers, scoreAnswer } from "./profile-storage";
import type { StudentProfile } from "@/agents/_shared/types";

const base: StudentProfile = {
  name: "Aisha",
  gradeLevel: "secondary",
  grade: "sec3",
  diagnostic: {},
  notes: [
    "Year: Secondary 3. Diagnostics not taken yet. Infer prior knowledge from the conversation.",
  ],
};

assert.equal(scoreAnswer("4", ["4"]), true);
assert.equal(scoreAnswer("Newton", ["newton", "n"]), true);

const scored = applyDiagnosticAnswers(base, {
  math: "4",
  physics: "newton",
  chemistry: "",
});

assert.equal(scored.diagnostic.math, "secure");
assert.equal(scored.diagnostic.physics, "secure");
assert.equal(scored.diagnostic.chemistry, "emerging");
assert.equal(scored.notes[0], "Year: Secondary 3.");
assert.ok(scored.notes.some((note) => note.includes("math diagnostic: secure")));
assert.ok(scored.notes.some((note) => note.includes("chemistry diagnostic: needs teaching (blank)")));
assert.ok(!scored.notes.some((note) => note.includes("Diagnostics not taken")));

const developing = applyDiagnosticAnswers(base, {
  math: "99",
  physics: "joule",
  chemistry: "12",
});
assert.equal(developing.diagnostic.math, "developing");
assert.equal(developing.diagnostic.physics, "developing");
assert.equal(developing.diagnostic.chemistry, "developing");

console.log("profile-storage tests passed");
