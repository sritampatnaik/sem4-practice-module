export const GUARDRAIL_CATEGORIES = [
  "disappointment",
  "self_harm",
  "distress",
] as const;
export type GuardrailCategory = (typeof GUARDRAIL_CATEGORIES)[number];

export const GUARDRAIL_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type GuardrailSeverity = (typeof GUARDRAIL_SEVERITIES)[number];

export type GuardrailClassification = {
  hit: boolean;
  categories: GuardrailCategory[];
  severity: GuardrailSeverity;
  reason: string;
  snippet: string;
  escalate: boolean;
  source: "jev" | "model" | "heuristic" | "merged";
};

export type GuardrailAlert = {
  id: string;
  sessionId: string;
  userId: string | null;
  studentName: string;
  studentEmail: string | null;
  snippet: string;
  reason: string;
  categories: GuardrailCategory[];
  severity: GuardrailSeverity;
  promptVersion: string;
  notifiedEmail: string | null;
  notifiedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
};

export type MonitorStudentTurnInput = {
  sessionId: string;
  userId?: string;
  studentEmail?: string;
  studentName: string;
  studentText: string;
  assistantText?: string;
  recentStudentTurns?: string[];
};
