import { mergeEvalHistory } from "./history";
import type { EvalItemResult, EvalRun, EvalRunRecord, EvalSuiteId, EvalSuiteSummary } from "./types";

export function keepOtherSuites<T extends { suiteId: EvalSuiteId }>(
  previous: T[],
  suiteIds: EvalSuiteId[],
): T[] {
  const replace = new Set(suiteIds);
  return previous.filter((row) => !replace.has(row.suiteId));
}

export function mergeSuiteRows<T extends { suiteId: EvalSuiteId }>(
  previous: T[],
  incoming: T[],
  suiteIds: EvalSuiteId[],
): T[] {
  return [...keepOtherSuites(previous, suiteIds), ...incoming];
}

export function mergeLiveItems(
  previous: EvalItemResult[],
  incoming: EvalItemResult[],
  suiteIds: EvalSuiteId[],
): EvalItemResult[] {
  return mergeSuiteRows(previous, incoming, suiteIds);
}

export function mergeLiveSummaries(
  previous: EvalSuiteSummary[],
  incoming: EvalSuiteSummary[],
  suiteIds: EvalSuiteId[],
): EvalSuiteSummary[] {
  return mergeSuiteRows(previous, incoming, suiteIds);
}

/** Latest scored summary for each suite across history. Newer runs win. */
export function latestSuiteSummaries(
  history: EvalRunRecord[] = [],
  lastRun?: EvalRun | EvalRunRecord | null,
): EvalSuiteSummary[] {
  const bySuite = new Map<EvalSuiteId, EvalSuiteSummary>();
  const runs = [...mergeEvalHistory(history, lastRun ? [lastRun] : [])].sort(
    (a, b) => Date.parse(a.finishedAt) - Date.parse(b.finishedAt),
  );
  for (const entry of runs) {
    for (const suite of entry.suites ?? []) {
      if (suite.itemCount > 0) bySuite.set(suite.suiteId, suite);
    }
  }
  return [...bySuite.values()];
}
