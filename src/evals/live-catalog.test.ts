import assert from "node:assert/strict";
import { addEvalItem, getEvalSuite, removeEvalItem, saveEvalItem } from "./live-catalog";

async function main() {
  const before = getEvalSuite("math").items.length;
  const added = await addEvalItem("math");

  try {
    assert.equal(added.suiteId, "math");
    assert.equal(added.title, "New eval");
    assert.equal(getEvalSuite("math").items.length, before + 1);

    const saved = await saveEvalItem({
      ...added,
      title: "Fractions check",
      prompt: "What is 1/2 of 8?",
      goldReply: "The answer is 4.",
      contract: "Primary fractions.",
      mustInclude: ["4"],
      mustNotInclude: [],
      requiredTools: ["equationSolver"],
      gradeLevel: "primary",
    });
    assert.equal(saved.title, "Fractions check");
    assert.equal(
      getEvalSuite("math").items.find((item) => item.id === added.id)?.prompt,
      "What is 1/2 of 8?",
    );
  } finally {
    await removeEvalItem(added.id);
  }

  assert.equal(getEvalSuite("math").items.length, before);
  assert.equal(
    getEvalSuite("math").items.some((item) => item.id === added.id),
    false,
  );

  console.log("live catalog tests passed");
}

void main();
