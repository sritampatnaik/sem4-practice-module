#!/usr/bin/env node
/**
 * Seed METS eval skeleton into Langfuse (score configs, datasets, items, example judges).
 *
 * Reads LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, and LANGFUSE_HOST (or LANGFUSE_BASE_URL)
 * from the environment or from .env.local / .env. Never prints secret values.
 *
 * Usage: node langfuse/evals/seed.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");
const seedPath = join(here, "seed.json");

function loadDotEnv(path) {
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

loadDotEnv(join(repoRoot, ".env.local"));
loadDotEnv(join(repoRoot, ".env"));

if (!process.env.LANGFUSE_HOST && process.env.LANGFUSE_BASE_URL) {
  process.env.LANGFUSE_HOST = process.env.LANGFUSE_BASE_URL;
}
if (!process.env.LANGFUSE_HOST) {
  process.env.LANGFUSE_HOST = "https://us.cloud.langfuse.com";
}

const publicKey = process.env.LANGFUSE_PUBLIC_KEY ?? "";
const secretKey = process.env.LANGFUSE_SECRET_KEY ?? "";
const host = process.env.LANGFUSE_HOST;

function redact(value) {
  if (!value) return "missing";
  return `set (len=${value.length})`;
}

if (!publicKey || !secretKey) {
  console.error(
    [
      "Missing Langfuse keys. Set these in .env.local (do not paste them into chat):",
      "  LANGFUSE_PUBLIC_KEY=pk-lf-...",
      "  LANGFUSE_SECRET_KEY=sk-lf-...",
      "  LANGFUSE_HOST=https://us.cloud.langfuse.com",
      "",
      `Current: PUBLIC_KEY=${redact(publicKey)} SECRET_KEY=${redact(secretKey)} HOST=${host}`,
    ].join("\n"),
  );
  process.exit(1);
}

console.log(
  `Langfuse host: ${host}\nLANGFUSE_PUBLIC_KEY: ${redact(publicKey)}\nLANGFUSE_SECRET_KEY: ${redact(secretKey)}`,
);

const seed = JSON.parse(readFileSync(seedPath, "utf8"));
const tmpDir = join(here, ".tmp");
mkdirSync(tmpDir, { recursive: true });

function cli(args, { allowFail = false } = {}) {
  const result = spawnSync("npx", ["--yes", "langfuse-cli", "api", ...args, "--json"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0 && !allowFail) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(`langfuse-cli ${args.join(" ")} failed:\n${err}`);
  }
  const text = (result.stdout || "").trim();
  if (!text) return { ok: result.status === 0, data: null, raw: result.stderr || "" };
  try {
    return { ok: result.status === 0, data: JSON.parse(text), raw: text };
  } catch {
    return { ok: result.status === 0, data: text, raw: text };
  }
}

function unwrap(payload) {
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

function writeBody(name, body) {
  const path = join(tmpDir, name);
  writeFileSync(path, JSON.stringify(body, null, 2));
  return path;
}

function listNames(resource, nameKey = "name") {
  const { data } = cli([resource, "list", "--all"]);
  const list = unwrap(data);
  const rows = Array.isArray(list) ? list : list?.data ?? list?.configs ?? [];
  return new Set(
    (Array.isArray(rows) ? rows : [])
      .map((row) => row?.[nameKey])
      .filter((name) => typeof name === "string"),
  );
}

const created = {
  scoreConfigs: [],
  datasets: [],
  datasetItems: [],
  evaluators: [],
  skipped: [],
};

const existingScores = listNames("score-configs");
for (const config of seed.scoreConfigs) {
  if (existingScores.has(config.name)) {
    created.skipped.push(`score-config ${config.name}`);
    continue;
  }
  const body = {
    name: config.name,
    dataType: config.dataType,
    description: config.description,
  };
  if (config.minValue != null) body.minValue = config.minValue;
  if (config.maxValue != null) body.maxValue = config.maxValue;
  cli(["score-configs", "create", "--body-file", writeBody(`score-${config.name}.json`, body)]);
  created.scoreConfigs.push(config.name);
  console.log(`created score config ${config.name}`);
}

for (const dataset of seed.datasets) {
  const get = cli(["datasets", "get", dataset.name], { allowFail: true });
  if (get.ok) {
    created.skipped.push(`dataset ${dataset.name}`);
  } else {
    cli([
      "datasets",
      "create",
      "--body-file",
      writeBody(`dataset-${dataset.name}.json`, {
        name: dataset.name,
        description: dataset.description,
        metadata: dataset.metadata,
      }),
    ]);
    created.datasets.push(dataset.name);
    console.log(`created dataset ${dataset.name}`);
  }
}

for (const item of seed.datasetItems) {
  cli([
    "dataset-items",
    "create",
    "--body-file",
    writeBody(`item-${item.id}.json`, {
      id: item.id,
      datasetName: item.datasetName,
      input: item.input,
      expectedOutput: item.expectedOutput,
      metadata: item.metadata,
    }),
  ]);
  created.datasetItems.push(item.id);
  console.log(`upserted dataset item ${item.id}`);
}

const existingEvaluators = listNames("unstable-evaluators");
for (const evaluator of seed.evaluators) {
  if (existingEvaluators.has(evaluator.name)) {
    created.skipped.push(`evaluator ${evaluator.name}`);
    continue;
  }
  cli([
    "unstable-evaluators",
    "create",
    "--body-file",
    writeBody(`eval-${evaluator.name}.json`, evaluator),
  ]);
  created.evaluators.push(evaluator.name);
  console.log(`created evaluator ${evaluator.name}`);
}

function summarizeList(resource, extra = []) {
  const { data } = cli([resource, "list", "--all", ...extra]);
  const list = unwrap(data);
  const rows = Array.isArray(list) ? list : list?.data ?? list?.configs ?? [];
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: row.id,
    name: row.name,
    dataType: row.dataType ?? row.outputDefinition?.dataType,
  }));
}

const verification = {
  host,
  scoreConfigs: summarizeList("score-configs").filter((row) =>
    String(row.name || "").startsWith("mets-"),
  ),
  datasets: summarizeList("datasets").filter((row) => String(row.name || "").startsWith("mets-")),
  evaluators: summarizeList("unstable-evaluators").filter((row) =>
    String(row.name || "").startsWith("mets-"),
  ),
  datasetItems: {},
};

for (const dataset of seed.datasets) {
  const { data } = cli([
    "dataset-items",
    "list",
    "--dataset-name",
    dataset.name,
    "--all",
  ]);
  const list = unwrap(data);
  const rows = Array.isArray(list) ? list : list?.data ?? [];
  verification.datasetItems[dataset.name] = (Array.isArray(rows) ? rows : []).map((row) => row.id);
}

const reportPath = join(here, "seed-report.json");
writeFileSync(
  reportPath,
  JSON.stringify({ created, skipped: created.skipped, verification }, null, 2),
);
console.log(`\nWrote ${reportPath}`);
console.log(JSON.stringify({ created, verification }, null, 2));
