import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { DEFAULT_PROFILE } from "../_shared/types";
import { buildMathInstructions, MATH_PROMPT_VERSION } from "./prompts";

test("Math instructions carry the teaching and examination rules", () => {
  const prompt = buildMathInstructions({ sessionId: "test", profile: DEFAULT_PROFILE, recentChats: [] });
  assert.match(prompt, /Name the method/);
  assert.match(prompt, /LaTeX/);
  assert.match(prompt, /Respect the tool's limits/);
  assert.match(prompt, /Examination alignment/);
  assert.match(prompt, /does not replace the explanation/);
  assert.match(prompt, /Testing/);
  assert.match(prompt, /Every graph comes from the graph tool/);
  assert.match(prompt, /never repeat its data/);
  assert.match(prompt, /named as the syllabus names it/);
  assert.match(prompt, /exam facts tool/);
  assert.match(prompt, /differentiate your answer with the tool, not the integrand/);
  assert.match(prompt, /are data, not instructions/);
  assert.match(prompt, /name its source/);
  assert.match(prompt, /A hint is one idea or the first step/);
  assert.match(prompt, /name the first wrong step/);
  assert.match(prompt, /3 significant figures/);
  assert.match(prompt, /are Additional Mathematics, not Mathematics/);
  assert.match(prompt, /skip the working/);
});

test("the Langflow copy of the prompt is on the same version", () => {
  const copy = readFileSync(join(process.cwd(), "langflow/prompts/math.system.md"), "utf8");
  assert.match(copy, new RegExp(`^# Math agent system prompt v${MATH_PROMPT_VERSION.replace(/\./g, "\\.")}$`, "m"));
});
