import assert from "node:assert/strict";
import { resolveEvalModel } from "./models";

assert.equal(resolveEvalModel("gemini-2.5-flash").provider, "google");
assert.equal(resolveEvalModel("gpt-4o").provider, "openai");
assert.equal(resolveEvalModel("not-a-model").id, "gpt-4o");
assert.equal(resolveEvalModel(undefined).id, "gpt-4o");

console.log("eval model catalog tests passed");
