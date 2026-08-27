/**
 * Sync the TypeScript eval catalog into Langfuse datasets.
 * Usage: npx tsx --tsconfig tsconfig.json langfuse/evals/seed.ts
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EVAL_SUITES } from "../../src/evals/catalog";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

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

loadDotEnv(join(repoRoot, ".env.local"));
loadDotEnv(join(repoRoot, ".env"));
if (!process.env.LANGFUSE_HOST) {
  process.env.LANGFUSE_HOST = process.env.LANGFUSE_BASE_URL;
}
if (!process.env.LANGFUSE_HOST) {
  console.error("Set LANGFUSE_HOST or LANGFUSE_BASE_URL in .env.local.");
  process.exit(1);
}

const publicKey = process.env.LANGFUSE_PUBLIC_KEY ?? "";
const secretKey = process.env.LANGFUSE_SECRET_KEY ?? "";
const host = process.env.LANGFUSE_HOST;

function redact(value: string) {
  return value ? `set (len=${value.length})` : "missing";
}

if (!publicKey || !secretKey) {
  console.error(
    `Missing Langfuse keys. PUBLIC_KEY=${redact(publicKey)} SECRET_KEY=${redact(secretKey)}`,
  );
  process.exit(1);
}

const tmpDir = join(here, ".tmp");
mkdirSync(tmpDir, { recursive: true });

function cli(args: string[], { allowFail = false } = {}) {
  const prefix = [];
  const envFile = join(repoRoot, ".env.local");
  if (existsSync(envFile)) prefix.push("--env", envFile);
  prefix.push("--host", host as string);
  const result = spawnSync("npx", ["--yes", "langfuse-cli", ...prefix, "api", ...args, "--json"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const text = (result.stdout || "").trim();
  let envelope: { status?: number; body?: unknown } | null = null;
  try {
    envelope = text ? (JSON.parse(text) as { status?: number; body?: unknown }) : null;
  } catch {
    envelope = null;
  }
  const status = envelope?.status ?? (result.status === 0 ? 200 : 500);
  const body = envelope && "body" in envelope ? envelope.body : envelope;
  const ok = status >= 200 && status < 300;
  if (!ok && !allowFail) {
    throw new Error(`langfuse-cli ${args.join(" ")} failed (${status}): ${JSON.stringify(body)}`);
  }
  return { ok, status, body };
}

function rowsFrom(body: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(body)) return body as Array<Record<string, unknown>>;
  if (body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data)) {
    return (body as { data: Array<Record<string, unknown>> }).data;
  }
  return [];
}

function writeBody(name: string, body: unknown) {
  const path = join(tmpDir, name);
  writeFileSync(path, JSON.stringify(body, null, 2));
  return path;
}

const scoreConfigs = [
  {
    name: "mets-routing-correct",
    dataType: "BOOLEAN",
    description: "True when router agent/intent/subject match the gold scaffold.",
  },
  {
    name: "mets-grade-band-ok",
    dataType: "BOOLEAN",
    description: "True when the specialist stays inside the requested Singapore band.",
  },
  {
    name: "mets-syllabus-grounded",
    dataType: "BOOLEAN",
    description: "True when syllabus claims come from documentSearch.",
  },
  {
    name: "mets-teaching-quality",
    dataType: "NUMERIC",
    minValue: 1,
    maxValue: 5,
    description: "1-5 tutor quality against the gold scaffold.",
  },
  {
    name: "mets-widget-valid",
    dataType: "BOOLEAN",
    description: "True when Testing called the expected widget tool.",
  },
];

const existingScores = new Set(
  rowsFrom(cli(["score-configs", "list", "--all"]).body)
    .map((row) => row.name)
    .filter((name): name is string => typeof name === "string"),
);

for (const config of scoreConfigs) {
  if (existingScores.has(config.name)) continue;
  cli(["score-configs", "create", "--body-file", writeBody(`score-${config.name}.json`, config)]);
  console.log(`created score config ${config.name}`);
}

for (const suite of EVAL_SUITES) {
  const name = `mets-${suite.id}`;
  const get = cli(["datasets", "get", name], { allowFail: true });
  if (!get.ok) {
    cli([
      "datasets",
      "create",
      "--body-file",
      writeBody(`dataset-${name}.json`, {
        name,
        description: suite.description,
        metadata: { agent: suite.id, kind: suite.kind, product: "mets" },
      }),
    ]);
    console.log(`created dataset ${name}`);
  }
  const existing = rowsFrom(
    cli(["dataset-items", "list", "--dataset-name", name, "--all"]).body,
  );
  const keep = new Set(suite.items.map((item) => `mets-${item.id}`));
  for (const row of existing) {
    const id = typeof row.id === "string" ? row.id : "";
    if (id && !keep.has(id)) {
      cli(["dataset-items", "delete", id], { allowFail: true });
    }
  }
  for (const item of suite.items) {
    cli([
      "dataset-items",
      "create",
      "--body-file",
      writeBody(`item-${item.id}.json`, {
        id: `mets-${item.id}`,
        datasetName: name,
        input: { message: item.prompt, profile: item.profile },
        expectedOutput: item.scaffold,
        metadata: {
          suite: suite.id,
          kind: item.kind,
          title: item.title,
          targetAgent: item.targetAgent,
        },
      }),
    ]);
    console.log(`upserted ${item.id}`);
  }
}

console.log(`Synced ${EVAL_SUITES.reduce((n, suite) => n + suite.items.length, 0)} catalog items.`);
