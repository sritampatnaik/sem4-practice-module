import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { allEvalItems, refreshEvalCatalog } from "../src/evals/live-catalog";
import { loadPromptfooEnv } from "./load-env";

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

  const tests: PromptfooTest[] = allEvalItems().map((item) => ({
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

  console.log(
    `Wrote ${outputPath} with ${tests.length} tests across suites: ${Object.entries(suiteCounts)
      .map(([suiteId, count]) => `${suiteId}=${count}`)
      .join(", ")}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
