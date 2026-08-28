import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { EVAL_HISTORY_LIMIT, toEvalRunRecord } from "./history";
import type { EvalRun, EvalRunRecord } from "./types";

const LOG_DIR = path.join(process.cwd(), "logs");
const HISTORY_FILE = path.join(LOG_DIR, "eval-history.json");

let history: EvalRun[] = loadHistory();

export function refreshEvalHistory() {
  history = loadHistory();
  return history;
}

export { toEvalRunRecord } from "./history";

function isEvalRun(value: unknown): value is EvalRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<EvalRun>;
  return Boolean(
    run.id &&
      run.model &&
      run.startedAt &&
      run.totals &&
      Array.isArray(run.suiteIds) &&
      Array.isArray(run.suites),
  );
}

function loadHistory(): EvalRun[] {
  try {
    if (!existsSync(HISTORY_FILE)) return [];
    const parsed = JSON.parse(readFileSync(HISTORY_FILE, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEvalRun).slice(0, EVAL_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function persistHistory(runs: EvalRun[]) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    writeFileSync(HISTORY_FILE, JSON.stringify(runs, null, 2), "utf8");
  } catch {
    // Local logs are optional; the in-memory list still serves this process.
  }
}

export function saveEvalRun(run: EvalRun) {
  history = [run, ...history.filter((item) => item.id !== run.id)].slice(0, EVAL_HISTORY_LIMIT);
  persistHistory(history);
  return history[0] ?? run;
}

export function getLastEvalRun() {
  return history[0] ?? null;
}

export function listEvalRuns() {
  return history;
}

export function listEvalRunRecords(): EvalRunRecord[] {
  return history.map(toEvalRunRecord);
}

export function getEvalRun(id: string) {
  return history.find((run) => run.id === id) ?? null;
}
