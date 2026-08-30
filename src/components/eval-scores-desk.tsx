"use client";

import { useEffect, useMemo, useState } from "react";
import { EvalModelPicker } from "@/components/eval-model-picker";
import { Button } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { LoadingState } from "@/components/ui/loading-state";
import { TaskRow } from "@/components/ui/task-row";
import { cn } from "@/lib/cn";
import { DEFAULT_EVAL_MODEL_ID, findEvalModel, resolveEvalModel } from "@/lib/models";
import {
  EVAL_HISTORY_LIMIT,
  flattenSuiteResults,
  groupSuiteResultsByModel,
  mergeEvalHistory,
  resultsForSuite,
  type SuiteModelAgg,
  type SuiteResult,
} from "@/evals/history";
import {
  keepOtherSuites,
  latestSuiteSummaries,
  mergeLiveItems,
  mergeLiveSummaries,
} from "@/evals/merge";
import { summarizeSuiteItems } from "@/evals/metrics";
import {
  EVAL_SUITE_IDS,
  type EvalItemResult,
  type EvalJob,
  type EvalRun,
  type EvalRunRecord,
  type EvalSuiteId,
  type EvalSuiteSummary,
} from "@/evals/types";

type CatalogSuiteView = {
  id: EvalSuiteId;
  name: string;
  kind: string;
  itemCount: number;
};

type CatalogResponse = {
  model: string;
  suites: CatalogSuiteView[];
  lastRun: EvalRun | null;
  history: EvalRunRecord[];
};

const HISTORY_KEY = "mets-eval-history";
const MODEL_KEY = "mets-eval-model";
const SUITE_MODELS_KEY = "mets-eval-suite-models";

type SuiteModels = Record<EvalSuiteId, string>;

function defaultSuiteModels(fallback: string): SuiteModels {
  const model = resolveEvalModel(fallback).id;
  return Object.fromEntries(EVAL_SUITE_IDS.map((id) => [id, model])) as SuiteModels;
}

function readSavedModel(fallback: string) {
  if (typeof window === "undefined") return resolveEvalModel(fallback).id;
  try {
    return resolveEvalModel(window.localStorage.getItem(MODEL_KEY) ?? fallback).id;
  } catch {
    return resolveEvalModel(fallback).id;
  }
}

function readSuiteModels(fallback: string, lastRun?: EvalRun | null): SuiteModels {
  const next = defaultSuiteModels(fallback);
  for (const suite of lastRun?.suites ?? []) {
    const model = suite.model?.split(" + ")[0];
    if (model && findEvalModel(model)) next[suite.suiteId] = model;
  }
  if (typeof window === "undefined") return next;
  try {
    const raw = window.localStorage.getItem(SUITE_MODELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
      for (const id of EVAL_SUITE_IDS) {
        if (typeof parsed[id] === "string") next[id] = resolveEvalModel(parsed[id]).id;
      }
      return next;
    }
    const legacy = window.localStorage.getItem(MODEL_KEY);
    if (legacy) return defaultSuiteModels(legacy);
  } catch {
    return next;
  }
  return next;
}

function writeSuiteModels(models: SuiteModels) {
  window.localStorage.setItem(SUITE_MODELS_KEY, JSON.stringify(models));
}

