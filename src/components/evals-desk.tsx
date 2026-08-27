"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EvalItemResult, EvalRun, EvalSuiteId, EvalSuiteSummary } from "@/evals/types";

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
};

const HISTORY_KEY = "mets-eval-history";

function money(value: number) {
  if (value < 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(4)}`;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function readHistory(): EvalRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as EvalRun[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(runs: EvalRun[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(runs.slice(0, 5)));
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

export function EvalsDesk() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [selected, setSelected] = useState<EvalSuiteId | "all">("all");
  const [run, setRun] = useState<EvalRun | null>(null);
  const [liveItems, setLiveItems] = useState<EvalItemResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [history, setHistory] = useState<EvalRun[]>([]);

  useEffect(() => {
    setHistory(readHistory());
    void fetch("/api/evals")
      .then((response) => response.json())
      .then((payload: CatalogResponse) => {
        setCatalog(payload);
        if (payload.lastRun) setRun(payload.lastRun);
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

  const startRun = async () => {
    setBusy(true);
    setError(null);
    setLiveItems([]);
    setOpenId(null);
    try {
      const response = await fetch("/api/evals/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selected === "all" ? {} : { suiteId: selected },
        ),
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
          const next = [payload.run, ...readHistory()].slice(0, 5);
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
    }
  };

  const previous = history[1];

  return (
    <div className="min-h-screen bg-[var(--desk)] text-[oklch(0.93_0.02_85)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.65rem] tracking-[0.28em] uppercase text-[oklch(0.78_0.05_75)]">
              METS · evaluation desk
            </p>
            <h1
              className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl"
              style={{ fontVariationSettings: '"SOFT" 40, "WONK" 1' }}
            >
              Agent evals
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[oklch(0.82_0.03_85)]">
              Ten gold-scaffolded items per suite. Live agents are scored for
              accuracy against the scaffold, plus latency and estimated cost.
              Model: {catalog?.model ?? "gpt-4o"}.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs tracking-[0.16em] uppercase text-[oklch(0.78_0.04_75)]"
          >
            Back to tutor desk
          </Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
          <Metric
            label="Tokens"
            value={totals ? String(totals.totalTokens) : "—"}
          />
        </section>

        {previous && run ? (
          <CompareStrip current={run} previous={previous} />
        ) : null}

        <section className="flex flex-wrap items-center gap-3">
          <select
            value={selected}
            onChange={(event) =>
              setSelected(event.target.value as EvalSuiteId | "all")
            }
            className="border border-[oklch(0.45_0.03_55)] bg-[oklch(0.27_0.035_55)] px-3 py-2 text-sm"
            disabled={busy}
          >
            <option value="all">All suites ({catalog?.suites.reduce((n, s) => n + s.itemCount, 0) ?? 60})</option>
            {catalog?.suites.map((suite) => (
              <option key={suite.id} value={suite.id}>
                {suite.name} ({suite.itemCount})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void startRun()}
            disabled={busy}
            className="border border-[oklch(0.93_0.02_85)] bg-[oklch(0.93_0.02_85)] px-4 py-2 text-sm text-[var(--desk)] disabled:opacity-40"
          >
            {busy ? "Running…" : selected === "all" ? "Run all evals" : "Run this suite"}
          </button>
          {busy ? (
            <p className="text-sm text-[oklch(0.8_0.03_85)]">
              {liveItems.length} item{liveItems.length === 1 ? "" : "s"} scored
            </p>
          ) : null}
        </section>

        {error ? <p className="text-sm text-[oklch(0.78_0.12_25)]">{error}</p> : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {(catalog?.suites ?? []).map((suite) => {
            const summary = (liveItems.length ? undefined : run?.suites)?.find(
              (entry) => entry.suiteId === suite.id,
            ) ?? summarizeLive(suite.id, suite.name, liveItems);
            return (
              <article
                key={suite.id}
                className="border border-[oklch(0.4_0.03_55)] bg-[oklch(0.27_0.035_55)] p-4"
              >
                <p className="text-[0.65rem] tracking-[0.18em] uppercase text-[oklch(0.75_0.03_85)]">
                  {suite.kind}
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl">
                  {suite.name}
                </h2>
                <p className="mt-2 text-sm leading-5 text-[oklch(0.8_0.03_85)]">
                  {suite.description}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-[oklch(0.7_0.03_85)]">
                      Accuracy
                    </dt>
                    <dd>{summary ? pct(summary.accuracy) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-[oklch(0.7_0.03_85)]">
                      p50 latency
                    </dt>
                    <dd>{summary ? `${summary.p50LatencyMs} ms` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-[oklch(0.7_0.03_85)]">
                      Cost
                    </dt>
                    <dd>{summary ? money(summary.totalCostUsd) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-[oklch(0.7_0.03_85)]">
                      Passed
                    </dt>
                    <dd>
                      {summary ? `${summary.passed}/${summary.itemCount}` : `0/${suite.itemCount}`}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>

        <section className="border border-[oklch(0.4_0.03_55)] bg-[oklch(0.26_0.03_55)]">
          <table className="w-full text-left text-sm">
            <thead className="text-[0.65rem] uppercase tracking-[0.16em] text-[oklch(0.75_0.03_85)]">
              <tr>
                <th className="px-4 py-3">Eval</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-[oklch(0.78_0.03_85)]">
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
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[oklch(0.4_0.03_55)] bg-[oklch(0.27_0.035_55)] px-4 py-3">
      <p className="text-[0.65rem] tracking-[0.16em] uppercase text-[oklch(0.75_0.03_85)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl">{value}</p>
    </div>
  );
}

function CompareStrip({ current, previous }: { current: EvalRun; previous: EvalRun }) {
  const rows = [
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
  ];
  return (
    <section className="border border-[oklch(0.4_0.03_55)] bg-[oklch(0.25_0.03_55)] p-4">
      <p className="text-[0.65rem] tracking-[0.18em] uppercase text-[oklch(0.75_0.03_85)]">
        Compare with previous run ({previous.model})
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-[oklch(0.7_0.03_85)]">
              {row.label}
            </p>
            <p className="mt-1">
              {row.now}{" "}
              <span className="text-[oklch(0.7_0.03_85)]">was {row.then}</span>
            </p>
          </div>
        ))}
      </div>
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
      <tr className="border-t border-[oklch(0.35_0.03_55)]">
        <td className="px-4 py-3">
          <button type="button" onClick={onToggle} className="text-left">
            <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-[oklch(0.7_0.03_85)]">
              {item.suiteId}
            </span>
            {item.title}
          </button>
        </td>
        <td className="px-4 py-3">{pct(item.accuracy)}</td>
        <td className="px-4 py-3">{item.latencyMs} ms</td>
        <td className="px-4 py-3">{item.inputTokens + item.outputTokens}</td>
        <td className="px-4 py-3">{money(item.costUsd)}</td>
        <td className="px-4 py-3">
          {item.error ? "error" : item.passed ? "pass" : "fail"}
        </td>
      </tr>
      {open ? (
        <tr className="border-t border-[oklch(0.35_0.03_55)] bg-[oklch(0.23_0.03_55)]">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[oklch(0.75_0.03_85)]">
                  Prompt
                </p>
                <p className="mt-1 text-[oklch(0.9_0.02_85)]">{item.prompt}</p>
                <p className="mt-3 text-[0.65rem] uppercase tracking-[0.16em] text-[oklch(0.75_0.03_85)]">
                  Gold scaffold
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[oklch(0.84_0.03_85)]">
                  {item.goldReply}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[oklch(0.75_0.03_85)]">
                  Live output
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[oklch(0.9_0.02_85)]">
                  {item.actualText || item.error || "(empty)"}
                </p>
                {item.toolCalls.length ? (
                  <p className="mt-2 text-xs text-[oklch(0.78_0.03_85)]">
                    Tools: {item.toolCalls.join(", ")}
                  </p>
                ) : null}
                <ul className="mt-3 grid gap-1 text-xs text-[oklch(0.8_0.03_85)]">
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
