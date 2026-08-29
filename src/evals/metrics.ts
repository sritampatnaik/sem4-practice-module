import { percentile } from "./pricing";
import type { EvalItemResult, EvalSuiteId, EvalSuiteSummary } from "./types";

/** Score one suite from only that suite's items. Accuracy, latency, and cost stay independent. */
export function summarizeSuiteItems(
  suiteId: EvalSuiteId,
  name: string,
  items: EvalItemResult[],
): EvalSuiteSummary {
  const own = items.filter((item) => item.suiteId === suiteId);
  const latencies = own.map((item) => item.latencyMs);
  const accuracy =
    own.length === 0 ? 0 : own.reduce((sum, item) => sum + item.accuracy, 0) / own.length;
  const models = [...new Set(own.map((item) => item.model).filter(Boolean))];
  return {
    suiteId,
    name,
    itemCount: own.length,
    passed: own.filter((item) => item.passed).length,
    accuracy: Number(accuracy.toFixed(3)),
    avgLatencyMs: Math.round(
      latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0,
    ),
    p50LatencyMs: Math.round(percentile(latencies, 50)),
    totalCostUsd: Number(own.reduce((sum, item) => sum + item.costUsd, 0).toFixed(6)),
    totalTokens: own.reduce((sum, item) => sum + item.inputTokens + item.outputTokens, 0),
    model: models.length === 1 ? models[0] : models.length ? models.join(" + ") : undefined,
  };
}
