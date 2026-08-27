/**
 * Run METS Langfuse evaluators against the seeded datasets.
 *
 * Executes the real router / specialist agents, then the three seed.json
 * judges (plus a concierge check). Scores land on Langfuse dataset runs.
 *
 * Usage: npx tsx --tsconfig tsconfig.json langfuse/evals/run-experiment.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateText, Output } from "ai";
import { LangfuseClient, type Evaluation, type Evaluator, type ExperimentResult } from "@langfuse/client";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { z } from "zod";
import { createAgent } from "@/agents";
import { routeStudentTurn } from "@/agents/orchestration/router";
import {
  DEFAULT_PROFILE,
  type AgentId,
  type AgentRuntimeContext,
  type StudentProfile,
} from "@/agents/_shared/types";
import { sanitizeStudentMessage } from "@/lib/guardrails";
import { getModel, getModelId } from "@/lib/llm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");
const seedPath = join(here, "seed.json");

type SeedEvaluator = {
  name: string;
  prompt: string;
  outputDefinition?: { dataType?: string };
};

type SeedFile = {
  evaluators: SeedEvaluator[];
};

type EvalInput = {
  message: string;
  profile: StudentProfile;
};

type AgentTurnOutput = {
  agent: AgentId;
  text: string;
  finishReason: string;
  toolCalls: Array<{ toolName: string; input: unknown }>;
  toolResults: Array<{ toolName: string; output: unknown }>;
};

type JobKind = "routing" | "concierge" | "teaching" | "testing";

type Job = {
  dataset: string;
  kind: JobKind;
  agent?: AgentId;
  experimentName: string;
};

const JOBS: Job[] = [
  {
    dataset: "mets-orchestration-routing",
    kind: "routing",
    experimentName: "METS router",
  },
  {
    dataset: "mets-orchestration-concierge",
    kind: "concierge",
    experimentName: "METS concierge",
  },
  {
    dataset: "mets-math-teaching",
    kind: "teaching",
    agent: "math",
    experimentName: "METS math teaching",
  },
  {
    dataset: "mets-physics-teaching",
    kind: "teaching",
    agent: "physics",
    experimentName: "METS physics teaching",
  },
  {
    dataset: "mets-chemistry-teaching",
    kind: "teaching",
    agent: "chemistry",
    experimentName: "METS chemistry teaching",
  },
  {
    dataset: "mets-testing-assessment",
    kind: "testing",
    agent: "testing",
    experimentName: "METS testing widgets",
  },
];

const CONCIERGE_JUDGE_PROMPT = `You are judging the METS Orchestration concierge for a Singapore tutor.

Score TRUE only if the reply greets, explains METS, or asks a clarifying question, and does NOT:
- teach a worked subject solution
- generate MCQs, flashcards, or a quiz
- guess a specialist and start a lesson

Student turn (input):
{{input}}

Expected behaviour (expected_output):
{{expected_output}}

Agent output:
{{output}}

Return a boolean score and brief reasoning.`;

function loadDotEnv(path: string) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const eq = line.indexOf("=");
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

function redact(value: string | undefined) {
  if (!value) return "missing";
  return `set (len=${value.length})`;
}

function stripEnvAssignment(name: string) {
  const raw = process.env[name];
  if (!raw) return;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  const prefix = `${name}=`;
  if (value.startsWith(prefix)) {
    value = value.slice(prefix.length).trim();
  }
  process.env[name] = value;
}

function pretty(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function fillJudgePrompt(template: string, input: unknown, output: unknown, expectedOutput: unknown) {
  return template
    .replaceAll("{{input}}", pretty(input))
    .replaceAll("{{output}}", pretty(output))
    .replaceAll("{{expected_output}}", pretty(expectedOutput ?? {}));
}

function asEvalInput(input: unknown): EvalInput {
  if (!input || typeof input !== "object") {
    throw new Error("Dataset item input must be an object with message and profile.");
  }
  const rec = input as Record<string, unknown>;
  if (typeof rec.message !== "string" || !rec.message.trim()) {
    throw new Error("Dataset item input.message must be a non-empty string.");
  }
  const profile = {
    ...DEFAULT_PROFILE,
    ...(rec.profile && typeof rec.profile === "object" ? rec.profile : {}),
  } as StudentProfile;
  return { message: rec.message, profile };
}

function makeCtx(input: EvalInput): AgentRuntimeContext {
  return {
    sessionId: `eval-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    profile: input.profile,
    recentChats: [],
  };
}

function packAgentOutput(agent: AgentId, result: {
  text: string;
  finishReason?: unknown;
  toolCalls?: Array<{ toolName: string; input?: unknown }>;
  toolResults?: Array<{ toolName: string; output?: unknown }>;
}): AgentTurnOutput {
  return {
    agent,
    text: result.text ?? "",
    finishReason: String(result.finishReason ?? ""),
    toolCalls: (result.toolCalls ?? []).map((call) => ({
      toolName: call.toolName,
      input: call.input,
    })),
    toolResults: (result.toolResults ?? []).map((toolResult) => ({
      toolName: toolResult.toolName,
      output: toolResult.output,
    })),
  };
}

async function generateAgentTurn(agentId: AgentId, item: { input?: unknown }) {
  const input = asEvalInput(item.input);
  const ctx = makeCtx(input);
  const { text } = sanitizeStudentMessage(input.message);
  const agent = createAgent(agentId, ctx);
  const result = await agent.generate({ prompt: text });
  return packAgentOutput(agentId, result);
}

function findSeedJudge(seed: SeedFile, name: string) {
  const judge = seed.evaluators.find((entry) => entry.name === name);
  if (!judge) {
    throw new Error(`Judge ${name} is missing from seed.json`);
  }
  return judge;
}

function makeLlmJudge(options: {
  prompt: string;
  scoreName: string;
  dataType: "BOOLEAN" | "NUMERIC";
}): Evaluator {
  return async ({ input, output, expectedOutput }): Promise<Evaluation> => {
    const prompt = fillJudgePrompt(options.prompt, input, output, expectedOutput);
    if (options.dataType === "BOOLEAN") {
      const judged = await generateText({
        model: getModel(),
        prompt,
        output: Output.object({
          schema: z.object({
            score: z.boolean(),
            reasoning: z.string(),
          }),
        }),
        temperature: 0,
      });
      if (!judged.output) {
        throw new Error(`${options.scoreName} returned no structured output`);
      }
      return {
        name: options.scoreName,
        value: judged.output.score ? 1 : 0,
        comment: judged.output.reasoning,
        dataType: "BOOLEAN",
      };
    }

    const judged = await generateText({
      model: getModel(),
      prompt,
      output: Output.object({
        schema: z.object({
          score: z.number().int().min(1).max(5),
          reasoning: z.string(),
        }),
      }),
      temperature: 0,
    });
    if (!judged.output) {
      throw new Error(`${options.scoreName} returned no structured output`);
    }
    return {
      name: options.scoreName,
      value: judged.output.score,
      comment: judged.output.reasoning,
      dataType: "NUMERIC",
    };
  };
}

function evaluatorsFor(kind: JobKind, seed: SeedFile): Evaluator[] {
  if (kind === "routing") {
    const judge = findSeedJudge(seed, "mets-judge-routing");
    return [
      makeLlmJudge({
        prompt: judge.prompt,
        scoreName: "mets-routing-correct",
        dataType: "BOOLEAN",
      }),
    ];
  }
  if (kind === "concierge") {
    return [
      makeLlmJudge({
        prompt: CONCIERGE_JUDGE_PROMPT,
        scoreName: "mets-concierge-ok",
        dataType: "BOOLEAN",
      }),
    ];
  }
  if (kind === "testing") {
    const judge = findSeedJudge(seed, "mets-judge-testing-widget");
    return [
      makeLlmJudge({
        prompt: judge.prompt,
        scoreName: "mets-widget-valid",
        dataType: "BOOLEAN",
      }),
    ];
  }
  const judge = findSeedJudge(seed, "mets-judge-singapore-tutor");
  return [
    makeLlmJudge({
      prompt: judge.prompt,
      scoreName: "mets-teaching-quality",
      dataType: "NUMERIC",
    }),
  ];
}

async function runJob(
  langfuse: LangfuseClient,
  seed: SeedFile,
  job: Job,
): Promise<{ job: Job; result: ExperimentResult; formatted: string }> {
  const dataset = await langfuse.dataset.get(job.dataset);
  const task =
    job.kind === "routing"
      ? async (item: { input?: unknown }) => {
          const input = asEvalInput(item.input);
          const ctx = makeCtx(input);
          const { text } = sanitizeStudentMessage(input.message);
          return routeStudentTurn({
            ctx,
            messages: [{ role: "user", parts: [{ type: "text", text }] }],
          });
        }
      : async (item: { input?: unknown }) => generateAgentTurn(job.agent ?? "orchestration", item);

  const result = await dataset.runExperiment({
    name: job.experimentName,
    description: `Offline METS eval: ${job.dataset}`,
    metadata: {
      product: "mets",
      dataset: job.dataset,
      kind: job.kind,
      model: getModelId(),
    },
    task,
    evaluators: evaluatorsFor(job.kind, seed),
    maxConcurrency: 2,
  });
  const formatted = await result.format({ includeItemResults: true });
  return { job, result, formatted };
}

function summarizeResult(entry: { job: Job; result: ExperimentResult; formatted: string }) {
  return {
    dataset: entry.job.dataset,
    experimentName: entry.job.experimentName,
    runName: entry.result.runName,
    datasetRunId: entry.result.datasetRunId,
    datasetRunUrl: entry.result.datasetRunUrl,
    itemCount: entry.result.itemResults.length,
    scores: entry.result.itemResults.map((item) => ({
      input:
        item.input && typeof item.input === "object" && "message" in item.input
          ? (item.input as { message?: string }).message
          : item.input,
      evaluations: item.evaluations,
    })),
    formatted: entry.formatted,
  };
}

async function main() {
  loadDotEnv(join(repoRoot, ".env.local"));
  loadDotEnv(join(repoRoot, ".env"));
  stripEnvAssignment("OPENAI_API_KEY");
  stripEnvAssignment("LANGFUSE_PUBLIC_KEY");
  stripEnvAssignment("LANGFUSE_SECRET_KEY");

  if (!process.env.LANGFUSE_HOST && process.env.LANGFUSE_BASE_URL) {
    process.env.LANGFUSE_HOST = process.env.LANGFUSE_BASE_URL;
  }
  if (!process.env.LANGFUSE_BASE_URL && process.env.LANGFUSE_HOST) {
    process.env.LANGFUSE_BASE_URL = process.env.LANGFUSE_HOST;
  }
  if (!process.env.LANGFUSE_HOST) {
    process.env.LANGFUSE_HOST = "https://us.cloud.langfuse.com";
    process.env.LANGFUSE_BASE_URL = process.env.LANGFUSE_HOST;
  }

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY ?? "";
  const secretKey = process.env.LANGFUSE_SECRET_KEY ?? "";
  const host = process.env.LANGFUSE_HOST ?? "";
  const openaiKey = process.env.OPENAI_API_KEY ?? "";

  if (!publicKey || !secretKey || !openaiKey) {
    console.error(
      [
        "Missing keys. Set these in .env.local (do not paste them into chat):",
        "  LANGFUSE_PUBLIC_KEY=pk-lf-...",
        "  LANGFUSE_SECRET_KEY=sk-lf-...",
        "  LANGFUSE_HOST=https://us.cloud.langfuse.com",
        "  OPENAI_API_KEY=sk-...",
        "",
        `Current: PUBLIC_KEY=${redact(publicKey)} SECRET_KEY=${redact(secretKey)} OPENAI=${redact(openaiKey)} HOST=${host}`,
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log(
    [
      `Langfuse host: ${host}`,
      `LANGFUSE_PUBLIC_KEY: ${redact(publicKey)}`,
      `LANGFUSE_SECRET_KEY: ${redact(secretKey)}`,
      `OPENAI_API_KEY: ${redact(openaiKey)}`,
      `OPENAI_MODEL: ${getModelId()}`,
    ].join("\n"),
  );

  const processor = new LangfuseSpanProcessor({ exportMode: "immediate" });
  const provider = new NodeTracerProvider({
    spanProcessors: [processor],
  });
  provider.register();

  const langfuse = new LangfuseClient({
    publicKey,
    secretKey,
    baseUrl: host,
  });
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as SeedFile;

  const summaries = [];
  const failures: Array<{ dataset: string; error: string }> = [];

  for (const job of JOBS) {
    console.log(`\n=== ${job.dataset} ===`);
    try {
      const entry = await runJob(langfuse, seed, job);
      summaries.push(summarizeResult(entry));
      console.log(entry.formatted);
      if (entry.result.datasetRunUrl) {
        console.log(`Dataset run: ${entry.result.datasetRunUrl}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ dataset: job.dataset, error: message });
      console.error(`Failed ${job.dataset}: ${message}`);
    }
  }

  await langfuse.flush();
  await langfuse.shutdown();
  await processor.forceFlush();
  await provider.shutdown();

  const tmpDir = join(here, ".tmp");
  mkdirSync(tmpDir, { recursive: true });
  const reportPath = join(here, "experiment-report.json");
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        model: getModelId(),
        host,
        ranAt: new Date().toISOString(),
        summaries,
        failures,
      },
      null,
      2,
    ),
  );
  console.log(`\nWrote ${reportPath}`);

  if (failures.length) {
    console.error(`\n${failures.length} dataset run(s) failed.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
