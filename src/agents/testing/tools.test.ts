import assert from "node:assert/strict";
import test from "node:test";
import {
  createMcqSetTool,
  flashcardSetInputSchema,
  mcqSetInputSchema,
  recordPerformanceInputSchema,
} from "./tools";

test("mcq schema rejects duplicate option ids and invalid correctOptionId", () => {
  assert.throws(
    () =>
      mcqSetInputSchema.parse({
        title: "Bad quiz",
        subject: "physics",
        items: [
          {
            id: "q1",
            question: "What is speed?",
            options: [
              { id: "a", label: "distance/time" },
              { id: "a", label: "force/area" },
              { id: "c", label: "current x resistance" },
            ],
            correctOptionId: "z",
            explanation: "Speed is distance over time.",
            topic: "kinematics",
          },
        ],
      }),
    /Duplicate option id|correctOptionId must match/i,
  );
});

test("flashcard schema rejects duplicate card ids", () => {
  assert.throws(
    () =>
      flashcardSetInputSchema.parse({
        title: "Bad flashcards",
        subject: "chemistry",
        cards: [
          { id: "c1", front: "Acid", back: "Proton donor", topic: "acids and bases" },
          { id: "c1", front: "Base", back: "Proton acceptor", topic: "acids and bases" },
          { id: "c3", front: "Alkali", back: "Soluble base", topic: "acids and bases" },
        ],
      }),
    /Duplicate card id/i,
  );
});

test("physics mcq execution rejects mismatched explanation and correct answer", async () => {
  await assert.rejects(
    async () => {
      await createMcqSetTool.execute!(
        {
          title: "Physics quiz",
          subject: "physics",
          items: [
            {
              id: "q1",
              question: "Find the speed.",
              options: [
                { id: "a", label: "2 m/s" },
                { id: "b", label: "4 m/s" },
                { id: "c", label: "6 m/s" },
              ],
              correctOptionId: "a",
              explanation: "Using $v = d/t$, the final answer = 4",
              topic: "kinematics",
            },
            {
              id: "q2",
              question: "Which statement is true?",
              options: [
                { id: "a", label: "Force is a vector" },
                { id: "b", label: "Mass is measured in newtons" },
                { id: "c", label: "Speed has direction" },
              ],
              correctOptionId: "a",
              explanation: "Force has magnitude and direction.",
              topic: "forces",
            },
          ],
        },
        { toolCallId: "tool-1", messages: [] },
      );
    },
    /Physics MCQ validation failed/i,
  );
});

test("recordPerformance is strict and rejects invented score fields", () => {
  assert.throws(
    () =>
      recordPerformanceInputSchema.parse({
        subject: "physics",
        mode: "mcq",
        title: "Kinematics follow-up",
        topics: ["Kinematics"],
        visualFormat: "none",
        note: "Focused on velocity-time graph reading.",
        outcome: "80%",
      }),
    /Unrecognized key/i,
  );
});
