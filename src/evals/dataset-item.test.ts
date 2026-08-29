import assert from "node:assert/strict";
import { physicsItems } from "./catalog/physics";
import {
  examplePhysicsDataset,
  parseDatasetJson,
  prettyDataset,
  splitMust,
  toDatasetItem,
} from "./dataset-item";
import { datasetToDraft } from "./dataset-item";

const example = examplePhysicsDataset();
assert.equal(example.input.message, "Is quantum physics in O-Level or A-Level?");
assert.deepEqual(example.output.must, ["documentSearch", "A-Level / JC, not O-Level"]);
assert.deepEqual(example.output.mustNot, ["dump university quantum content"]);
assert.equal(example.output.agent, "physics");
assert.equal(example.output.intent, "teaching");
assert.equal(example.output.subject, "physics");
assert.equal(example.metadata.source, "readme-smoke");

const split = splitMust(example.output.must);
assert.deepEqual(split.requiredTools, ["documentSearch"]);
assert.deepEqual(split.mustInclude, ["A-Level / JC, not O-Level"]);

const quantum = physicsItems.find((item) => item.id === "physics-quantum");
assert.ok(quantum);
const dataset = toDatasetItem(quantum);
assert.equal(dataset.input.message, example.input.message);
assert.deepEqual(dataset.output.must, example.output.must);
assert.deepEqual(dataset.output.mustNot, example.output.mustNot);
assert.equal(dataset.output.agent, "physics");
assert.equal(dataset.metadata.source, "readme-smoke");

const parsed = parseDatasetJson(JSON.parse(prettyDataset(example)));
const draft = datasetToDraft(parsed, { id: "physics-quantum", suiteId: "physics", kind: "teaching" });
assert.equal(draft.prompt, example.input.message);
assert.deepEqual(draft.requiredTools, ["documentSearch"]);
assert.deepEqual(draft.mustInclude, ["A-Level / JC, not O-Level"]);
assert.deepEqual(draft.mustNotInclude, ["dump university quantum content"]);
assert.equal(draft.targetAgent, "physics");
assert.equal(draft.profile?.name, "Alex");

console.log("dataset item tests passed");
