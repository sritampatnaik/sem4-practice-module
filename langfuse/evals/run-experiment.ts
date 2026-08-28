/**
 * CLI runner for the METS eval catalog.
 * Usage: npm run langfuse:run-evals -- --suite=routing
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function loadDotEnv(path: string) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const eq = line.indexOf("=");
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}
import { saveEvalRun } from "../../src/evals/store";
import { EVAL_SUITE_IDS } from "../../src/evals/types";
import { runEvalSuites } from "../../src/evals/runner";
import type { EvalSuiteId } from "../../src/evals/types";

const here = dirname(fileURLToPath(import.meta.url));
loadDotEnv(join(here, "..", "..", ".env.local"));
loadDotEnv(join(here, "..", "..", ".env"));
const suiteFlag = process.argv.find((arg) => arg.startsWith("--suite="));
const suiteId = suiteFlag?.slice("--suite=".length);
const suiteIds =
  suiteId && EVAL_SUITE_IDS.includes(suiteId as EvalSuiteId)
    ? [suiteId as EvalSuiteId]
    : undefined;

async function main() {
  let lastRun = null;
  for await (const event of runEvalSuites({ suiteIds })) {
    if (event.type === "item") {
      const item = event.result;
      console.log(
        `${item.passed ? "PASS" : "FAIL"}  ${item.suiteId.padEnd(10)}  ${item.title}  acc=${item.accuracy}  ${item.latencyMs}ms  $${item.costUsd.toFixed(5)}`,
      );
    }
    if (event.type === "suite") {
      const suite = event.summary;
      console.log(
        `\n${suite.name}: ${suite.passed}/${suite.itemCount}  acc=${suite.accuracy}  p50=${suite.p50LatencyMs}ms  $${suite.totalCostUsd.toFixed(5)}\n`,
      );
    }
    if (event.type === "done") {
      lastRun = event.run;
      saveEvalRun(event.run);
    }
  }
  if (!lastRun) {
    throw new Error("Eval run produced no results.");
  }
  const reportPath = join(here, "experiment-report.json");
  writeFileSync(reportPath, JSON.stringify(lastRun, null, 2));
  console.log(
    `\n${lastRun.totals.passed}/${lastRun.totals.itemCount} passed  acc=${lastRun.totals.accuracy}  avg=${lastRun.totals.avgLatencyMs}ms  $${lastRun.totals.totalCostUsd.toFixed(5)}`,
  );
  console.log(`Wrote ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
