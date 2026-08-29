import assert from "node:assert/strict";
import { parseEvalJobs } from "./jobs";

const all = parseEvalJobs({ model: "gpt-4o" });
assert.equal(all.length, 6);
assert.equal(all[0]?.model, "gpt-4o");

const one = parseEvalJobs({ suiteId: "physics", model: "gemini-2.5-flash" });
assert.deepEqual(one, [{ suiteId: "physics", model: "gemini-2.5-flash" }]);

const mixed = parseEvalJobs({
  jobs: [
    { suiteId: "math", model: "gpt-4o" },
    { suiteId: "physics", model: "gemini-2.5-pro" },
    { suiteId: "nope", model: "gpt-4o" },
  ],
});
assert.deepEqual(mixed, [
  { suiteId: "math", model: "gpt-4o" },
  { suiteId: "physics", model: "gemini-2.5-pro" },
]);

console.log("eval job parse tests passed");
