"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  DEFAULT_LLM_PROMPT,
  EVAL_SUITE_LABELS,
  missingJudgeSuites,
  type Evaluator,
  type EvaluatorKind,
} from "@/evals/evaluator-types";
import { EVAL_SUITE_IDS, type EvalSuiteId } from "@/evals/types";

function suiteLabel(ids: EvalSuiteId[] | undefined) {
  if (!ids?.length) return "All agents";
  return ids.map((id) => EVAL_SUITE_LABELS[id]).join(", ");
}

export function EvalEvaluatorsDesk({ initial }: { initial?: Evaluator[] }) {
  const [evaluators, setEvaluators] = useState<Evaluator[]>(initial ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [addSuite, setAddSuite] = useState<EvalSuiteId>("math");

  useEffect(() => {
    void fetch("/api/evals/evaluators")
      .then((response) => response.json())
      .then((payload: { evaluators?: Evaluator[] }) => {
        if (payload.evaluators) setEvaluators(payload.evaluators);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load evaluators.");
      });
  }, []);

  const persist = async (next: Evaluator[]) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/evals/evaluators", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluators: next }),
      });
      const payload = (await response.json()) as { error?: string; evaluators?: Evaluator[] };
      if (!response.ok) throw new Error(payload.error || "Could not save evaluators.");
      if (payload.evaluators) setEvaluators(payload.evaluators);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save evaluators.");
    } finally {
      setSaving(false);
    }
  };

  const patch = (id: string, partial: Partial<Evaluator>) => {
    const next = evaluators.map((item) =>
      item.id === id
        ? { ...item, ...partial, config: { ...item.config, ...partial.config } }
        : item,
    );
    setEvaluators(next);
    void persist(next);
  };

  const addEvaluator = (kind: EvaluatorKind) => {
    const id = `${kind}-${Date.now().toString(36)}`;
    const next: Evaluator = {
      id,
      kind,
      name:
        kind === "llm"
          ? `${EVAL_SUITE_LABELS[addSuite]} judge`
          : `${EVAL_SUITE_LABELS[addSuite]} code checks`,
      description:
        kind === "llm"
          ? `LLM-as-judge for the ${EVAL_SUITE_LABELS[addSuite]} agent only.`
          : `Phrase, tool, and routing checks for ${EVAL_SUITE_LABELS[addSuite]} only.`,
      enabled: true,
      builtin: false,
      suiteIds: [addSuite],
      config: {
        passThreshold: 0.7,
        prompt: kind === "llm" ? DEFAULT_LLM_PROMPT : undefined,
      },
    };
    const list = [...evaluators, next];
    setEvaluators(list);
    setOpenId(id);
    void persist(list);
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this evaluator?")) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/evals/evaluators?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string; evaluators?: Evaluator[] };
      if (!response.ok) throw new Error(payload.error || "Could not delete evaluator.");
      if (payload.evaluators) setEvaluators(payload.evaluators);
      if (openId === id) setOpenId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete evaluator.");
    } finally {
      setSaving(false);
    }
  };

  const groups = useMemo(() => {
    const shared = evaluators.filter((item) => !item.suiteIds?.length);
    return [
      { id: "all" as const, name: "All agents", items: shared },
      ...EVAL_SUITE_IDS.map((suiteId) => ({
        id: suiteId,
        name: EVAL_SUITE_LABELS[suiteId],
        items: evaluators.filter((item) => item.suiteIds?.includes(suiteId)),
      })),
    ];
  }, [evaluators]);

  const missing = missingJudgeSuites(evaluators);

  return (
    <div className="grid gap-4">
      <section className="ui-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
          <div>
            <p className="ui-label">How a reply is scored</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Evaluators</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--bui-ink-2)]">
              Each agent has its own LLM judge. Code scaffold still runs on every
              suite. A turn passes only if every enabled evaluator for that agent
              passes.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm">
              <span className="ui-label">Agent</span>
              <select
                className="ui-field ui-select min-w-40"
                value={addSuite}
                onChange={(event) => setAddSuite(event.target.value as EvalSuiteId)}
              >
                {EVAL_SUITE_IDS.map((suiteId) => (
                  <option key={suiteId} value={suiteId}>
                    {EVAL_SUITE_LABELS[suiteId]}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="secondary" onClick={() => addEvaluator("llm")} disabled={saving}>
              Add LLM judge
            </Button>
            <Button type="button" variant="ghost" onClick={() => addEvaluator("code")} disabled={saving}>
              Add code evaluator
            </Button>
          </div>
        </div>
        {error ? <p className="px-4 pb-3 text-sm text-[var(--bui-red)]">{error}</p> : null}
        {missing.length ? (
          <p className="px-4 pb-3 text-sm text-[var(--bui-red)]">
            Missing a judge for {missing.map((id) => EVAL_SUITE_LABELS[id]).join(", ")}.
          </p>
        ) : null}
        {groups.map((group) => (
          <div key={group.id} className="border-t border-[var(--bui-line)]">
            <div className="flex items-center justify-between gap-3 px-4 py-2">
              <p className="ui-label">{group.name}</p>
              {group.id !== "all" && !group.items.some((item) => item.kind === "llm") ? (
                <p className="text-xs text-[var(--bui-red)]">No judge yet</p>
              ) : null}
            </div>
            {group.items.length === 0 ? (
              <p className="px-4 pb-3 text-sm text-[var(--bui-ink-3)]">None for this agent.</p>
            ) : (
              <ul>
                {group.items.map((item) => {
                  const open = openId === item.id;
                  return (
                    <li key={`${group.id}-${item.id}`} className="border-t border-[var(--bui-line)]">
                      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setOpenId(open ? null : item.id)}
                        >
                          <span className="ui-label block">
                            {item.kind === "llm" ? "LLM as a judge" : "Code"}
                            {" · "}
                            {suiteLabel(item.suiteIds)}
                          </span>
                          <span className="mt-0.5 block font-medium">{item.name}</span>
                          <span className="mt-1 block text-sm text-[var(--bui-ink-2)]">
                            {item.description}
                          </span>
                        </button>
                        <div className="flex items-center gap-2">
                          <Chip>{item.enabled ? "on" : "off"}</Chip>
                          <Button
                            type="button"
                            variant={item.enabled ? "secondary" : "primary"}
                            disabled={saving}
                            onClick={() => patch(item.id, { enabled: !item.enabled })}
                          >
                            {item.enabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                      {open ? (
                        <div className="grid gap-3 border-t border-[var(--bui-line)] bg-[var(--bui-inset)] px-4 py-4">
                          <label className="grid gap-1 text-sm">
                            <span className="ui-label">Name</span>
                            <input
                              className="ui-field"
                              value={item.name}
                              disabled={saving}
                              onChange={(event) => {
                                setEvaluators((current) =>
                                  current.map((row) =>
                                    row.id === item.id ? { ...row, name: event.target.value } : row,
                                  ),
                                );
                              }}
                              onBlur={(event) => patch(item.id, { name: event.target.value })}
                            />
                          </label>
                          {item.builtin ? null : (
                            <label className="grid gap-1 text-sm">
                              <span className="ui-label">Agent</span>
                              <select
                                className="ui-field ui-select"
                                value={item.suiteIds[0] ?? addSuite}
                                disabled={saving}
                                onChange={(event) =>
                                  patch(item.id, {
                                    suiteIds: [event.target.value as EvalSuiteId],
                                  })
                                }
                              >
                                {EVAL_SUITE_IDS.map((suiteId) => (
                                  <option key={suiteId} value={suiteId}>
                                    {EVAL_SUITE_LABELS[suiteId]}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          <label className="grid gap-1 text-sm">
                            <span className="ui-label">Pass threshold (0–1)</span>
                            <input
                              className="ui-field"
                              type="number"
                              min={0}
                              max={1}
                              step={0.05}
                              value={item.config.passThreshold ?? 0.7}
                              disabled={saving}
                              onChange={(event) => {
                                const passThreshold = Number(event.target.value);
                                setEvaluators((current) =>
                                  current.map((row) =>
                                    row.id === item.id
                                      ? { ...row, config: { ...row.config, passThreshold } }
                                      : row,
                                  ),
                                );
                              }}
                              onBlur={(event) =>
                                patch(item.id, {
                                  config: { ...item.config, passThreshold: Number(event.target.value) },
                                })
                              }
                            />
                          </label>
                          {item.kind === "llm" ? (
                            <label className="grid gap-1 text-sm">
                              <span className="ui-label">Judge prompt</span>
                              <textarea
                                className="ui-field min-h-40"
                                value={item.config.prompt ?? DEFAULT_LLM_PROMPT}
                                disabled={saving}
                                onChange={(event) => {
                                  setEvaluators((current) =>
                                    current.map((row) =>
                                      row.id === item.id
                                        ? { ...row, config: { ...row.config, prompt: event.target.value } }
                                        : row,
                                    ),
                                  );
                                }}
                                onBlur={(event) =>
                                  patch(item.id, {
                                    config: { ...item.config, prompt: event.target.value },
                                  })
                                }
                              />
                            </label>
                          ) : (
                            <p className="text-sm text-[var(--bui-ink-2)]">
                              Code reads output.must (tools and phrases), output.mustNot, and
                              routing labels. No extra prompt.
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" onClick={() => setOpenId(null)}>
                              Close
                            </Button>
                            {item.builtin ? null : (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => void remove(item.id)}
                                disabled={saving}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
