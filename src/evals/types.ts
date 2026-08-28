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
