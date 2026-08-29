import { resolveEvalModel } from "@/lib/models";
import { EVAL_SUITE_IDS } from "./types";
import type { EvalJob, EvalSuiteId } from "./types";

export function parseEvalJobs(body: {
  jobs?: unknown;
  suiteIds?: unknown;
  suiteId?: unknown;
  model?: unknown;
}): EvalJob[] {
  const fallbackModel = resolveEvalModel(body.model).id;
  if (Array.isArray(body.jobs) && body.jobs.length) {
    const jobs = body.jobs.flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const row = raw as { suiteId?: unknown; model?: unknown };
      if (!EVAL_SUITE_IDS.includes(row.suiteId as EvalSuiteId)) return [];
      return [
        {
          suiteId: row.suiteId as EvalSuiteId,
          model: resolveEvalModel(row.model ?? fallbackModel).id,
        },
      ];
    });
    if (jobs.length) return jobs;
  }
  const suiteIds = Array.isArray(body.suiteIds)
    ? body.suiteIds.filter((id): id is EvalSuiteId => EVAL_SUITE_IDS.includes(id as EvalSuiteId))
    : typeof body.suiteId === "string" && EVAL_SUITE_IDS.includes(body.suiteId as EvalSuiteId)
      ? [body.suiteId as EvalSuiteId]
      : [...EVAL_SUITE_IDS];
  return suiteIds.map((suiteId) => ({ suiteId, model: fallbackModel }));
}
