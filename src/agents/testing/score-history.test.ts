import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTestingTopicKey,
  buildTestingTopicLabel,
  summariseTestingAttempts,
  type TestingAttemptRecord,
} from "./score-history";

test("topic key and label normalise repeated quiz topics", () => {
  const topics = ["Differentiation", "differentiation", "Chain Rule"];

  assert.equal(
    buildTestingTopicKey({ topics, title: "H2 Differentiation MCQ Practice" }),
    "differentiation--chain-rule",
  );
  assert.equal(
    buildTestingTopicLabel({ topics, title: "H2 Differentiation MCQ Practice" }),
    "Differentiation / Chain Rule",
  );
});

test("attempt summaries detect improvement by subject, topic, and mode", () => {
  const attempts: TestingAttemptRecord[] = [
    {
      id: "a-2",
      userId: "u1",
      conversationId: "c2",
      subject: "math",
      mode: "mcq",
      topicKey: "differentiation",
      topicLabel: "Differentiation",
      title: "H2 Differentiation Quiz",
      score: 4,
      totalQuestions: 5,
      completedAt: "2026-09-22T10:00:00.000Z",
      topics: ["Differentiation"],
    },
    {
      id: "a-1",
      userId: "u1",
      conversationId: "c1",
      subject: "math",
      mode: "mcq",
      topicKey: "differentiation",
      topicLabel: "Differentiation",
      title: "H2 Differentiation Quiz",
      score: 2,
      totalQuestions: 5,
      completedAt: "2026-09-20T10:00:00.000Z",
      topics: ["Differentiation"],
    },
    {
      id: "a-3",
      userId: "u1",
      conversationId: "c3",
      subject: "physics",
      mode: "mcq",
      topicKey: "kinematics",
      topicLabel: "Kinematics",
      title: "O-Level Kinematics MCQ",
      score: 3,
      totalQuestions: 5,
      completedAt: "2026-09-21T10:00:00.000Z",
      topics: ["Kinematics"],
    },
  ];

  const summaries = summariseTestingAttempts(attempts);
  const differentiation = summaries.find((summary) => summary.topicKey === "differentiation");
  const kinematics = summaries.find((summary) => summary.topicKey === "kinematics");

  assert.equal(summaries.length, 2);
  assert.equal(differentiation?.attemptsCount, 2);
  assert.equal(differentiation?.latest.percentage, 80);
  assert.equal(differentiation?.previous?.percentage, 40);
  assert.equal(differentiation?.best.percentage, 80);
  assert.equal(differentiation?.trend, "improving");

  assert.equal(kinematics?.attemptsCount, 1);
  assert.equal(kinematics?.trend, "new");
});
