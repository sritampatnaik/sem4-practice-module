import type { AgentId, GradeLevel, Intent, StudentProfile, Subject } from "@/agents/_shared/types";

export const EVAL_SUITE_IDS = [
  "routing",
  "concierge",
  "math",
  "physics",
  "chemistry",
  "testing",
] as const;

export type EvalSuiteId = (typeof EVAL_SUITE_IDS)[number];
export type EvalKind = "routing" | "concierge" | "teaching" | "testing";

export type GoldRouting = {
  agent: AgentId;
  intent: Intent;
  subject: Subject | "none";
  gradeLevel?: GradeLevel;
};

export type EvalScaffold = {
  /** Short system-style contract this item is testing. */
  contract: string;
  /** Sample tutor / router output we score the live model against. */
  goldReply: string;
  routing?: GoldRouting;
  mustInclude?: string[];
  mustNotInclude?: string[];
  requiredTools?: string[];
  source?: string;
};

export type DatasetInput = {
  message: string;
  profile: StudentProfile;
};

export type DatasetOutput = {
  must: string[];
  mustNot: string[];
  agent: AgentId;
  intent: Intent;
  subject: Subject | "none";
  gradeLevel: GradeLevel;
};

export type DatasetMetadata = {
  band: GradeLevel;
  agent: AgentId;
  source: string;
  id?: string;
  title?: string;
  suite?: EvalSuiteId;
  contract?: string;
  goldReply?: string;
};

/** Langfuse-style item the datasets editor reads and writes. */
export type DatasetItemJson = {
  input: DatasetInput;
  output: DatasetOutput;
  metadata: DatasetMetadata;
};

export type CatalogItemDraft = {
  id: string;
  suiteId: EvalSuiteId;
  kind: EvalKind;
  title: string;
  prompt: string;
  goldReply: string;
  contract: string;
  requiredTools: string[];
  mustInclude: string[];
  mustNotInclude: string[];
  targetAgent: AgentId;
  gradeLevel: GradeLevel;
  routing?: GoldRouting;
  profile?: StudentProfile;
  source?: string;
  dataset?: DatasetItemJson;
};

export type EvalItem = {
  id: string;
  suiteId: EvalSuiteId;
  kind: EvalKind;
  title: string;
  prompt: string;
  profile: StudentProfile;
  targetAgent: AgentId;
  scaffold: EvalScaffold;
};

export type EvalSuite = {
  id: EvalSuiteId;
  name: string;
  description: string;
  kind: EvalKind;
  items: EvalItem[];
};

export type EvalCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type EvalItemResult = {
  itemId: string;
  suiteId: EvalSuiteId;
  title: string;
  kind: EvalKind;
  prompt: string;
  goldReply: string;
  actualText: string;
  actualRouting?: GoldRouting & { rationale?: string };
  toolCalls: string[];
  accuracy: number;
  passed: boolean;
  checks: EvalCheck[];
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
  error?: string;
};

export type EvalSuiteSummary = {
  suiteId: EvalSuiteId;
  name: string;
  itemCount: number;
  passed: number;
  accuracy: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  totalCostUsd: number;
  totalTokens: number;
  model?: string;
};

export type EvalJob = {
  suiteId: EvalSuiteId;
  model: string;
};

export type EvalRunTotals = {
  itemCount: number;
  passed: number;
  accuracy: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  totalCostUsd: number;
  totalTokens: number;
};

export type EvalRun = {
  id: string;
  startedAt: string;
  finishedAt: string;
  model: string;
  suiteIds: EvalSuiteId[];
  items: EvalItemResult[];
  suites: EvalSuiteSummary[];
  totals: EvalRunTotals;
};

/** Compact run record kept for model-to-model comparison. */
export type EvalRunRecord = {
  id: string;
  startedAt: string;
  finishedAt: string;
  model: string;
  suiteIds: EvalSuiteId[];
  suites: EvalSuiteSummary[];
  totals: EvalRunTotals;
};
