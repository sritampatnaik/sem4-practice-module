import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { allEvalItems, refreshEvalCatalog } from "../src/evals/live-catalog";
import { loadPromptfooEnv } from "./load-env";

/**
 * Smoke subset — 23 of 248 evals (~9%) for CI.
 * Covers: one happy-path per grade band, one tool-use, one boundary/refusal per agent.
 * Run full suite locally: PROMPTFOO_FULL_SUITE=1 npm run promptfoo:prepare
 */
const SMOKE_IDS = new Set([
  // routing (4)
  "routing-greeting",
  "routing-kinematics-trap",
  "routing-quiz-waves",
  "routing-unclear-science",
  // concierge (3)
  "concierge-who",
  "concierge-english",
  "concierge-stuck",
  // math (3)
  "math-three-quarters",
  "math-product-rule",
  "math-topology-refuse",
  // physics (5)
  "physics-fma",
  "physics-quantum",
  "physics-primary-forces",
  "physics-units-trap",
  "physics-energy",
  // chemistry (3)
  "chem-balance",
  "chem-moles",
  "chem-safety",
  // testing (5)
  "testing-secondary-kinematics-mcq",
  "testing-secondary-algebra-flashcards",
  "testing-refuse-live-paper",
  "testing-six-kinematics-mcqs",
  "testing-ignore-instructions-attempt",
]);

type PromptfooTest = {
  description: string;
  vars: {
    itemId: string;
    prompt: string;
  };
  metadata: {
    suiteId: string;
    kind: string;
    targetAgent: string;
    gradeLevel: string;
    title: string;
  };
  assert: Array<{
    type: "javascript";
    value: string;
  }>;
};

async function main() {
  loadPromptfooEnv();
  await refreshEvalCatalog();

  const fullSuite = process.env.PROMPTFOO_FULL_SUITE === "1";
  const items = fullSuite ? allEvalItems() : allEvalItems().filter((item) => SMOKE_IDS.has(item.id));

  const tests: PromptfooTest[] = items.map((item) => ({
    description: `[${item.suiteId}] ${item.title}`,
    vars: {
      itemId: item.id,
      prompt: item.prompt,
    },
    metadata: {
      suiteId: item.suiteId,
      kind: item.kind,
      targetAgent: item.targetAgent,
      gradeLevel: item.profile.gradeLevel,
      title: item.title,
    },
    assert: [
      {
        type: "javascript",
        value: "file://./promptfoo/assertions/eval-result.cjs",
      },
    ],
  }));

  const outputDir = path.join(process.cwd(), "promptfoo");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "tests.generated.json");
  writeFileSync(outputPath, `${JSON.stringify(tests, null, 2)}\n`, "utf8");

  const suiteCounts = tests.reduce<Record<string, number>>((counts, test) => {
    counts[test.metadata.suiteId] = (counts[test.metadata.suiteId] ?? 0) + 1;
    return counts;
  }, {});

  const mode = fullSuite ? "full" : "smoke";
  console.log(
    `Wrote ${outputPath} with ${tests.length} tests [${mode}] across suites: ${Object.entries(suiteCounts)
      .map(([suiteId, count]) => `${suiteId}=${count}`)
      .join(", ")}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
