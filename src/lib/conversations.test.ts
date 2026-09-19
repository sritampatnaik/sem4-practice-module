import assert from "node:assert/strict";
import { nextTitle } from "./conversations";
import { titleFromText } from "./chunks";

assert.equal(nextTitle("New chat", "How do I differentiate x squared?"), titleFromText("How do I differentiate x squared?"));
assert.equal(nextTitle("Kinematics", "Another question"), "Kinematics");
assert.equal(nextTitle("", "Balance Fe + O2"), titleFromText("Balance Fe + O2"));

console.log("conversation title tests passed");
