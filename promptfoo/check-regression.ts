import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type PromptfooResultEntry = {
  metadata?: { suiteId?: unknown };
  testCase?: { metadata?: { suiteId?: unknown } };
  gradingResult?: { pass?: unknown };
};

type PromptfooResultsFile = {
  results?: {
    results?: PromptfooResultEntry[];
  };
};

type SuiteMetrics = {
  expectedCases: number;
  passedCases: number;
  passRate: number;
};

type BaselineFile = {
  version: 1;
  subset: "smoke";
  generatedAt: string;
  passRateTolerance: number;
  suites: Record<string, { expectedCases: number; passRate: number }>;
};

const DEFAULT_RESULTS_PATH = path.join(process.cwd(), "promptfoo", "promptfoo-results.json");
const DEFAULT_BASELINE_PATH = path.join(process.cwd(), "promptfoo", "baseline.json");
const DEFAULT_PASS_RATE_TOLERANCE = 0.1;

function parseArgs(argv: string[]) {
  let resultsPath = DEFAULT_RESULTS_PATH;
  let baselinePath = DEFAULT_BASELINE_PATH;
  let writeBaseline = false;
  let tolerance = DEFAULT_PASS_RATE_TOLERANCE;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("-") && resultsPath === DEFAULT_RESULTS_PATH) {
      resultsPath = path.resolve(arg);
      continue;
    }
    if (arg === "--results" && argv[index + 1]) {
      resultsPath = path.resolve(argv[index + 1]!);
      index += 1;
      continue;
    }
    if (arg === "--baseline" && argv[index + 1]) {
      baselinePath = path.resolve(argv[index + 1]!);
      index += 1;
      continue;
    }
    if (arg === "--tolerance" && argv[index + 1]) {
      tolerance = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === "--write-baseline") {
      writeBaseline = true;
    }
  }

  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 1) {
    throw new Error(`Tolerance must be a number between 0 and 1. Received '${tolerance}'.`);
  }

  return { resultsPath, baselinePath, writeBaseline, tolerance };
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function suiteIdOf(entry: PromptfooResultEntry) {
  const fromMetadata = entry.metadata?.suiteId;
  if (typeof fromMetadata === "string" && fromMetadata.trim()) return fromMetadata;
  const fromTestCase = entry.testCase?.metadata?.suiteId;
  if (typeof fromTestCase === "string" && fromTestCase.trim()) return fromTestCase;
  throw new Error("Promptfoo result entry is missing metadata.suiteId.");
}

function isPassed(entry: PromptfooResultEntry) {
  return entry.gradingResult?.pass === true;
}

function roundRate(value: number) {
  return Number(value.toFixed(3));
}

function collectSuiteMetrics(resultsFile: PromptfooResultsFile) {
  const entries = resultsFile.results?.results;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("No Promptfoo result entries were found in promptfoo-results.json.");
  }

  const counts = new Map<string, { expectedCases: number; passedCases: number }>();

  for (const entry of entries) {
    const suiteId = suiteIdOf(entry);
    const current = counts.get(suiteId) ?? { expectedCases: 0, passedCases: 0 };
    current.expectedCases += 1;
    if (isPassed(entry)) current.passedCases += 1;
    counts.set(suiteId, current);
  }

  return Object.fromEntries(
    [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([suiteId, metrics]) => [
        suiteId,
        {
          expectedCases: metrics.expectedCases,
          passedCases: metrics.passedCases,
          passRate: roundRate(metrics.passedCases / metrics.expectedCases),
        } satisfies SuiteMetrics,
      ]),
  ) as Record<string, SuiteMetrics>;
}

function writeBaselineFile(filePath: string, suites: Record<string, SuiteMetrics>, tolerance: number) {
  const baseline: BaselineFile = {
    version: 1,
    subset: "smoke",
    generatedAt: new Date().toISOString(),
    passRateTolerance: tolerance,
    suites: Object.fromEntries(
      Object.entries(suites).map(([suiteId, metrics]) => [
        suiteId,
        {
          expectedCases: metrics.expectedCases,
          passRate: metrics.passRate,
        },
      ]),
    ),
  };

  writeFileSync(filePath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  console.log(`Wrote Promptfoo regression baseline to ${filePath}`);
}

function compareAgainstBaseline(
  baseline: BaselineFile,
  currentSuites: Record<string, SuiteMetrics>,
) {
  const failures: string[] = [];
  const tolerance = baseline.passRateTolerance;
  const baselineSuiteIds = Object.keys(baseline.suites).sort();
  const currentSuiteIds = Object.keys(currentSuites).sort();

  for (const suiteId of baselineSuiteIds) {
    if (!currentSuites[suiteId]) {
      failures.push(`Missing current results for suite '${suiteId}'.`);
    }
  }
  for (const suiteId of currentSuiteIds) {
    if (!baseline.suites[suiteId]) {
      failures.push(`Current results include unexpected suite '${suiteId}' not present in baseline.`);
    }
  }

  for (const suiteId of baselineSuiteIds) {
    const expected = baseline.suites[suiteId];
    const current = currentSuites[suiteId];
    if (!expected || !current) continue;

    if (current.expectedCases !== expected.expectedCases) {
      failures.push(
        `Suite '${suiteId}' expected ${expected.expectedCases} cases but current results contain ${current.expectedCases}.`,
      );
    }

    const minimumPassRate = roundRate(expected.passRate - tolerance);
    if (current.passRate < minimumPassRate) {
      failures.push(
        `Suite '${suiteId}' regressed from baseline pass rate ${expected.passRate.toFixed(3)} to ${current.passRate.toFixed(3)} (tolerance ${tolerance.toFixed(3)}, minimum allowed ${minimumPassRate.toFixed(3)}).`,
      );
    }
  }

  return failures;
}

function printSuiteTable(suites: Record<string, SuiteMetrics>, baseline?: BaselineFile) {
  console.log("Promptfoo regression summary:");
  for (const [suiteId, metrics] of Object.entries(suites).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const baselineRate = baseline?.suites[suiteId]?.passRate;
    const baselineText =
      baselineRate === undefined ? "n/a" : baselineRate.toFixed(3);
    console.log(
      `- ${suiteId}: ${metrics.passedCases}/${metrics.expectedCases} passed (passRate=${metrics.passRate.toFixed(
        3,
      )}, baseline=${baselineText})`,
    );
  }
}

function main() {
  const { resultsPath, baselinePath, writeBaseline, tolerance } = parseArgs(process.argv.slice(2));
  const resultsFile = readJsonFile<PromptfooResultsFile>(resultsPath);
  const suites = collectSuiteMetrics(resultsFile);

  if (writeBaseline) {
    writeBaselineFile(baselinePath, suites, tolerance);
    printSuiteTable(suites);
    return;
  }

  const baseline = readJsonFile<BaselineFile>(baselinePath);
  printSuiteTable(suites, baseline);

  const failures = compareAgainstBaseline(baseline, suites);
  if (failures.length > 0) {
    console.error("\nPromptfoo regression gate failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nPromptfoo regression gate passed.");
}

main();
