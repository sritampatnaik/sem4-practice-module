/**
 * Compare Jev vs OpenAI models on the routing gold labels only.
 * Usage: npx tsx --tsconfig tsconfig.json langfuse/evals/compare-routing.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { routeStudentTurn } from "../../src/agents/orchestration/router";
import { routingItems } from "../../src/evals/catalog/routing";
import { scoreAgainstScaffold } from "../../src/evals/score";
import { runWithModel } from "../../src/lib/llm";
import { sanitizeStudentMessage } from "../../src/lib/guardrails";

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

const here = dirname(fileURLToPath(import.meta.url));
loadDotEnv(join(here, "..", "..", ".env.local"));
loadDotEnv(join(here, "..", "..", ".env"));

const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"] as const;
const CONCURRENCY = 3;

type Row = {
  id: string;
  title: string;
  passed: boolean;
  accuracy: number;
  latencyMs: number;
  agent: string;
  intent: string;
  subject: string;
  expected: string;
  source: string;
  checks: string[];
};

async function mapPool<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current] as T);
    }
  });
  await Promise.all(workers);
  return results;
}

function classifySource(rationale: string) {
  if (rationale.startsWith("Jev ")) return "jev";
  if (rationale.includes("Fallback keyword")) return "keyword";
  return "llm";
}

async function runOne(item: (typeof routingItems)[number]) {
  const { text } = sanitizeStudentMessage(item.prompt);
  const started = Date.now();
  const routing = await routeStudentTurn({
    ctx: { sessionId: `compare-${item.id}`, profile: item.profile, recentChats: [] },
    messages: [{ role: "user", parts: [{ type: "text", text }] }],
  });
  const actual = {
    agent: routing.agent,
    intent: routing.intent,
    subject: routing.subject,
    gradeLevel: routing.gradeLevel,
    rationale: routing.rationale,
  };
  const scored = scoreAgainstScaffold({
    item,
    actualText: JSON.stringify(routing),
    toolCalls: [],
    actualRouting: actual,
  });
  return {
    id: item.id,
    title: item.title,
    passed: scored.passed,
    accuracy: scored.accuracy,
    latencyMs: Date.now() - started,
    agent: actual.agent,
    intent: actual.intent,
    subject: actual.subject,
    expected: `${item.scaffold.routing?.agent}/${item.scaffold.routing?.intent}/${item.scaffold.routing?.subject}`,
    source: classifySource(routing.rationale),
    checks: scored.checks.filter((check) => !check.passed).map((check) => check.detail),
  } satisfies Row;
}

function summarize(label: string, rows: Row[]) {
  const latencies = [...rows.map((row) => row.latencyMs)].sort((a, b) => a - b);
  const accuracy = rows.reduce((sum, row) => sum + row.accuracy, 0) / rows.length;
  const sources = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.source] = (acc[row.source] ?? 0) + 1;
    return acc;
  }, {});
  return {
    label,
    passed: rows.filter((row) => row.passed).length,
    itemCount: rows.length,
    accuracy: Number(accuracy.toFixed(3)),
    avgLatencyMs: Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length),
    p50LatencyMs: latencies[Math.floor((latencies.length - 1) * 0.5)] ?? 0,
    sources,
    fails: rows
      .filter((row) => !row.passed)
      .map((row) => ({
        id: row.id,
        title: row.title,
        expected: row.expected,
        got: `${row.agent}/${row.intent}/${row.subject}`,
        checks: row.checks,
      })),
  };
}

async function runClassifier(label: string, modelId: string, useJev: boolean) {
  const previous = process.env.TYPESAFE_API_KEY;
  if (!useJev) delete process.env.TYPESAFE_API_KEY;
  else if (previous) process.env.TYPESAFE_API_KEY = previous;
  console.log(`\n=== ${label} ===`);
  try {
    const rows = await runWithModel(modelId, () => mapPool(routingItems, CONCURRENCY, runOne));
    const summary = summarize(label, rows);
    console.log(
      `${summary.passed}/${summary.itemCount}  acc=${summary.accuracy}  p50=${summary.p50LatencyMs}ms  avg=${summary.avgLatencyMs}ms  source=${JSON.stringify(summary.sources)}`,
    );
    for (const fail of summary.fails) {
      console.log(`  FAIL  ${fail.title}  expected ${fail.expected}  got ${fail.got}`);
    }
    return summary;
  } finally {
    if (previous === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = previous;
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  if (!process.env.TYPESAFE_API_KEY) {
    throw new Error("TYPESAFE_API_KEY is missing; cannot compare Jev.");
  }

  const summaries = [
    await runClassifier("jev-1.13.0", "gpt-4o", true),
    ...await (async () => {
      const next = [];
      for (const model of OPENAI_MODELS) {
        next.push(await runClassifier(model, model, false));
      }
      return next;
    })(),
  ];

  const reportPath = join(here, "compare-routing-report.json");
  writeFileSync(reportPath, JSON.stringify({ at: new Date().toISOString(), summaries }, null, 2));
  console.log("\nComparison");
  for (const summary of summaries) {
    console.log(
      `${summary.label.padEnd(14)}  ${String(summary.passed).padStart(3)}/${summary.itemCount}  acc=${summary.accuracy.toFixed(3)}  p50=${String(summary.p50LatencyMs).padStart(5)}ms  fails=${summary.fails.length}`,
    );
  }
  console.log(`\nWrote ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
