import { EVAL_SUITE_IDS, type EvalSuiteId } from "./types";

export const EVALUATOR_KINDS = ["code", "llm"] as const;
export type EvaluatorKind = (typeof EVALUATOR_KINDS)[number];

export const EVAL_SUITE_LABELS: Record<EvalSuiteId, string> = {
  routing: "Router",
  concierge: "Concierge",
  math: "Math",
  physics: "Physics",
  chemistry: "Chemistry",
  testing: "Testing",
};

export type Evaluator = {
  id: string;
  kind: EvaluatorKind;
  name: string;
  description: string;
  enabled: boolean;
  builtin: boolean;
  /** Empty / omitted means the evaluator runs on every agent. */
  suiteIds: EvalSuiteId[];
  config: {
    passThreshold?: number;
    prompt?: string;
  };
};

export const DEFAULT_LLM_PROMPT = `You are scoring a Singapore tutor reply against a gold eval item.

Score accuracy from 0 to 1. Pass only if the reply meets the output contract:
- required tools / must phrases in output.must
- avoids output.mustNot
- stays on the named agent, intent, subject, and grade band
- does not dump university content when the band is O-Level or Primary

Return short checks that say what passed or failed.`;

const AGENT_JUDGE_FOCUS: Record<EvalSuiteId, string> = {
  routing:
    "This is a Router item. Pass only if routeStudentTurn would pick the gold agent, intent, subject, and grade band. Kinematics is Physics; quizzes and flashcards go to Testing. Do not teach the lesson here.",
  concierge:
    "This is a Concierge item. Pass only if the reply greets or clarifies and does not teach a lesson or emit a quiz / flashcard widget.",
  math: "This is a Math item. Pass only if the working stays in-band, uses the expected tools (equationSolver / documentSearch when required), and does not jump to university methods.",
  physics:
    "This is a Physics item. Pass only if the reply follows principle → formula → SI units, uses formulaLookup / unitConverter when required, and stays in the named grade band.",
  chemistry:
    "This is a Chemistry item. Pass only if periodicTable / reactionBalancer are used when required, facts stay syllabus-safe, and the band is respected.",
  testing:
    "This is a Testing item. Pass only if exactly one quiz or flashcard widget tool is used, items are original, and live exam papers are refused.",
};

export function judgeIdForSuite(suiteId: EvalSuiteId) {
  return `llm-judge-${suiteId}`;
}

export function parseSuiteIds(value: unknown): EvalSuiteId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is EvalSuiteId => EVAL_SUITE_IDS.includes(id as EvalSuiteId));
}

export function evaluatorAppliesToSuite(evaluator: Evaluator, suiteId: EvalSuiteId) {
  if (!evaluator.suiteIds.length) return true;
  return evaluator.suiteIds.includes(suiteId);
}

export function evaluatorsForSuite(evaluators: Evaluator[], suiteId: EvalSuiteId) {
  return evaluators.filter(
    (item) => item.enabled && evaluatorAppliesToSuite(item, suiteId),
  );
}

export function missingJudgeSuites(evaluators: Evaluator[]) {
  const judges = evaluators.filter((item) => item.kind === "llm");
  return EVAL_SUITE_IDS.filter(
    (suiteId) => !judges.some((item) => evaluatorAppliesToSuite(item, suiteId)),
  );
}

function judgeFor(suiteId: EvalSuiteId): Evaluator {
  const name = EVAL_SUITE_LABELS[suiteId];
  return {
    id: judgeIdForSuite(suiteId),
    kind: "llm",
    name: `${name} judge`,
    description: `LLM-as-judge for the ${name} agent only.`,
    enabled: true,
    builtin: true,
    suiteIds: [suiteId],
    config: {
      passThreshold: 0.7,
      prompt: `${DEFAULT_LLM_PROMPT}\n\n${AGENT_JUDGE_FOCUS[suiteId]}`,
    },
  };
}

export function defaultEvaluators(): Evaluator[] {
  return [
    {
      id: "code-scaffold",
      kind: "code",
      name: "Code scaffold",
      description:
        "Deterministic checks: routing labels, required tools, must / must-not phrases.",
      enabled: true,
      builtin: true,
      suiteIds: [],
      config: { passThreshold: 0.7 },
    },
    ...EVAL_SUITE_IDS.map(judgeFor),
  ];
}

export function parseEvaluator(value: unknown): Evaluator {
  if (!value || typeof value !== "object") throw new Error("Evaluator is required.");
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || !raw.id.trim()) throw new Error("id is required.");
  if (!EVALUATOR_KINDS.includes(raw.kind as EvaluatorKind)) {
    throw new Error("kind must be code or llm.");
  }
  if (typeof raw.name !== "string" || !raw.name.trim()) throw new Error("name is required.");
  const config =
    raw.config && typeof raw.config === "object" ? (raw.config as Evaluator["config"]) : {};
  const threshold =
    typeof config.passThreshold === "number" && Number.isFinite(config.passThreshold)
      ? Math.min(1, Math.max(0, config.passThreshold))
      : 0.7;
  return {
    id: raw.id.trim(),
    kind: raw.kind as EvaluatorKind,
    name: raw.name.trim(),
    description: typeof raw.description === "string" ? raw.description : "",
    enabled: raw.enabled !== false,
    builtin: raw.builtin === true,
    suiteIds: parseSuiteIds(raw.suiteIds),
    config: {
      passThreshold: threshold,
      prompt: typeof config.prompt === "string" ? config.prompt : undefined,
    },
  };
}
