
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chemistryItems } from "../../evals/catalog/chemistry";
import { GRADE_LEVELS } from "../_shared/types";

const allowedTools = new Set([
  "periodicTable",
  "reactionBalancer",
  "documentSearch",
  "webSearch",
]);

describe("Chemistry Eval Catalog - Dataset Integrity", () => {
  it("has unique case IDs", () => {
    const ids = chemistryItems.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("has no empty case IDs", () => {
    assert.deepEqual(
      chemistryItems.filter((item) => !item.id.trim()),
      [],
    );
  });

  it("has valid required fields and metadata", () => {
    const invalidItems = chemistryItems.filter(
      (item) =>
        !item.title.trim() ||
        !item.prompt.trim() ||
        !item.profile ||
        !item.scaffold ||
        !item.scaffold.contract.trim() ||
        !item.scaffold.goldReply.trim() ||
        !GRADE_LEVELS.includes(item.profile.gradeLevel) ||
        item.suiteId !== "chemistry" ||
        item.targetAgent !== "chemistry",
    );

    assert.deepEqual(invalidItems, []);
  });
});

describe("Chemistry Eval Catalog - Scaffold Validation", () => {
  it("does not contain empty optional arrays", () => {
    const invalidItems = chemistryItems.filter(
      (item) =>
        item.scaffold.requiredTools?.length === 0 ||
        item.scaffold.mustNotInclude?.length === 0 ||
        item.scaffold.mustInclude?.length === 0,
    );

    assert.deepEqual(invalidItems, []);
  });

  it("only references supported chemistry tools", () => {
    const invalidTools = chemistryItems.flatMap((item) =>
      (item.scaffold.requiredTools ?? [])
        .filter((name) => !allowedTools.has(name))
        .map((name) => `${item.id}:${name}`),
    );

    assert.deepEqual(invalidTools, []);
  });
});

describe("Chemistry Eval Catalog - Dataset Coverage", () => {
  it("reports profile and required-tool coverage", () => {
    const profileCounts = chemistryItems.reduce(
      (counts, item) => {
        counts[item.profile.gradeLevel] += 1;
        return counts;
      },
      { primary: 0, secondary: 0, jc: 0 },
    );

    const requiredToolCounts = Object.fromEntries(
      Array.from(allowedTools, (tool) => [
        tool,
        chemistryItems.filter((item) =>
          item.scaffold.requiredTools?.includes(tool),
        ).length,
      ]),
    );

    const summary = {
      chemistryCases: chemistryItems.length,
      uniqueIds: new Set(chemistryItems.map((item) => item.id)).size,
      profileCounts,
      requiredToolCases: chemistryItems.filter(
        (item) => item.scaffold.requiredTools?.length,
      ).length,
      requiredToolCounts,
    };

    console.log(JSON.stringify(summary, null, 2));

    assert.equal(
      Object.values(profileCounts).reduce((a, b) => a + b, 0),
      chemistryItems.length,
    );
  });
});
