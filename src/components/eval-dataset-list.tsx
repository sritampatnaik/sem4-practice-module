"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { blankDataset, parseDatasetJson, prettyDataset } from "@/evals/dataset-item";
import type { CatalogItemDraft, DatasetItemJson, EvalItemResult, EvalSuiteId } from "@/evals/types";

export type CatalogSuiteView = {
  id: EvalSuiteId;
  name: string;
  description: string;
  kind: string;
  itemCount: number;
  items: CatalogItemDraft[];
};

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function itemDataset(item: CatalogItemDraft): DatasetItemJson {
  if (item.dataset) return item.dataset;
  return parseDatasetJson({
    input: {
      message: item.prompt,
      profile: item.profile ?? {
        name: "Alex",
        notes: [],
        diagnostic: {},
        gradeLevel: item.gradeLevel,
      },
    },
    output: {
      must: [...item.requiredTools, ...item.mustInclude],
      mustNot: item.mustNotInclude,
      agent: item.routing?.agent ?? item.targetAgent,
      intent: item.routing?.intent ?? (item.kind === "testing" ? "testing" : "teaching"),
      subject:
        item.routing?.subject ??
        (item.targetAgent === "math" ||
        item.targetAgent === "physics" ||
        item.targetAgent === "chemistry"
          ? item.targetAgent
          : "none"),
      gradeLevel: item.routing?.gradeLevel ?? item.gradeLevel,
    },
    metadata: {
      band: item.gradeLevel,
      agent: item.targetAgent,
      source: item.source ?? "custom",
      title: item.title,
      contract: item.contract,
      goldReply: item.goldReply,
    },
  });
}

