import {
  AGENT_IDS,
  GRADE_LEVELS,
  INTENTS,
  SUBJECTS,
  isSchoolGrade,
  type AgentId,
  type GradeLevel,
  type Intent,
  type StudentProfile,
  type Subject,
} from "@/agents/_shared/types";
import { EVAL_SUITE_IDS } from "./types";
import type {
  CatalogItemDraft,
  DatasetItemJson,
  EvalItem,
  EvalKind,
  EvalSuiteId,
} from "./types";

export const EVAL_TOOL_NAMES = [
  "documentSearch",
  "documentSearchMath",
  "documentSearchPhysics",
  "documentSearchChemistry",
  "equationSolver",
  "unitConverter",
  "formulaLookup",
  "periodicTable",
  "reactionBalancer",
  "createMcqSet",
  "createFlashcards",
  "webSearch",
] as const;

const TOOL_SET = new Set<string>(EVAL_TOOL_NAMES);

export function isEvalToolName(value: string) {
  return TOOL_SET.has(value);
}

export function splitMust(values: string[]) {
  const requiredTools: string[] = [];
  const mustInclude: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (isEvalToolName(trimmed)) requiredTools.push(trimmed);
    else mustInclude.push(trimmed);
  }
  return { requiredTools, mustInclude };
}

function intentForKind(kind: EvalKind): Intent {
  if (kind === "testing") return "testing";
  if (kind === "concierge") return "general";
  return "teaching";
}

function subjectForAgent(agent: AgentId, fallback?: Subject | "none"): Subject | "none" {
  if (fallback) return fallback;
  if (agent === "math" || agent === "physics" || agent === "chemistry") return agent;
  return "none";
}

function asProfile(value: unknown, fallback: GradeLevel): StudentProfile {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const gradeLevel = GRADE_LEVELS.includes(raw.gradeLevel as GradeLevel)
    ? (raw.gradeLevel as GradeLevel)
    : fallback;
  const diagnostic =
    raw.diagnostic && typeof raw.diagnostic === "object" && !Array.isArray(raw.diagnostic)
      ? (raw.diagnostic as StudentProfile["diagnostic"])
      : {};
  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : "Alex",
    gradeLevel,
    grade: isSchoolGrade(raw.grade) ? raw.grade : undefined,
    diagnostic,
    notes: Array.isArray(raw.notes)
      ? raw.notes.filter((note): note is string => typeof note === "string")
      : [],
  };
}

export function toDatasetItem(item: EvalItem): DatasetItemJson {
  const routing = item.scaffold.routing;
  const agent = routing?.agent ?? item.targetAgent;
  const gradeLevel = routing?.gradeLevel ?? item.profile.gradeLevel;
  return {
    input: {
      message: item.prompt,
      profile: item.profile,
    },
    output: {
      must: [...(item.scaffold.requiredTools ?? []), ...(item.scaffold.mustInclude ?? [])],
      mustNot: item.scaffold.mustNotInclude ?? [],
      agent,
      intent: routing?.intent ?? intentForKind(item.kind),
      subject: routing?.subject ?? subjectForAgent(agent),
      gradeLevel,
    },
    metadata: {
      band: item.profile.gradeLevel,
      agent: item.targetAgent,
      source: item.scaffold.source ?? "readme-smoke",
      id: item.id,
      title: item.title,
      suite: item.suiteId,
      contract: item.scaffold.contract,
      goldReply: item.scaffold.goldReply,
    },
  };
}

export function datasetToDraft(
  dataset: DatasetItemJson,
  options: { id: string; suiteId: EvalSuiteId; kind: EvalKind },
): CatalogItemDraft {
  const { requiredTools, mustInclude } = splitMust(dataset.output.must);
  const profile = asProfile(dataset.input.profile, dataset.output.gradeLevel);
  const title =
    dataset.metadata.title?.trim() ||
    dataset.input.message.trim().slice(0, 72) ||
    "Untitled eval";
  const routing =
    options.kind === "routing"
      ? {
          agent: dataset.output.agent,
          intent: dataset.output.intent,
          subject: dataset.output.subject,
          gradeLevel: dataset.output.gradeLevel,
        }
      : undefined;
  return {
    id: options.id,
    suiteId: options.suiteId,
    kind: options.kind,
    title,
    prompt: dataset.input.message,
    goldReply: dataset.metadata.goldReply ?? (routing ? JSON.stringify(routing) : ""),
    contract: dataset.metadata.contract ?? dataset.output.must.join("; "),
    requiredTools,
    mustInclude,
    mustNotInclude: dataset.output.mustNot.map((value) => value.trim()).filter(Boolean),
    targetAgent: dataset.metadata.agent,
    gradeLevel: dataset.metadata.band || profile.gradeLevel,
    routing,
    profile,
    source: dataset.metadata.source || "custom",
    dataset,
  };
}

