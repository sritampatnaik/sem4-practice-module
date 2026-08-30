"use client";

import { useEffect, useState } from "react";
import { EvalDatasetList, type CatalogSuiteView } from "@/components/eval-dataset-list";
import type { EvalItemResult, EvalRun, EvalSuiteId } from "@/evals/types";

type CatalogResponse = {
  suites: CatalogSuiteView[];
  lastRun: EvalRun | null;
};

export function EvalDatasetDesk({ initial }: { initial?: CatalogResponse }) {
  const [suites, setSuites] = useState<CatalogSuiteView[]>(initial?.suites ?? []);
  const [selected, setSelected] = useState<EvalSuiteId | "all">("all");
  const [results, setResults] = useState<EvalItemResult[]>(initial?.lastRun?.items ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/evals")
      .then((response) => response.json())
      .then((payload: CatalogResponse) => {
        setSuites(payload.suites);
        if (payload.lastRun?.items) setResults(payload.lastRun.items);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load datasets.");
      });
  }, []);

  return (
    <div className="grid gap-4">
      {error ? <p className="text-sm text-[var(--bui-red)]">{error}</p> : null}
      <EvalDatasetList
        suites={suites}
        selected={selected}
        onSelect={setSelected}
        results={results}
        busy={false}
        onSuitesChange={setSuites}
        onError={setError}
      />
    </div>
  );
}
