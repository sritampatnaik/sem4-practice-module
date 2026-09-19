import assert from "node:assert/strict";
import { formatStudentContext } from "./context";
import { DEFAULT_PROFILE } from "./types";

const block = formatStudentContext({
  sessionId: "c1",
  profile: DEFAULT_PROFILE,
  recentChats: [
    { role: "user", text: "What is mole?", at: "2026-09-18T00:00:00.000Z" },
  ],
  retrievedContext: ["mole is the SI unit for amount of substance"],
});

assert.match(block, /Short-term memory/);
assert.match(block, /Retrieved chat context/);
assert.match(block, /mole is the SI unit/);

const empty = formatStudentContext({
  sessionId: "c1",
  profile: DEFAULT_PROFILE,
  recentChats: [],
});
assert.match(empty, /Retrieved chat context:\n- none yet/);

console.log("student context tests passed");
