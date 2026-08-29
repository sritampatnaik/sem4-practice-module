import { createAgent } from "@/agents";
import { routeStudentTurn } from "@/agents/orchestration/router";
import { DEFAULT_PROFILE, type AgentRuntimeContext } from "@/agents/_shared/types";
import { sanitizeStudentMessage } from "@/lib/guardrails";
import { getModelId, runWithModel } from "@/lib/llm";
import { EVAL_SUITES } from "./catalog";
import { getEvalSuite } from "./live-catalog";
import { estimateCostUsd, percentile } from "./pricing";
import { summarizeSuiteItems } from "./metrics";
import { evaluateItem } from "./evaluate";
import type { EvalItem, EvalItemResult, EvalJob, EvalRun, EvalSuiteId, GoldRouting } from "./types";

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
    const scored = await evaluateItem({
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

export function summarizeRun(items: EvalItemResult[], suiteIds: EvalSuiteId[]): EvalRun {
  const suites = suiteIds.map((suiteId) => {
    const meta = EVAL_SUITES.find((suite) => suite.id === suiteId);
    return summarizeSuiteItems(suiteId, meta?.name ?? suiteId, items);
  });
  const latencies = items.map((item) => item.latencyMs);
  const accuracy =
    items.length === 0 ? 0 : items.reduce((sum, item) => sum + item.accuracy, 0) / items.length;
  return {
    id: `run-${Date.now().toString(36)}`,
    startedAt: items[0] ? new Date().toISOString() : new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    model: runModelLabel(items),
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

function runModelLabel(items: EvalItemResult[]) {
  const models = [...new Set(items.map((item) => item.model).filter(Boolean))];
  if (models.length === 1) return models[0]!;
  if (models.length) return models.join(" + ");
  return getModelId();
}

export async function* runEvalSuites(options: {
  suiteIds?: EvalSuiteId[];
  jobs?: EvalJob[];
  concurrency?: number;
  onItem?: (item: EvalItemResult) => void;
}) {
  const jobs: EvalJob[] = options.jobs?.length
    ? options.jobs
    : (options.suiteIds?.length
        ? options.suiteIds
        : EVAL_SUITES.map((suite) => suite.id)
      ).map((suiteId) => ({ suiteId, model: getModelId() }));
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const collected: EvalItemResult[] = [];
  const startedAt = new Date().toISOString();

  for (const job of jobs) {
    const suite = getEvalSuite(job.suiteId);
    const results = await runWithModel(job.model, () =>
      mapPool(suite.items, concurrency, runEvalItem),
    );
    for (const result of results) {
      collected.push(result);
      options.onItem?.(result);
      yield { type: "item" as const, result };
    }
    yield {
      type: "suite" as const,
      summary: summarizeSuiteItems(job.suiteId, suite.name, results),
    };
  }

  const run = summarizeRun(
    collected,
    jobs.map((job) => job.suiteId),
  );
  run.startedAt = startedAt;
  run.finishedAt = new Date().toISOString();
  yield { type: "done" as const, run };
}

export type { GoldRouting };