export function examplePhysicsDataset(): DatasetItemJson {
  return {
    input: {
      message: "Is quantum physics in O-Level or A-Level?",
      profile: {
        name: "Alex",
        notes: [],
        diagnostic: {},
        gradeLevel: "secondary",
      },
    },
    output: {
      must: ["documentSearch", "A-Level / JC, not O-Level"],
      agent: "physics",
      intent: "teaching",
      mustNot: ["dump university quantum content"],
      subject: "physics",
      gradeLevel: "secondary",
    },
    metadata: {
      band: "secondary",
      agent: "physics",
      source: "readme-smoke",
    },
  };
}

export function blankDataset(suiteId: EvalSuiteId, kind: EvalKind): DatasetItemJson {
  const agent: AgentId =
    suiteId === "routing" || suiteId === "concierge" ? "orchestration" : (suiteId as AgentId);
  return {
    input: {
      message: "",
      profile: {
        name: "Alex",
        notes: [],
        diagnostic: {},
        gradeLevel: "secondary",
      },
    },
    output: {
      must: [],
      mustNot: [],
      agent,
      intent: intentForKind(kind),
      subject: subjectForAgent(agent),
      gradeLevel: "secondary",
    },
    metadata: {
      band: "secondary",
      agent,
      source: "custom",
      title: "New eval",
      suite: suiteId,
    },
  };
}

export function prettyDataset(dataset: DatasetItemJson) {
  return JSON.stringify(
    {
      input: dataset.input,
      output: dataset.output,
      metadata: {
        band: dataset.metadata.band,
        agent: dataset.metadata.agent,
        source: dataset.metadata.source,
        ...(dataset.metadata.title ? { title: dataset.metadata.title } : {}),
        ...(dataset.metadata.contract ? { contract: dataset.metadata.contract } : {}),
        ...(dataset.metadata.goldReply ? { goldReply: dataset.metadata.goldReply } : {}),
      },
    },
    null,
    2,
  );
}

export function parseDatasetJson(value: unknown): DatasetItemJson {
  if (!value || typeof value !== "object") throw new Error("Eval JSON must be an object.");
  const raw = value as Record<string, unknown>;
  if (!raw.input || typeof raw.input !== "object") throw new Error("input is required.");
  if (!raw.output || typeof raw.output !== "object") throw new Error("output is required.");
  if (!raw.metadata || typeof raw.metadata !== "object") throw new Error("metadata is required.");

  const input = raw.input as Record<string, unknown>;
  const output = raw.output as Record<string, unknown>;
  const metadata = raw.metadata as Record<string, unknown>;

  if (typeof input.message !== "string") throw new Error("input.message must be a string.");
  if (!AGENT_IDS.includes(output.agent as AgentId)) throw new Error("output.agent is not a known agent.");
  if (!INTENTS.includes(output.intent as Intent)) throw new Error("output.intent is not a known intent.");
  if (output.subject !== "none" && !SUBJECTS.includes(output.subject as Subject)) {
    throw new Error("output.subject must be math, physics, chemistry, or none.");
  }
  if (!GRADE_LEVELS.includes(output.gradeLevel as GradeLevel)) {
    throw new Error("output.gradeLevel is not a known band.");
  }
  if (!GRADE_LEVELS.includes(metadata.band as GradeLevel)) {
    throw new Error("metadata.band is not a known band.");
  }
  if (!AGENT_IDS.includes(metadata.agent as AgentId)) {
    throw new Error("metadata.agent is not a known agent.");
  }
  if (typeof metadata.source !== "string" || !metadata.source.trim()) {
    throw new Error("metadata.source is required.");
  }
  if (metadata.suite && !EVAL_SUITE_IDS.includes(metadata.suite as EvalSuiteId)) {
    throw new Error("metadata.suite is not a known eval suite.");
  }

  const profile = asProfile(input.profile, output.gradeLevel as GradeLevel);
  return {
    input: { message: input.message, profile },
    output: {
      must: asStringList(output.must),
      mustNot: asStringList(output.mustNot),
      agent: output.agent as AgentId,
      intent: output.intent as Intent,
      subject: output.subject as Subject | "none",
      gradeLevel: output.gradeLevel as GradeLevel,
    },
    metadata: {
      band: metadata.band as GradeLevel,
      agent: metadata.agent as AgentId,
      source: metadata.source.trim(),
      id: typeof metadata.id === "string" ? metadata.id : undefined,
      title: typeof metadata.title === "string" ? metadata.title : undefined,
      suite: metadata.suite as EvalSuiteId | undefined,
      contract: typeof metadata.contract === "string" ? metadata.contract : undefined,
      goldReply: typeof metadata.goldReply === "string" ? metadata.goldReply : undefined,
    },
  };
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function looksLikeDatasetJson(value: unknown): value is DatasetItemJson {
  if (!value || typeof value !== "object") return false;
  const raw = value as Record<string, unknown>;
  return Boolean(raw.input && raw.output && raw.metadata);
}
