import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import {
  defaultEvaluators,
  missingJudgeSuites,
  parseEvaluator,
  type Evaluator,
} from "./evaluator-types";

export {
  DEFAULT_LLM_PROMPT,
  defaultEvaluators,
  parseEvaluator,
  EVALUATOR_KINDS,
} from "./evaluator-types";
export type { Evaluator, EvaluatorKind } from "./evaluator-types";

const LOG_DIR = path.join(process.cwd(), "logs");
const FILE = path.join(LOG_DIR, "eval-evaluators.json");

let evaluators = loadEvaluators();

function mergeWithDefaults(rows: Evaluator[]): Evaluator[] {
  const defaults = defaultEvaluators();
  const custom = rows.filter((row) => !row.builtin && !defaults.some((item) => item.id === row.id));
  return [
    ...defaults.map((item) => {
      const saved = rows.find((row) => row.id === item.id);
      if (!saved) return item;
      return {
        ...item,
        enabled: saved.enabled,
        config: { ...item.config, ...saved.config },
        suiteIds: saved.suiteIds.length ? saved.suiteIds : item.suiteIds,
      };
    }),
    ...custom.map((row) => ({ ...row, builtin: false })),
  ];
}

function parseRows(value: unknown): Evaluator[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    try {
      return [parseEvaluator(row)];
    } catch {
      return [];
    }
  });
}

function loadEvaluators(): Evaluator[] {
  try {
    if (!existsSync(FILE)) return defaultEvaluators();
    return mergeWithDefaults(parseRows(JSON.parse(readFileSync(FILE, "utf8"))));
  } catch {
    return defaultEvaluators();
  }
}

function persistToFile() {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(evaluators, null, 2), "utf8");
  } catch {
    // Local logs are optional.
  }
}

async function persist() {
  persistToFile();
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const payload = {
    evaluators: evaluators as unknown as Json,
    updated_at: new Date().toISOString(),
  };
  try {
    const { data } = await supabase
      .from("eval_catalog_edits")
      .select("id")
      .eq("id", "default")
      .maybeSingle();
    if (data) {
      await supabase.from("eval_catalog_edits").update(payload).eq("id", "default");
      return;
    }
    await supabase.from("eval_catalog_edits").insert({ id: "default", ...payload });
  } catch {
    // File persist is enough if the column is missing.
  }
}

function seededNewDefaults(previous: Evaluator[], merged: Evaluator[]) {
  return merged.some((item) => item.builtin && !previous.some((row) => row.id === item.id));
}

export async function refreshEvaluators() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("eval_catalog_edits")
      .select("evaluators")
      .eq("id", "default")
      .maybeSingle();
    if (!error && data && Array.isArray(data.evaluators)) {
      const previous = parseRows(data.evaluators);
      evaluators = mergeWithDefaults(previous);
      if (seededNewDefaults(previous, evaluators)) await persist();
      else persistToFile();
      return listEvaluators();
    }
  }
  let raw: Evaluator[] = [];
  try {
    if (existsSync(FILE)) raw = parseRows(JSON.parse(readFileSync(FILE, "utf8")));
  } catch {
    raw = [];
  }
  evaluators = mergeWithDefaults(raw);
  if (seededNewDefaults(raw, evaluators)) await persist();
  else persistToFile();
  return listEvaluators();
}

export function listEvaluators() {
  return evaluators.map((item) => structuredClone(item));
}

export function listEnabledEvaluators() {
  const enabled = listEvaluators().filter((item) => item.enabled);
  return enabled.length ? enabled : defaultEvaluators().filter((item) => item.kind === "code");
}

export async function saveEvaluators(next: Evaluator[]) {
  if (!Array.isArray(next) || next.length === 0) {
    throw new Error("At least one evaluator is required.");
  }
  const cleaned = mergeWithDefaults(next.map(parseEvaluator));
  if (!cleaned.some((item) => item.enabled)) {
    throw new Error("Enable at least one evaluator.");
  }
  const missing = missingJudgeSuites(cleaned);
  if (missing.length) {
    throw new Error(`Add an LLM judge for ${missing.join(", ")}.`);
  }
  evaluators = cleaned;
  await persist();
  return listEvaluators();
}

export async function upsertEvaluator(value: unknown) {
  const parsed = parseEvaluator(value);
  const current = listEvaluators();
  const index = current.findIndex((item) => item.id === parsed.id);
  if (index >= 0) {
    const existing = current[index];
    current[index] = {
      ...existing,
      ...parsed,
      builtin: existing.builtin,
      kind: existing.builtin ? existing.kind : parsed.kind,
    };
  } else {
    current.push({ ...parsed, builtin: false });
  }
  return saveEvaluators(current);
}

export async function removeEvaluator(id: string) {
  const current = listEvaluators();
  const existing = current.find((item) => item.id === id);
  if (!existing) throw new Error(`Unknown evaluator '${id}'.`);
  if (existing.builtin) throw new Error("Built-in evaluators cannot be deleted.");
  return saveEvaluators(current.filter((item) => item.id !== id));
}
