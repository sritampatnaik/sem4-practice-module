import assert from "node:assert/strict";
import { chunkText, titleFromText } from "./chunks";

assert.deepEqual(chunkText(""), []);
assert.deepEqual(chunkText("short note"), ["short note"]);

const long = "abcdefghij".repeat(80);
const chunks = chunkText(long, 50, 10);
assert.ok(chunks.length > 1);
assert.equal(chunks[0]?.length, 50);
assert.ok(chunks.at(-1));

assert.equal(titleFromText("   How do I differentiate x squared?   "), "How do I differentiate x squared?");
assert.ok(titleFromText("x".repeat(80)).endsWith("…"));

console.log("chunk tests passed");
