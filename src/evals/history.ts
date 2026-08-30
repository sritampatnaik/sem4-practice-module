import type { EvalRun, EvalRunRecord, EvalSuiteId } from "./types";

export const EVAL_HISTORY_LIMIT = 30;

export function toEvalRunRecord(run: EvalRun | EvalRunRecord): EvalRunRecord {
  return {
    id: run.id,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    model: run.model,
    suiteIds: run.suiteIds,
    suites: run.suites,
    totals: run.totals,
  };
}

export function mergeEvalHistory(
  ...lists: Array<Array<EvalRun | EvalRunRecord> | undefined>
): EvalRunRecord[] {
  const byId = new Map<string, EvalRunRecord>();
  for (const list of lists) {
    for (const run of list ?? []) {
      if (!run?.id || !run.model || !run.totals) continue;
      if (!byId.has(run.id)) byId.set(run.id, toEvalRunRecord(run));
    }
  }
  return [...byId.values()]
    .sort((a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt))
    .slice(0, EVAL_HISTORY_LIMIT);
}

export type ModelAgg = {
  model: string;
  runs: number;
  bestAccuracy: number;
  latestAccuracy: number;
  bestLatencyMs: number;
  lastFinishedAt: string;
};

export function groupEvalRunsByModel(history: EvalRunRecord[]): ModelAgg[] {
  const groups = new Map<string, EvalRunRecord[]>();
  for (const run of history) {
    const list = groups.get(run.model) ?? [];
    list.push(run);
    groups.set(run.model, list);
  }
  return [...groups.entries()]
    .map(([model, runs]) => {
      const sorted = [...runs].sort(
        (a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt),
      );
      const latest = sorted[0];
      return {
        model,
        runs: runs.length,
        bestAccuracy: Math.max(...runs.map((entry) => entry.totals.accuracy)),
        latestAccuracy: latest?.totals.accuracy ?? 0,
        bestLatencyMs: Math.min(...runs.map((entry) => entry.totals.avgLatencyMs)),
        lastFinishedAt: latest?.finishedAt ?? "",
      };
    })
    .sort((a, b) => b.bestAccuracy - a.bestAccuracy);
}

/** One scored agent from one run. Newest first. */
export type SuiteResult = {
  runId: string;
  finishedAt: string;
  suiteId: EvalSuiteId;
  name: string;
  model: string;
  accuracy: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  totalCostUsd: number;
  totalTokens: number;
  passed: number;
  itemCount: number;
};

export function flattenSuiteResults(history: EvalRunRecord[]): SuiteResult[] {
  const rows: SuiteResult[] = [];
  for (const run of history) {
    for (const suite of run.suites ?? []) {
      if (!suite.itemCount) continue;
      const model = suite.model && !suite.model.includes(" + ") ? suite.model : run.model;
      rows.push({
        runId: run.id,
        finishedAt: run.finishedAt,
        suiteId: suite.suiteId,
        name: suite.name,
        model,
        accuracy: suite.accuracy,
        avgLatencyMs: suite.avgLatencyMs,
        p50LatencyMs: suite.p50LatencyMs,
        totalCostUsd: suite.totalCostUsd,
        totalTokens: suite.totalTokens,
        passed: suite.passed,
        itemCount: suite.itemCount,
      });
    }
  }
  return rows.sort((a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt));
}

export type SuiteModelAgg = ModelAgg & {
  suiteId: EvalSuiteId;
  name: string;
};

export function groupSuiteResultsByModel(results: SuiteResult[]): SuiteModelAgg[] {
  const groups = new Map<string, SuiteResult[]>();
  for (const row of results) {
    const key = `${row.suiteId}::${row.model}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.values()]
    .map((rows) => {
      const sorted = [...rows].sort(
        (a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt),
      );
      const latest = sorted[0]!;
      return {
        suiteId: latest.suiteId,
        name: latest.name,
        model: latest.model,
        runs: rows.length,
        bestAccuracy: Math.max(...rows.map((entry) => entry.accuracy)),
        latestAccuracy: latest.accuracy,
        bestLatencyMs: Math.min(...rows.map((entry) => entry.avgLatencyMs)),
        lastFinishedAt: latest.finishedAt,
      };
    })
    .sort((a, b) => a.suiteId.localeCompare(b.suiteId) || b.bestAccuracy - a.bestAccuracy);
}

export function resultsForSuite(results: SuiteResult[], suiteId: EvalSuiteId) {
  return results.filter((row) => row.suiteId === suiteId);
}
