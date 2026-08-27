import { createAgent } from "@/agents";
import { routeStudentTurn } from "@/agents/orchestration/router";
import { DEFAULT_PROFILE, type AgentRuntimeContext } from "@/agents/_shared/types";
import { sanitizeStudentMessage } from "@/lib/guardrails";
import { getModelId } from "@/lib/llm";
import { EVAL_SUITES, getEvalSuite } from "./catalog";
import { estimateCostUsd, percentile } from "./pricing";
import { scoreAgainstScaffold } from "./score";
import type {
  EvalItem,
  EvalItemResult,
  EvalRun,
  EvalSuiteId,
  EvalSuiteSummary,
  GoldRouting,
} from "./types";

const DEFAULT_CONCURRENCY = 2;

function makeCtx(item: EvalItem): AgentRuntimeContext {
  return {
    sessionId: `eval-${item.id}-${Date.now().toString(36)}`,
    profile: item.profile ?? DEFAULT_PROFILE,
    recentChats: [],
  };
}

function usageOf(result: {
  totalUsage?: { inputTokens?: number; outputTokens?: number };
  usage?: { inputTokens?: number; outputTokens?: number };
}) {
  const usage = result.totalUsage ?? result.usage ?? {};
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  };
}

async function runRoutingItem(item: EvalItem): Promise<Omit<EvalItemResult, "accuracy" | "passed" | "checks">> {
  const ctx = makeCtx(item);
  const { text } = sanitizeStudentMessage(item.prompt);
  const started = Date.now();
  const routing = await routeStudentTurn({
    ctx,
    messages: [{ role: "user", parts: [{ type: "text", text }] }],
  });
  const usage = {
    inputTokens: routing.usage?.inputTokens ?? 0,
    outputTokens: routing.usage?.outputTokens ?? 0,
  };
  return {
    itemId: item.id,
    suiteId: item.suiteId,
    title: item.title,
    kind: item.kind,
    prompt: item.prompt,
    goldReply: item.scaffold.goldReply,
    actualText: JSON.stringify(routing),
    actualRouting: {
      agent: routing.agent,
      intent: routing.intent,
      subject: routing.subject,
      gradeLevel: routing.gradeLevel,
      rationale: routing.rationale,
    },
    toolCalls: [],
    latencyMs: Date.now() - started,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: 0,
    model: getModelId(),
  };
}

async function runAgentItem(item: EvalItem): Promise<Omit<EvalItemResult, "accuracy" | "passed" | "checks">> {
  const ctx = makeCtx(item);
  const { text } = sanitizeStudentMessage(item.prompt);
  const started = Date.now();
  const agent = createAgent(item.targetAgent, ctx);
  const result = await agent.generate({ prompt: text });
  const usage = usageOf(result);
  const toolCalls = (result.toolCalls ?? []).map((call) => call.toolName);
  return {
    itemId: item.id,
    suiteId: item.suiteId,
    title: item.title,
    kind: item.kind,
    prompt: item.prompt,
    goldReply: item.scaffold.goldReply,
    actualText: result.text ?? "",
    toolCalls,
    latencyMs: Date.now() - started,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: estimateCostUsd({
      model: getModelId(),
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }),
    model: getModelId(),
  };
}

export async function runEvalItem(item: EvalItem): Promise<EvalItemResult> {
  try {
    const raw = item.kind === "routing" ? await runRoutingItem(item) : await runAgentItem(item);
    const scored = scoreAgainstScaffold({
      item,
      actualText: raw.actualText,
      toolCalls: raw.toolCalls,
      actualRouting: raw.actualRouting,
    });
    if (item.kind === "routing") {
      raw.costUsd = estimateCostUsd({
        model: raw.model,
        inputTokens: raw.inputTokens,
        outputTokens: raw.outputTokens,
      });
    }
    return { ...raw, ...scored };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      itemId: item.id,
      suiteId: item.suiteId,
      title: item.title,
      kind: item.kind,
      prompt: item.prompt,
      goldReply: item.scaffold.goldReply,
      actualText: "",
      toolCalls: [],
      accuracy: 0,
      passed: false,
      checks: [{ name: "error", passed: false, detail: message }],
      latencyMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      model: getModelId(),
      error: message,
    };
  }
}

function summarizeSuite(
  suiteId: EvalSuiteId,
  name: string,
  items: EvalItemResult[],
): EvalSuiteSummary {
  const latencies = items.map((item) => item.latencyMs);
  const accuracy =
    items.length === 0 ? 0 : items.reduce((sum, item) => sum + item.accuracy, 0) / items.length;
  return {
    suiteId,
    name,
    itemCount: items.length,
    passed: items.filter((item) => item.passed).length,
    accuracy: Number(accuracy.toFixed(3)),
    avgLatencyMs: Math.round(
      latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0,
    ),
    p50LatencyMs: Math.round(percentile(latencies, 50)),
    totalCostUsd: Number(items.reduce((sum, item) => sum + item.costUsd, 0).toFixed(6)),
    totalTokens: items.reduce((itemSum, item) => itemSum + item.inputTokens + item.outputTokens, 0),
  };
}

export function summarizeRun(items: EvalItemResult[], suiteIds: EvalSuiteId[]): EvalRun {
  const suites = suiteIds.map((suiteId) => {
    const meta = EVAL_SUITES.find((suite) => suite.id === suiteId);
    return summarizeSuite(
      suiteId,
      meta?.name ?? suiteId,
      items.filter((item) => item.suiteId === suiteId),
    );
  });
  const latencies = items.map((item) => item.latencyMs);
  const accuracy =
    items.length === 0 ? 0 : items.reduce((sum, item) => sum + item.accuracy, 0) / items.length;
  return {
    id: `run-${Date.now().toString(36)}`,
    startedAt: items[0] ? new Date().toISOString() : new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    model: getModelId(),
    suiteIds,
    items,
    suites,
    totals: {
      itemCount: items.length,
      passed: items.filter((item) => item.passed).length,
      accuracy: Number(accuracy.toFixed(3)),
      avgLatencyMs: Math.round(
        latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0,
      ),
      p50LatencyMs: Math.round(percentile(latencies, 50)),
      totalCostUsd: Number(items.reduce((sum, item) => sum + item.costUsd, 0).toFixed(6)),
      totalTokens: items.reduce((sum, item) => sum + item.inputTokens + item.outputTokens, 0),
    },
  };
}

async function mapPool<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current] as T);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function* runEvalSuites(options: {
  suiteIds?: EvalSuiteId[];
  concurrency?: number;
  onItem?: (item: EvalItemResult) => void;
}) {
  const suiteIds = options.suiteIds?.length
    ? options.suiteIds
    : EVAL_SUITES.map((suite) => suite.id);
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const collected: EvalItemResult[] = [];
  const startedAt = new Date().toISOString();

  for (const suiteId of suiteIds) {
    const suite = getEvalSuite(suiteId);
    const results = await mapPool(suite.items, concurrency, runEvalItem);
    for (const result of results) {
      collected.push(result);
      options.onItem?.(result);
      yield { type: "item" as const, result };
    }
    yield {
      type: "suite" as const,
      summary: summarizeSuite(suiteId, suite.name, results),
    };
  }

  const run = summarizeRun(collected, suiteIds);
  run.startedAt = startedAt;
  run.finishedAt = new Date().toISOString();
  yield { type: "done" as const, run };
}

export type { GoldRouting };
