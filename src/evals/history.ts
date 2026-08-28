import type { EvalRun, EvalRunRecord } from "./types";

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