export function EvalDatasetList({
  suites,
  selected,
  onSelect,
  results,
  busy,
  onSuitesChange,
  onError,
}: {
  suites: CatalogSuiteView[];
  selected: EvalSuiteId | "all";
  onSelect: (value: EvalSuiteId | "all") => void;
  results: EvalItemResult[];
  busy: boolean;
  onSuitesChange: (suites: CatalogSuiteView[]) => void;
  onError: (message: string | null) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addSuite, setAddSuite] = useState<EvalSuiteId>("physics");

  const items = useMemo(() => {
    const all = suites.flatMap((suite) => suite.items);
    if (selected === "all") return all;
    return all.filter((item) => item.suiteId === selected);
  }, [selected, suites]);

  const resultById = useMemo(() => {
    const map = new Map<string, EvalItemResult>();
    for (const result of results) map.set(result.itemId, result);
    return map;
  }, [results]);

  const openItem = (item: CatalogItemDraft) => {
    setOpenId(item.id);
    setJsonError(null);
    setJsonText(prettyDataset(itemDataset(item)));
  };

  const closeItem = () => {
    setOpenId(null);
    setJsonText("");
    setJsonError(null);
  };

  const saveItem = async (item: CatalogItemDraft) => {
    setSaving(true);
    onError(null);
    setJsonError(null);
    try {
      const dataset = parseDatasetJson(JSON.parse(jsonText) as unknown);
      const response = await fetch("/api/evals/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, suiteId: item.suiteId, ...dataset }),
      });
      const payload = (await response.json()) as {
        error?: string;
        suites?: CatalogSuiteView[];
      };
      if (!response.ok) throw new Error(payload.error || "Could not save eval.");
      if (payload.suites) onSuitesChange(payload.suites);
      closeItem();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save eval.";
      setJsonError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  const addItem = async () => {
    const suiteId = selected === "all" ? addSuite : selected;
    setSaving(true);
    onError(null);
    try {
      const response = await fetch("/api/evals/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiteId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        item?: CatalogItemDraft;
        suites?: CatalogSuiteView[];
      };
      if (!response.ok) throw new Error(payload.error || "Could not add eval.");
      if (payload.suites) onSuitesChange(payload.suites);
      if (payload.item) {
        const suite = (payload.suites ?? suites).find((entry) => entry.id === suiteId);
        const dataset = payload.item.dataset ?? blankDataset(suiteId, (suite?.kind as CatalogItemDraft["kind"]) ?? "teaching");
        setOpenId(payload.item.id);
        setJsonText(prettyDataset(dataset));
        setJsonError(null);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not add eval.");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!window.confirm("Remove this eval from the suite?")) return;
    setSaving(true);
    onError(null);
    try {
      const response = await fetch(`/api/evals/items?id=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        error?: string;
        suites?: CatalogSuiteView[];
      };
      if (!response.ok) throw new Error(payload.error || "Could not delete eval.");
      if (payload.suites) onSuitesChange(payload.suites);
      if (openId === itemId) closeItem();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not delete eval.");
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = async () => {
    if (!window.confirm("Restore the built-in eval list and discard local edits?")) return;
    setSaving(true);
    onError(null);
    try {
      const response = await fetch("/api/evals/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const payload = (await response.json()) as {
        error?: string;
        suites?: CatalogSuiteView[];
      };
      if (!response.ok) throw new Error(payload.error || "Could not restore evals.");
      if (payload.suites) onSuitesChange(payload.suites);
      closeItem();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not restore evals.");
    } finally {
      setSaving(false);
    }
  };

  const formatJson = () => {
    try {
      setJsonText(prettyDataset(parseDatasetJson(JSON.parse(jsonText) as unknown)));
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON.");
    }
  };

  const locked = busy || saving;

  return (
    <section className="ui-card overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
        <div>
          <p className="ui-label">Dataset</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{items.length} evals</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selected}
            onChange={(event) => onSelect(event.target.value as EvalSuiteId | "all")}
            className="ui-field ui-select w-auto min-w-44"
          >
            <option value="all">
              All suites ({suites.reduce((count, suite) => count + suite.itemCount, 0)})
            </option>
            {suites.map((suite) => (
              <option key={suite.id} value={suite.id}>
                {suite.name} ({suite.itemCount})
              </option>
            ))}
          </select>
          {selected === "all" ? (
            <select
              value={addSuite}
              onChange={(event) => setAddSuite(event.target.value as EvalSuiteId)}
              className="ui-field ui-select w-auto min-w-36"
              disabled={locked}
            >
              {suites.map((suite) => (
                <option key={suite.id} value={suite.id}>
                  Add to {suite.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => void addItem()} disabled={locked}>
            Add eval
          </Button>
          <Button type="button" variant="ghost" onClick={() => void restoreDefaults()} disabled={locked}>
            Restore defaults
          </Button>
        </div>
      </div>
      <ul>
        {items.length === 0 ? (
          <li className="border-t border-[var(--bui-line)] px-4 py-8 text-sm text-[var(--bui-ink-2)]">
            No evals in this suite yet. Add one, then edit the input / output / metadata JSON.
          </li>
        ) : (
          items.map((item) => {
            const result = resultById.get(item.id);
            const open = openId === item.id;
            const suiteName = suites.find((suite) => suite.id === item.suiteId)?.name ?? item.suiteId;
            const dataset = itemDataset(item);
            return (
              <li key={item.id} className="border-t border-[var(--bui-line)]">
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => (open ? closeItem() : openItem(item))}
                  >
                    <span className="ui-label block">{suiteName}</span>
                    <span className="mt-0.5 block font-medium">{item.title}</span>
                    <span className="mt-1 block text-sm text-[var(--bui-ink-2)]">
                      {dataset.input.message || "No student prompt yet."}
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    {result ? (
                      <Chip
                        style={{
                          color: result.error
                            ? "var(--bui-red)"
                            : result.passed
                              ? "var(--bui-green)"
                              : "var(--bui-orange)",
                          background: result.error
                            ? "var(--bui-red-tint)"
                            : result.passed
                              ? "var(--bui-green-tint)"
                              : "var(--bui-orange-tint)",
                        }}
                      >
                        {result.error ? "error" : `${pct(result.accuracy)} · ${result.passed ? "pass" : "fail"}`}
                      </Chip>
                    ) : (
                      <Chip>not run</Chip>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => (open ? closeItem() : openItem(item))}
                    >
                      {open ? "Close" : "Edit"}
                    </Button>
                  </div>
                </div>
                {open ? (
                  <div className="border-t border-[var(--bui-line)] bg-[var(--bui-inset)] px-4 py-4">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="ui-label">JSON editor</p>
                        <p className="mt-1 text-sm text-[var(--bui-ink-2)]">
                          input.message + profile, output.must / mustNot / labels, metadata.band / agent / source
                        </p>
                      </div>
                      <Button type="button" variant="secondary" onClick={formatJson} disabled={locked}>
                        Format
                      </Button>
                    </div>
                    <textarea
                      className="ui-field ui-json mt-3"
                      spellCheck={false}
                      value={jsonText}
                      disabled={locked}
                      aria-label="Eval JSON"
                      onChange={(event) => {
                        setJsonText(event.target.value);
                        setJsonError(null);
                      }}
                    />
                    {jsonError ? (
                      <p className="mt-2 text-sm text-[var(--bui-red)]">{jsonError}</p>
                    ) : null}
                    {result ? (
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <div>
                          <p className="ui-label">Last live output · {result.model}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">
                            {result.actualText || result.error || "(empty)"}
                          </p>
                        </div>
                        <div>
                          <p className="ui-label">
                            {pct(result.accuracy)} · {result.latencyMs} ms · {result.inputTokens + result.outputTokens} tokens
                          </p>
                          <ul className="mt-2 grid gap-1 text-xs text-[var(--bui-ink-2)]">
                            {result.checks.map((check) => (
                              <li key={check.name}>
                                {check.passed ? "pass" : "fail"} · {check.detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" onClick={() => void saveItem(item)} disabled={locked}>
                        {locked ? "Saving…" : "Save eval"}
                      </Button>
                      <Button type="button" variant="secondary" onClick={closeItem} disabled={locked}>
                        Cancel
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => void deleteItem(item.id)} disabled={locked}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
