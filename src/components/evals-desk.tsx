"use client";

import { useEffect, useMemo, useState } from "react";
import { AppFrame, NavLink } from "@/components/app-frame";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import {
  EVAL_HISTORY_LIMIT,
  groupEvalRunsByModel,
  mergeEvalHistory,
  toEvalRunRecord,
  type ModelAgg,
} from "@/evals/history";
import type {
  EvalItemResult,
  EvalRun,
  EvalRunRecord,
  EvalSuiteId,
  EvalSuiteSummary,
} from "@/evals/types";

type CatalogSuite = {
  id: EvalSuiteId;
  name: string;
  description: string;
  kind: string;
  itemCount: number;
  items: Array<{
    id: string;
    title: string;
    prompt: string;
    goldReply: string;
    contract: string;
    requiredTools: string[];
    targetAgent: string;
  }>;
};

type CatalogResponse = {
  model: string;
  suites: CatalogSuite[];
  lastRun: EvalRun | null;
  history: EvalRunRecord[];
};

const HISTORY_KEY = "mets-eval-history";

function money(value: number) {
  if (value < 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(4)}`;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function when(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  window.localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(runs.slice(0, EVAL_HISTORY_LIMIT)),
  );
}

async function readSse(
  response: Response,
  onEvent: (event: string, data: unknown) => void,
) {
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

export function EvalsDesk({ initial }: { initial?: CatalogResponse }) {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(initial ?? null);
  const [selected, setSelected] = useState<EvalSuiteId | "all">("all");
  const [run, setRun] = useState<EvalRun | null>(initial?.lastRun ?? null);
  const [liveItems, setLiveItems] = useState<EvalItemResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [history, setHistory] = useState<EvalRunRecord[]>(() =>
    mergeEvalHistory(initial?.history, initial?.lastRun ? [initial.lastRun] : [], readHistory()),
  );
  const [compareId, setCompareId] = useState<string | null>(() => {
    const merged = mergeEvalHistory(
      initial?.history,
      initial?.lastRun ? [initial.lastRun] : [],
    );
    return merged.find((entry) => entry.id !== initial?.lastRun?.id)?.id ?? null;
  });

  useEffect(() => {
    void fetch("/api/evals")
      .then((response) => response.json())
      .then((payload: CatalogResponse) => {
        setCatalog(payload);
        if (payload.lastRun) setRun(payload.lastRun);
        const next = mergeEvalHistory(
          payload.history,
          payload.lastRun ? [payload.lastRun] : [],
          readHistory(),
        );
        writeHistory(next);
        setHistory(next);
        const previous = next.find((entry) => entry.id !== payload.lastRun?.id);
        if (previous) setCompareId(previous.id);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load eval catalog.");
      });
  }, []);

  const visibleItems = useMemo(() => {
    const items = liveItems.length ? liveItems : (run?.items ?? []);
    if (selected === "all") return items;
    return items.filter((item) => item.suiteId === selected);
  }, [liveItems, run, selected]);

  const totals = useMemo(() => {
    if (liveItems.length) {
      const accuracy =
        liveItems.reduce((sum, item) => sum + item.accuracy, 0) / liveItems.length;
      return {
        itemCount: liveItems.length,
        passed: liveItems.filter((item) => item.passed).length,
        accuracy,
        avgLatencyMs: Math.round(
          liveItems.reduce((sum, item) => sum + item.latencyMs, 0) / liveItems.length,
        ),
        totalCostUsd: liveItems.reduce((sum, item) => sum + item.costUsd, 0),
        totalTokens: liveItems.reduce(
          (sum, item) => sum + item.inputTokens + item.outputTokens,
          0,
        ),
      };
    }
    return run?.totals;
  }, [liveItems, run]);

  const currentModel = run?.model ?? catalog?.model ?? "gpt-4o";
  const compareRun = history.find((entry) => entry.id === compareId) ?? null;
  const modelRows = useMemo(() => groupEvalRunsByModel(history), [history]);

  const startRun = async () => {
    setBusy(true);
    setError(null);
    setLiveItems([]);
    setOpenId(null);
    try {
      const response = await fetch("/api/evals/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected === "all" ? {} : { suiteId: selected }),
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
        if (event === "done") {
          const payload = data as { run: EvalRun };
          setRun(payload.run);
          setLiveItems(payload.run.items);
          const next = mergeEvalHistory([payload.run], readHistory());
          writeHistory(next);
          setHistory(next);
          const previous = next.find((entry) => entry.id !== payload.run.id);
          setCompareId(previous?.id ?? null);
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
    }
  };

  return (
    <AppFrame
      nav={
        <>
          <NavLink href="/">Tutor</NavLink>
          <NavLink href="/evals" active>
            Evals
          </NavLink>
        </>
      }
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ui-label">Evaluation desk</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Agent evals</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--bui-ink-2)]">
              Ten gold-scaffolded items per suite. Live agents are scored for
              accuracy against the scaffold, plus latency and estimated cost.
            </p>
          </div>
          <Chip>Active model · {catalog?.model ?? currentModel}</Chip>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Model" value={currentModel} mono />
          <Metric label="Accuracy" value={totals ? pct(totals.accuracy) : "—"} />
          <Metric
            label="Passed"
            value={totals ? `${totals.passed}/${totals.itemCount}` : "—"}
          />
          <Metric
            label="Avg latency"
            value={totals ? `${totals.avgLatencyMs} ms` : "—"}
          />
          <Metric label="Est. cost" value={totals ? money(totals.totalCostUsd) : "—"} />
          <Metric label="Tokens" value={totals ? String(totals.totalTokens) : "—"} />
        </section>

        {run && history.length > 1 ? (
          <ComparePanel
            current={toEvalRunRecord(run)}
            history={history.filter((entry) => entry.id !== run.id)}
            selectedId={compareId}
            onSelect={setCompareId}
            previous={compareRun}
          />
        ) : null}

        {modelRows.length ? <ModelCompare rows={modelRows} currentModel={currentModel} /> : null}

        <section className="flex flex-wrap items-center gap-3">
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value as EvalSuiteId | "all")}
            className="ui-field ui-select w-auto min-w-52"
            disabled={busy}
          >
            <option value="all">
              All suites ({catalog?.suites.reduce((n, s) => n + s.itemCount, 0) ?? 60})
            </option>
            {catalog?.suites.map((suite) => (
              <option key={suite.id} value={suite.id}>
                {suite.name} ({suite.itemCount})
              </option>
            ))}
          </select>
          <Button type="button" onClick={() => void startRun()} disabled={busy}>
            {busy ? "Running…" : selected === "all" ? "Run all evals" : "Run this suite"}
          </Button>
          {busy ? (
            <p className="text-sm text-[var(--bui-ink-2)]">
              {liveItems.length} item{liveItems.length === 1 ? "" : "s"} scored
            </p>
          ) : null}
        </section>

        {error ? <p className="text-sm text-[var(--bui-red)]">{error}</p> : null}

        <div className="grid gap-3 lg:grid-cols-3">
          {(catalog?.suites ?? []).map((suite) => {
            const summary =
              (liveItems.length ? undefined : run?.suites)?.find(
                (entry) => entry.suiteId === suite.id,
              ) ?? summarizeLive(suite.id, suite.name, liveItems);
            return (
              <article key={suite.id} className="ui-card p-4">
                <p className="ui-label">{suite.kind}</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{suite.name}</h2>
                <p className="mt-2 text-sm leading-5 text-[var(--bui-ink-2)]">
                  {suite.description}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Accuracy" value={summary ? pct(summary.accuracy) : "—"} />
                  <Stat
                    label="p50 latency"
                    value={summary ? `${summary.p50LatencyMs} ms` : "—"}
                  />
                  <Stat label="Cost" value={summary ? money(summary.totalCostUsd) : "—"} />
                  <Stat
                    label="Passed"
                    value={
                      summary
                        ? `${summary.passed}/${summary.itemCount}`
                        : `0/${suite.itemCount}`
                    }
                  />
                </dl>
              </article>
            );
          })}
        </div>

        <section className="ui-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="ui-label">Run history</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">Previous runs by model</h2>
            </div>
            <p className="text-xs text-[var(--bui-ink-3)]">{history.length} saved</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
                <tr className="border-t border-[var(--bui-line)]">
                  <th className="px-4 py-2.5">When</th>
                  <th className="px-4 py-2.5">Model</th>
                  <th className="px-4 py-2.5">Suites</th>
                  <th className="px-4 py-2.5">Accuracy</th>
                  <th className="px-4 py-2.5">Latency</th>
                  <th className="px-4 py-2.5">Cost</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr className="border-t border-[var(--bui-line)]">
                    <td colSpan={6} className="px-4 py-8 text-[var(--bui-ink-2)]">
                      Run evals to start a model history. Each finished run stores the
                      model so later scores can be compared.
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => {
                    const isCurrent = run?.id === entry.id;
                    const isCompare = compareId === entry.id;
                    return (
                      <tr
                        key={entry.id}
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
                              if (!isCurrent) setCompareId(entry.id);
                            }}
                          >
                            {when(entry.finishedAt)}
                            {isCurrent ? (
                              <span className="mt-0.5 block text-xs text-[var(--bui-ink-3)]">
                                current
                              </span>
                            ) : null}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs">{entry.model}</span>
                        </td>
                        <td className="px-4 py-3 text-[var(--bui-ink-2)]">
                          {entry.suiteIds.join(", ")}
                        </td>
                        <td className="px-4 py-3">{pct(entry.totals.accuracy)}</td>
                        <td className="px-4 py-3">{entry.totals.avgLatencyMs} ms</td>
                        <td className="px-4 py-3">{money(entry.totals.totalCostUsd)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ui-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
              <tr>
                <th className="px-4 py-3">Eval</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr className="border-t border-[var(--bui-line)]">
                  <td colSpan={7} className="px-4 py-8 text-[var(--bui-ink-2)]">
                    Run a suite to score the live agents against the gold scaffolds.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <ItemRows
                    key={`${item.itemId}-${item.latencyMs}`}
                    item={item}
                    open={openId === item.itemId}
                    onToggle={() =>
                      setOpenId((current) => (current === item.itemId ? null : item.itemId))
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AppFrame>
  );
}

function Metric({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="ui-card px-4 py-3">
      <p className="ui-label">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tracking-tight", mono && "font-mono text-sm")}>
        {value}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="ui-label">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function ComparePanel({
  current,
  previous,
  history,
  selectedId,
  onSelect,
}: {
  current: EvalRunRecord;
  previous: EvalRunRecord | null;
  history: EvalRunRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rows = previous
    ? [
        {
          label: "Model",
          now: current.model,
          then: previous.model,
        },
        {
          label: "Accuracy",
          now: pct(current.totals.accuracy),
          then: pct(previous.totals.accuracy),
        },
        {
          label: "Avg latency",
          now: `${current.totals.avgLatencyMs} ms`,
          then: `${previous.totals.avgLatencyMs} ms`,
        },
        {
          label: "Cost",
          now: money(current.totals.totalCostUsd),
          then: money(previous.totals.totalCostUsd),
        },
      ]
    : [];

  return (
    <section className="ui-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ui-label">Compare runs</p>
          <p className="mt-1 text-sm text-[var(--bui-ink-2)]">
            Current {current.model}
            {previous ? ` vs ${previous.model}` : ""}
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="ui-label">Previous run</span>
          <select
            value={selectedId ?? ""}
            onChange={(event) => onSelect(event.target.value)}
            className="ui-field ui-select min-w-64"
          >
            {history.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.model} · {pct(entry.totals.accuracy)} · {when(entry.finishedAt)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label} className="ui-inset p-3">
              <p className="ui-label">{row.label}</p>
              <p className="mt-1 text-sm font-medium">{row.now}</p>
              <p className="mt-0.5 text-xs text-[var(--bui-ink-3)]">was {row.then}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ModelCompare({
  rows,
  currentModel,
}: {
  rows: ModelAgg[];
  currentModel: string;
}) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="px-4 py-3">
        <p className="ui-label">Model ledger</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Best score per model</h2>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-[0.6875rem] font-medium tracking-wide text-[var(--bui-ink-3)] uppercase">
          <tr className="border-t border-[var(--bui-line)]">
            <th className="px-4 py-2.5">Model</th>
            <th className="px-4 py-2.5">Runs</th>
            <th className="px-4 py-2.5">Best accuracy</th>
            <th className="px-4 py-2.5">Latest accuracy</th>
            <th className="px-4 py-2.5">Best latency</th>
            <th className="px-4 py-2.5">Last run</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.model}
              className={cn(
                "border-t border-[var(--bui-line)]",
                row.model === currentModel && "bg-[var(--bui-accent-tint)]",
              )}
            >
              <td className="px-4 py-3 font-mono text-xs">{row.model}</td>
              <td className="px-4 py-3">{row.runs}</td>
              <td className="px-4 py-3">{pct(row.bestAccuracy)}</td>
              <td className="px-4 py-3">{pct(row.latestAccuracy)}</td>
              <td className="px-4 py-3">{row.bestLatencyMs} ms</td>
              <td className="px-4 py-3 text-[var(--bui-ink-2)]">{when(row.lastFinishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function summarizeLive(
  suiteId: EvalSuiteId,
  name: string,
  items: EvalItemResult[],
): EvalSuiteSummary | undefined {
  const subset = items.filter((item) => item.suiteId === suiteId);
  if (!subset.length) return undefined;
  const latencies = subset.map((item) => item.latencyMs).sort((a, b) => a - b);
  const accuracy = subset.reduce((sum, item) => sum + item.accuracy, 0) / subset.length;
  return {
    suiteId,
    name,
    itemCount: subset.length,
    passed: subset.filter((item) => item.passed).length,
    accuracy,
    avgLatencyMs: Math.round(
      latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
    ),
    p50LatencyMs: latencies[Math.floor((latencies.length - 1) / 2)] ?? 0,
    totalCostUsd: subset.reduce((sum, item) => sum + item.costUsd, 0),
    totalTokens: subset.reduce((sum, item) => sum + item.inputTokens + item.outputTokens, 0),
  };
}

function ItemRows({
  item,
  open,
  onToggle,
}: {
  item: EvalItemResult;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-t border-[var(--bui-line)]">
        <td className="px-4 py-3">
          <button type="button" onClick={onToggle} className="text-left">
            <span className="ui-label block">{item.suiteId}</span>
            {item.title}
          </button>
        </td>
        <td className="px-4 py-3 font-mono text-xs">{item.model}</td>
        <td className="px-4 py-3">{pct(item.accuracy)}</td>
        <td className="px-4 py-3">{item.latencyMs} ms</td>
        <td className="px-4 py-3">{item.inputTokens + item.outputTokens}</td>
        <td className="px-4 py-3">{money(item.costUsd)}</td>
        <td className="px-4 py-3">
          <Chip
            style={{
              color: item.error
                ? "var(--bui-red)"
                : item.passed
                  ? "var(--bui-green)"
                  : "var(--bui-orange)",
              background: item.error
                ? "var(--bui-red-tint)"
                : item.passed
                  ? "var(--bui-green-tint)"
                  : "var(--bui-orange-tint)",
            }}
          >
            {item.error ? "error" : item.passed ? "pass" : "fail"}
          </Chip>
        </td>
      </tr>
      {open ? (
        <tr className="border-t border-[var(--bui-line)] bg-[var(--bui-inset)]">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="ui-label">Prompt</p>
                <p className="mt-1">{item.prompt}</p>
                <p className="ui-label mt-3">Gold scaffold</p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--bui-ink-2)]">
                  {item.goldReply}
                </p>
              </div>
              <div>
                <p className="ui-label">Live output · {item.model}</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {item.actualText || item.error || "(empty)"}
                </p>
                {item.toolCalls.length ? (
                  <p className="mt-2 text-xs text-[var(--bui-ink-3)]">
                    Tools: {item.toolCalls.join(", ")}
                  </p>
                ) : null}
                <ul className="mt-3 grid gap-1 text-xs text-[var(--bui-ink-2)]">
                  {item.checks.map((check) => (
                    <li key={check.name}>
                      {check.passed ? "pass" : "fail"} · {check.detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
