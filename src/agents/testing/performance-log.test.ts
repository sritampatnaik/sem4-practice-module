import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeStagedAssessmentPerformanceEntry,
  previewAssessmentNote,
  stageAssessmentPerformanceEntry,
} from "./performance-log";

test("staged assessment performance entries can be consumed once", () => {
  stageAssessmentPerformanceEntry({
    sessionId: "session-1",
    studentName: "Alex",
    gradeLevel: "secondary",
    subject: "physics",
    mode: "mcq",
    title: "Kinematics quiz",
    topics: ["Kinematics"],
    visualFormat: "none",
    note: "Focus on basics.",
  });

  const first = consumeStagedAssessmentPerformanceEntry("session-1");
  const second = consumeStagedAssessmentPerformanceEntry("session-1");

  assert.equal(first?.title, "Kinematics quiz");
  assert.equal(second, null);
});

test("previewAssessmentNote compacts whitespace and truncates long text", () => {
  assert.equal(
    previewAssessmentNote("  Focus on   graphs \n and   acceleration. "),
    "Focus on graphs and acceleration.",
  );
  assert.match(previewAssessmentNote("x".repeat(260)), /…$/);
});