function money(value: number) {
  if (value < 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(4)}`;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function summarizeCombined(items: EvalItemResult[]) {
  if (!items.length) return null;
  const accuracy = items.reduce((sum, item) => sum + item.accuracy, 0) / items.length;
  return {
    itemCount: items.length,
    passed: items.filter((item) => item.passed).length,
    accuracy,
    avgLatencyMs: Math.round(
      items.reduce((sum, item) => sum + item.latencyMs, 0) / items.length,
    ),
    totalCostUsd: items.reduce((sum, item) => sum + item.costUsd, 0),
    totalTokens: items.reduce((sum, item) => sum + item.inputTokens + item.outputTokens, 0),
  };
}

function summarizeFromSuites(suites: EvalSuiteSummary[]) {
  const scored = suites.filter((suite) => suite.itemCount > 0);
  if (!scored.length) return null;
  const itemCount = scored.reduce((sum, suite) => sum + suite.itemCount, 0);
  return {
    itemCount,
    passed: scored.reduce((sum, suite) => sum + suite.passed, 0),
    accuracy: scored.reduce((sum, suite) => sum + suite.accuracy * suite.itemCount, 0) / itemCount,
    avgLatencyMs: Math.round(
      scored.reduce((sum, suite) => sum + suite.avgLatencyMs * suite.itemCount, 0) / itemCount,
    ),
    totalCostUsd: scored.reduce((sum, suite) => sum + suite.totalCostUsd, 0),
    totalTokens: scored.reduce((sum, suite) => sum + suite.totalTokens, 0),
  };
}

function mergeCombined(
  left: ReturnType<typeof summarizeCombined>,
  right: ReturnType<typeof summarizeCombined>,
) {
  if (!left) return right;
  if (!right) return left;
  const itemCount = left.itemCount + right.itemCount;
  return {
    itemCount,
    passed: left.passed + right.passed,
    accuracy: (left.accuracy * left.itemCount + right.accuracy * right.itemCount) / itemCount,
    avgLatencyMs: Math.round(
      (left.avgLatencyMs * left.itemCount + right.avgLatencyMs * right.itemCount) / itemCount,
    ),
    totalCostUsd: left.totalCostUsd + right.totalCostUsd,
    totalTokens: left.totalTokens + right.totalTokens,
  };
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function When({ iso }: { iso: string }) {
  const [label, setLabel] = useState(iso.slice(0, 16).replace("T", " "));
  useEffect(() => {
    setLabel(formatWhen(iso));
  }, [iso]);
  return <span>{label}</span>;
}

function readHistory(): EvalRunRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? mergeEvalHistory(JSON.parse(raw) as EvalRunRecord[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(runs: EvalRunRecord[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(runs.slice(0, EVAL_HISTORY_LIMIT)));
}

async function readSse(response: Response, onEvent: (event: string, data: unknown) => void) {
  if (!response.body) throw new Error("No response body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const event = chunk.match(/^event: (.+)$/m)?.[1];
      const dataLine = chunk.match(/^data: ([\s\S]+)$/m)?.[1];
      if (!event || !dataLine) continue;
      onEvent(event, JSON.parse(dataLine));
    }
  }
}

export function EvalScoresDesk({ initial }: { initial?: CatalogResponse }) {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(initial ?? null);
  const [run, setRun] = useState<EvalRun | null>(initial?.lastRun ?? null);
  const [liveItems, setLiveItems] = useState<EvalItemResult[]>(initial?.lastRun?.items ?? []);
  const [suiteSummaries, setSuiteSummaries] = useState<EvalSuiteSummary[]>(() =>
    latestSuiteSummaries(initial?.history ?? [], initial?.lastRun),
  );
  const [busy, setBusy] = useState(false);
  const [runningSuiteIds, setRunningSuiteIds] = useState<EvalSuiteId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EvalRunRecord[]>(() =>
    mergeEvalHistory(initial?.history, initial?.lastRun ? [initial.lastRun] : []),
  );
  const [focusSuite, setFocusSuite] = useState<EvalSuiteId | "all">("all");
  const [compareBySuite, setCompareBySuite] = useState<Partial<Record<EvalSuiteId, string>>>({});
  const [suiteModels, setSuiteModels] = useState<SuiteModels>(() =>
    defaultSuiteModels(initial?.model ?? DEFAULT_EVAL_MODEL_ID),
  );

  useEffect(() => {
    setSuiteModels(
      readSuiteModels(readSavedModel(initial?.model ?? DEFAULT_EVAL_MODEL_ID), initial?.lastRun),
    );
  }, [initial?.lastRun, initial?.model]);

  useEffect(() => {
    void fetch("/api/evals")
      .then((response) => response.json())
      .then((payload: CatalogResponse) => {
        setCatalog(payload);
        if (payload.lastRun) {
          setRun(payload.lastRun);
          setLiveItems(payload.lastRun.items ?? []);
        }
        const next = mergeEvalHistory(
          payload.history,
          payload.lastRun ? [payload.lastRun] : [],
          readHistory(),
        );
        writeHistory(next);
        setHistory(next);
        setSuiteSummaries(latestSuiteSummaries(next, payload.lastRun));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load scores.");
      });
  }, []);

  const perSuite = useMemo(() => {
    return (catalog?.suites ?? []).map((suite) => {
      const locked = suiteSummaries.find((entry) => entry.suiteId === suite.id);
      if (locked) return locked;
      return summarizeSuiteItems(suite.id, suite.name, liveItems);
    });
  }, [catalog, liveItems, suiteSummaries]);

  const combined = useMemo(() => {
    const lockedIds = new Set(suiteSummaries.map((suite) => suite.suiteId));
    const pending = liveItems.filter((item) => !lockedIds.has(item.suiteId));
    return (
      mergeCombined(summarizeFromSuites(suiteSummaries), summarizeCombined(pending)) ??
      run?.totals ??
      null
    );
  }, [liveItems, run, suiteSummaries]);

  const suiteResults = useMemo(() => flattenSuiteResults(history), [history]);
  const visibleResults = useMemo(
    () => (focusSuite === "all" ? suiteResults : resultsForSuite(suiteResults, focusSuite)),
    [focusSuite, suiteResults],
  );
  const modelRows = useMemo(() => groupSuiteResultsByModel(visibleResults), [visibleResults]);
  const latestBySuite = useMemo(() => {
    const latest = new Map<EvalSuiteId, SuiteResult>();
    for (const row of suiteResults) {
      if (!latest.has(row.suiteId)) latest.set(row.suiteId, row);
    }
    return latest;
  }, [suiteResults]);

  const setSuiteModel = (suiteId: EvalSuiteId, model: string) => {
    setSuiteModels((current) => {
      const next = { ...current, [suiteId]: resolveEvalModel(model).id };
      writeSuiteModels(next);
      return next;
    });
  };

  const jobsFor = (suiteIds: EvalSuiteId[]): EvalJob[] =>
    suiteIds.map((suiteId) => ({
      suiteId,
      model: resolveEvalModel(suiteModels[suiteId]).id,
    }));

  const startRun = async (suiteIds: EvalSuiteId[]) => {
    const jobs = jobsFor(suiteIds);
    setBusy(true);
    setRunningSuiteIds(suiteIds);
    setError(null);
    setLiveItems((current) => {
      const base = current.length ? current : (run?.items ?? []);
      return keepOtherSuites(base, suiteIds);
    });
    setSuiteSummaries((current) => keepOtherSuites(current, suiteIds));
    try {
      const response = await fetch("/api/evals/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || `Run failed (${response.status})`);
      }
      await readSse(response, (event, data) => {
        if (event === "item") {
          const payload = data as { result: EvalItemResult };
          setLiveItems((current) => [...current, payload.result]);
        }
        if (event === "suite") {
          const payload = data as { summary: EvalSuiteSummary };
          setSuiteSummaries((current) => [
            ...current.filter((entry) => entry.suiteId !== payload.summary.suiteId),
            payload.summary,
          ]);
        }
        if (event === "done") {
          const payload = data as { run: EvalRun };
          setRun(payload.run);
          setLiveItems((current) => mergeLiveItems(current, payload.run.items, payload.run.suiteIds));
          setSuiteSummaries((current) =>
            mergeLiveSummaries(current, payload.run.suites, payload.run.suiteIds),
          );
          const next = mergeEvalHistory([payload.run], readHistory());
          writeHistory(next);
          setHistory(next);
        }
        if (event === "error") {
          const payload = data as { error?: string };
          setError(payload.error || "Eval run failed.");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eval run failed.");
    } finally {
      setBusy(false);
      setRunningSuiteIds([]);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="ui-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
          <div>
            <p className="ui-label">Per-suite scores</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Accuracy, latency, and cost by eval
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--bui-ink-2)]">
              Pick a model on each eval, then run that row. Run all uses each row&apos;s model.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => void startRun([...EVAL_SUITE_IDS])}
            disabled={busy}
          >
            {busy && runningSuiteIds.length > 1
              ? "Running all evals…"
              : "Run all evals"}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
              <tr className="border-t border-[var(--bui-line)]">
                <th className="px-4 py-2.5">Eval</th>
                <th className="px-4 py-2.5">Accuracy</th>
                <th className="px-4 py-2.5">Passed</th>
                <th className="px-4 py-2.5">Avg latency</th>
                <th className="px-4 py-2.5">p50 latency</th>
                <th className="px-4 py-2.5">Cost</th>
                <th className="px-4 py-2.5">Tokens</th>
                <th className="px-4 py-2.5">Model</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {perSuite.map((summary) => {
                const meta = catalog?.suites.find((suite) => suite.id === summary.suiteId);
                const empty = summary.itemCount === 0;
                const running = runningSuiteIds.includes(summary.suiteId);
                const scoredModel = summary.model;
                return (
                  <tr key={summary.suiteId} className="border-t border-[var(--bui-line)]">
                    <td className="px-4 py-3">
                      <span className="ui-label block">{meta?.kind ?? summary.suiteId}</span>
                      {summary.name}
                      {scoredModel && !empty ? (
                        <span className="mt-0.5 block font-mono text-[0.6875rem] text-[var(--bui-ink-3)]">
                          scored with {scoredModel}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{empty ? "—" : pct(summary.accuracy)}</td>
                    <td className="px-4 py-3">
                      {empty ? `0/${meta?.itemCount ?? 10}` : `${summary.passed}/${summary.itemCount}`}
                    </td>
                    <td className="px-4 py-3">{empty ? "—" : `${summary.avgLatencyMs} ms`}</td>
                    <td className="px-4 py-3">{empty ? "—" : `${summary.p50LatencyMs} ms`}</td>
                    <td className="px-4 py-3">{empty ? "—" : money(summary.totalCostUsd)}</td>
                    <td className="px-4 py-3">{empty ? "—" : String(summary.totalTokens)}</td>
                    <td className="px-4 py-3">
                      <EvalModelPicker
                        compact
                        value={suiteModels[summary.suiteId] ?? DEFAULT_EVAL_MODEL_ID}
                        disabled={busy}
                        aria-label={`Model for ${summary.name}`}
                        onChange={(id) => setSuiteModel(summary.suiteId, id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void startRun([summary.suiteId])}
                      >
                        {running ? "Running…" : "Run"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {combined ? (
                <tr className="border-t border-[var(--bui-line)] bg-[var(--bui-inset)]">
                  <td className="px-4 py-3 text-[var(--bui-ink-2)]">
                    Combined across suites
                    <span className="mt-0.5 block text-xs text-[var(--bui-ink-3)]">
                      Sum of cost and tokens. Accuracy and latency are item averages.
                    </span>
                  </td>
                  <td className="px-4 py-3">{pct(combined.accuracy)}</td>
                  <td className="px-4 py-3">
                    {combined.passed}/{combined.itemCount}
                  </td>
                  <td className="px-4 py-3">{combined.avgLatencyMs} ms</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">{money(combined.totalCostUsd)}</td>
                  <td className="px-4 py-3">{combined.totalTokens}</td>
                  <td className="px-4 py-3 text-xs text-[var(--bui-ink-3)]">
                    Each eval uses its own model
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {busy ? (
        <section className="ui-card px-4 py-3">
          <LoadingState
            label={
              runningSuiteIds.length === 1
                ? `Scoring ${runningSuiteIds[0]} with ${suiteModels[runningSuiteIds[0]!] ?? "the selected model"}`
                : "Scoring selected evals"
            }
          />
          <div className="mt-3 grid gap-0.5">
            {runningSuiteIds.map((suiteId) => {
              const scored = liveItems.filter((item) => item.suiteId === suiteId).length;
              const done = suiteSummaries.some((suite) => suite.suiteId === suiteId);
              const name = catalog?.suites.find((suite) => suite.id === suiteId)?.name ?? suiteId;
              return (
                <TaskRow
                  key={suiteId}
                  title={name}
                  status={done ? "done" : scored ? "running" : "pending"}
                  detail={done ? "done" : `${scored} item${scored === 1 ? "" : "s"}`}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {error ? <p className="text-sm text-[var(--bui-red)]">{error}</p> : null}

      {suiteResults.length ? (
        <AgentFilter
          suites={catalog?.suites ?? []}
          value={focusSuite}
          onChange={setFocusSuite}
        />
      ) : null}

      {latestBySuite.size ? (
        <ComparePanel
          suites={catalog?.suites ?? []}
          focusSuite={focusSuite}
          results={suiteResults}
          latestBySuite={latestBySuite}
          compareBySuite={compareBySuite}
          onCompare={(suiteId, runId) => {
            setFocusSuite(suiteId);
            setCompareBySuite((current) => ({ ...current, [suiteId]: runId }));
          }}
        />
      ) : null}

      {modelRows.length ? (
        <ModelCompare rows={modelRows} latestBySuite={latestBySuite} />
      ) : null}

      <section className="ui-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="ui-label">Run history</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Previous runs</h2>
            <p className="mt-1 text-sm text-[var(--bui-ink-2)]">
              One row per agent. Click a row to compare it with that agent&apos;s latest.
            </p>
          </div>
          <p className="text-xs text-[var(--bui-ink-3)]">{visibleResults.length} saved</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
              <tr className="border-t border-[var(--bui-line)]">
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Agent</th>
                <th className="px-4 py-2.5">Model</th>
                <th className="px-4 py-2.5">Accuracy</th>
                <th className="px-4 py-2.5">Passed</th>
                <th className="px-4 py-2.5">Avg latency</th>
                <th className="px-4 py-2.5">Cost</th>
              </tr>
            </thead>
            <tbody>
              {visibleResults.length === 0 ? (
                <tr className="border-t border-[var(--bui-line)]">
                  <td colSpan={7} className="px-4 py-8 text-[var(--bui-ink-2)]">
                    Run an eval to start a history. Each agent keeps its own model
                    and score so later runs can be compared.
                  </td>
                </tr>
              ) : (
                visibleResults.map((entry) => {
                  const latest = latestBySuite.get(entry.suiteId);
                  const isCurrent = latest?.runId === entry.runId;
                  const isCompare = compareBySuite[entry.suiteId] === entry.runId;
                  return (
                    <tr
                      key={`${entry.runId}-${entry.suiteId}`}
                      className={cn(
                        "border-t border-[var(--bui-line)]",
                        isCurrent && "bg-[var(--bui-accent-tint)]",
                        !isCurrent && isCompare && "bg-[var(--bui-field)]",
                      )}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => {
                            if (isCurrent) return;
                            setFocusSuite(entry.suiteId);
                            setCompareBySuite((current) => ({
                              ...current,
                              [entry.suiteId]: entry.runId,
                            }));
                          }}
                        >
                          <When iso={entry.finishedAt} />
                          {isCurrent ? (
                            <span className="mt-0.5 block text-xs text-[var(--bui-ink-3)]">
                              latest for {entry.name}
                            </span>
                          ) : null}
                        </button>
                      </td>
                      <td className="px-4 py-3">{entry.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{entry.model}</span>
                      </td>
                      <td className="px-4 py-3">{pct(entry.accuracy)}</td>
                      <td className="px-4 py-3">
                        {entry.passed}/{entry.itemCount}
                      </td>
                      <td className="px-4 py-3">{entry.avgLatencyMs} ms</td>
                      <td className="px-4 py-3">{money(entry.totalCostUsd)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AgentFilter({
  suites,
  value,
  onChange,
}: {
  suites: CatalogSuiteView[];
  value: EvalSuiteId | "all";
  onChange: (id: EvalSuiteId | "all") => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="ui-label">History by agent</p>
        <p className="mt-1 text-sm text-[var(--bui-ink-2)]">
          Compare, best model, and previous runs stay scoped to the selected agent.
        </p>
      </div>
      <FilterChips
        value={value}
        onChange={onChange}
        options={[
          { id: "all", label: "All agents" },
          ...suites.map((suite) => ({ id: suite.id, label: suite.name })),
        ]}
      />
    </div>
  );
}

function previousFor(
  results: SuiteResult[],
  suiteId: EvalSuiteId,
  latest: SuiteResult | undefined,
  selectedId?: string,
) {
  const own = resultsForSuite(results, suiteId);
  if (selectedId) {
    const picked = own.find((row) => row.runId === selectedId && row.runId !== latest?.runId);
    if (picked) return picked;
  }
  return own.find((row) => row.runId !== latest?.runId) ?? null;
}

function ComparePanel({
  suites,
  focusSuite,
  results,
  latestBySuite,
  compareBySuite,
  onCompare,
}: {
  suites: CatalogSuiteView[];
  focusSuite: EvalSuiteId | "all";
  results: SuiteResult[];
  latestBySuite: Map<EvalSuiteId, SuiteResult>;
  compareBySuite: Partial<Record<EvalSuiteId, string>>;
  onCompare: (suiteId: EvalSuiteId, runId: string) => void;
}) {
  const rows = (focusSuite === "all" ? suites : suites.filter((suite) => suite.id === focusSuite))
    .map((suite) => {
      const latest = latestBySuite.get(suite.id);
      const previous = previousFor(results, suite.id, latest, compareBySuite[suite.id]);
      return { suite, latest, previous };
    })
    .filter((row) => row.latest);

  if (!rows.length) return null;

  const focused = focusSuite === "all" ? null : rows[0];
  const previousChoices = focused
    ? resultsForSuite(results, focused.suite.id).filter(
        (row) => row.runId !== focused.latest?.runId,
      )
    : [];

  return (
    <section className="ui-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ui-label">Compare runs</p>
          <p className="mt-1 text-sm text-[var(--bui-ink-2)]">
            Latest score for each agent versus an earlier run of the same agent.
          </p>
        </div>
        {focused && previousChoices.length ? (
          <label className="grid gap-1 text-sm">
            <span className="ui-label">Previous {focused.suite.name} run</span>
            <select
              value={focused.previous?.runId ?? ""}
              onChange={(event) => onCompare(focused.suite.id, event.target.value)}
              className="ui-field ui-select min-w-64"
            >
              {previousChoices.map((entry) => (
                <option key={entry.runId} value={entry.runId}>
                  {entry.model} · {pct(entry.accuracy)} ·{" "}
                  {entry.finishedAt.slice(0, 16).replace("T", " ")}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
            <tr className="border-t border-[var(--bui-line)]">
              <th className="py-2.5 pr-4">Agent</th>
              <th className="py-2.5 pr-4">Latest model</th>
              <th className="py-2.5 pr-4">Accuracy</th>
              <th className="py-2.5 pr-4">Avg latency</th>
              <th className="py-2.5">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ suite, latest, previous }) => (
              <tr key={suite.id} className="border-t border-[var(--bui-line)]">
                <td className="py-2.5 pr-4">{latest?.name ?? suite.name}</td>
                <td className="py-2.5 pr-4">
                  <span className="font-mono text-xs">{latest?.model ?? "—"}</span>
                  {previous ? (
                    <span className="mt-0.5 block font-mono text-[0.6875rem] text-[var(--bui-ink-3)]">
                      was {previous.model}
                    </span>
                  ) : null}
                </td>
                <td className="py-2.5 pr-4">
                  {latest ? pct(latest.accuracy) : "—"}
                  <span className="ml-2 text-xs text-[var(--bui-ink-3)]">
                    was {previous ? pct(previous.accuracy) : "—"}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  {latest ? `${latest.avgLatencyMs} ms` : "—"}
                  <span className="ml-2 text-xs text-[var(--bui-ink-3)]">
                    was {previous ? `${previous.avgLatencyMs} ms` : "—"}
                  </span>
                </td>
                <td className="py-2.5">
                  {latest ? money(latest.totalCostUsd) : "—"}
                  <span className="ml-2 text-xs text-[var(--bui-ink-3)]">
                    was {previous ? money(previous.totalCostUsd) : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ModelCompare({
  rows,
  latestBySuite,
}: {
  rows: SuiteModelAgg[];
  latestBySuite: Map<EvalSuiteId, SuiteResult>;
}) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="px-4 py-3">
        <p className="ui-label">Model ledger</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Best score per model</h2>
        <p className="mt-1 text-sm text-[var(--bui-ink-2)]">
          Best and latest accuracy for each model on each agent.
        </p>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
          <tr className="border-t border-[var(--bui-line)]">
            <th className="px-4 py-2.5">Agent</th>
            <th className="px-4 py-2.5">Model</th>
            <th className="px-4 py-2.5">Runs</th>
            <th className="px-4 py-2.5">Best accuracy</th>
            <th className="px-4 py-2.5">Latest accuracy</th>
            <th className="px-4 py-2.5">Best latency</th>
            <th className="px-4 py-2.5">Last run</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const latest = latestBySuite.get(row.suiteId);
            const isCurrent = latest?.model === row.model;
            return (
              <tr
                key={`${row.suiteId}-${row.model}`}
                className={cn(
                  "border-t border-[var(--bui-line)]",
                  isCurrent && "bg-[var(--bui-accent-tint)]",
                )}
              >
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.model}</td>
                <td className="px-4 py-3">{row.runs}</td>
                <td className="px-4 py-3">{pct(row.bestAccuracy)}</td>
                <td className="px-4 py-3">{pct(row.latestAccuracy)}</td>
                <td className="px-4 py-3">{row.bestLatencyMs} ms</td>
                <td className="px-4 py-3 text-[var(--bui-ink-2)]">
                  <When iso={row.lastFinishedAt} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
