import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateRequestedLevelAccess,
  parseRequestedSchoolGrade,
  resolveStudentGrade,
} from "./level-gating";

test("requested level parser recognises common school-year labels", () => {
  assert.equal(parseRequestedSchoolGrade("Give me P5 fractions questions."), "p5");
  assert.equal(parseRequestedSchoolGrade("Quiz me on O-Level Chemistry."), "sec4");
  assert.equal(parseRequestedSchoolGrade("Flashcards for JC2 Physics."), "jc2");
});

test("student grade resolves from exact year or band fallback", () => {
  assert.equal(resolveStudentGrade("p3", "primary"), "p3");
  assert.equal(resolveStudentGrade(undefined, "secondary"), "sec5");
});

test("higher requested levels are blocked deterministically", () => {
  const result = evaluateRequestedLevelAccess({
    studentGrade: "p6",
    studentGradeLevel: "primary",
    request: "Give me five O-Level Chemistry MCQs on acids and bases.",
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /above the student's current level/i);
});

test("lower-band requests are allowed and marked as revision", () => {
  const result = evaluateRequestedLevelAccess({
    studentGrade: "sec4",
    studentGradeLevel: "secondary",
    request: "Make flashcards on Primary 5 fractions.",
  });

  assert.equal(result.status, "allowed");
  assert.match(result.levelNote ?? "", /revision/i);
});
