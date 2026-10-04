import assert from "node:assert/strict";
import test from "node:test";
import { EXAM_FACTS, examFactsTool, type ExamId } from "./exam-facts";

const execute = examFactsTool.execute as unknown as (
  input: { exam: ExamId },
  options: { toolCallId: string; messages: never[] },
) => Promise<Record<string, unknown>>;

test("every exam has a SEAB source, a calculator rule and at least one paper", () => {
  for (const [id, facts] of Object.entries(EXAM_FACTS)) {
    assert.match(facts.source, /^https:\/\/isomer-user-content\.by\.gov\.sg\//, id);
    assert.ok(facts.papers.length > 0, id);
    assert.ok(facts.calculator.length > 0, id);
  }
});

test("the facts the baseline got wrong are stated plainly", () => {
  assert.match(EXAM_FACTS["o-level-additional-mathematics"].calculator, /both Paper 1 and Paper 2/);
  assert.match(EXAM_FACTS["o-level-mathematics"].calculator, /both Paper 1 and Paper 2/);
  assert.match(EXAM_FACTS["psle-standard"].calculator, /Not allowed in Paper 1\. Allowed in Paper 2/);
  assert.match(EXAM_FACTS["a-level-h2"].assessmentObjectives, /30%.*60%.*10%/);
  assert.match(EXAM_FACTS.mf27.formulae, /sin x/);
  assert.ok(EXAM_FACTS.mf27.notes.some((note) => /product, quotient and chain rules are not/.test(note)));
  // Asked about H1 or H2, the model must still learn what MF27 leaves out (eval run 5).
  for (const exam of ["a-level-h1", "a-level-h2"] as const) {
    assert.match(EXAM_FACTS[exam].formulae, /does not include the product, quotient or chain rules/, exam);
  }
});

test("unconfirmed details are listed, not filled in", () => {
  const foundation = EXAM_FACTS["psle-foundation"];
  assert.ok(foundation.unconfirmed.length > 0);
  assert.ok(!foundation.papers.some((paper) => /\b\d+ marks\b/.test(paper) && /Paper [12]:/.test(paper)), "no per-paper marks yet");
});

test("the tool returns the facts with their check date", async () => {
  const result = await execute({ exam: "a-level-h2" }, { toolCallId: "test", messages: [] });
  assert.equal(result.ok, true);
  assert.equal(result.code, "9758");
  assert.match(String(result.checkedOn), /^\d{4}-\d{2}-\d{2}$/);
});
