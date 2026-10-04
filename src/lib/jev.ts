const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const JEV_TIMEOUT_MS = 4_000;
const DEFAULT_JEV_MODEL = "jev-1.13.0";

export type JevChoiceQuestion = {
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
};

export type JevScoreQuestion = {
  type: "score";
  instructions: string;
  criteria: string[];
};

export type JevNoulQuestion = {
  type: "noul";
  instructions: string;
};

export type JevQuestion = JevChoiceQuestion | JevScoreQuestion | JevNoulQuestion;

export type JevChoiceAnswer = {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};

export type JevScoreAnswer = {
  type: "score";
  score: number;
  confidence: number;
  legend?: Record<string, string>;
  probabilities?: Record<string, number>;
};

export type JevNoulAnswer = {
  type: "noul";
  noul: number;
};

export type JevAnswer = JevChoiceAnswer | JevScoreAnswer | JevNoulAnswer;

export type JevResponse = {
  model: string;
  answers: Record<string, JevAnswer>;
  usage?: { inputTokens?: number; outputTokens?: number };
};

function readEnv(name: string) {
  const raw = process.env[name];
  if (!raw) return "";
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
  return value;
}

export function readTypesafeKey() {
  return readEnv("TYPESAFE_API_KEY");
}

export function isJevConfigured() {
  return Boolean(readTypesafeKey());
}

export function getJevModelId() {
  return readEnv("TYPESAFE_MODEL") || DEFAULT_JEV_MODEL;
}

export function asChoice(answer: JevAnswer | undefined): JevChoiceAnswer | null {
  if (!answer || answer.type !== "choice") return null;
  if (typeof answer.choice !== "string" || !answer.choice) return null;
  const confidence = Number(answer.confidence);
  if (!Number.isFinite(confidence)) return null;
  return {
    type: "choice",
    choice: answer.choice,
    confidence: clamp01(confidence),
    probabilities: answer.probabilities ?? {},
  };
}

export function asScore(answer: JevAnswer | undefined): JevScoreAnswer | null {
  if (!answer || answer.type !== "score") return null;
  const score = Number(answer.score);
  const confidence = Number(answer.confidence);
  if (!Number.isFinite(score)) return null;
  return {
    type: "score",
    score,
    confidence: Number.isFinite(confidence) ? clamp01(confidence) : 0,
    legend: answer.legend,
    probabilities: answer.probabilities,
  };
}

export function asNoul(answer: JevAnswer | undefined): JevNoulAnswer | null {
  if (!answer || answer.type !== "noul") return null;
  const noul = Number(answer.noul);
  if (!Number.isFinite(noul)) return null;
  return { type: "noul", noul: clamp01(noul) };
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function parseJevResponse(payload: unknown): JevResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Jev returned an empty payload.");
  }
  const data = payload as {
    model?: unknown;
    answers?: unknown;
    usage?: { input_tokens?: unknown; output_tokens?: unknown };
  };
  if (!data.answers || typeof data.answers !== "object") {
    throw new Error("Jev returned no answers.");
  }
  return {
    model: typeof data.model === "string" ? data.model : getJevModelId(),
    answers: data.answers as Record<string, JevAnswer>,
    usage: {
      inputTokens:
        typeof data.usage?.input_tokens === "number" ? data.usage.input_tokens : undefined,
      outputTokens:
        typeof data.usage?.output_tokens === "number" ? data.usage.output_tokens : undefined,
    },
  };
}

export async function decideWithJev(options: {
  state: string | Record<string, unknown> | string[];
  questions: Record<string, JevQuestion>;
}): Promise<JevResponse | null> {
  const apiKey = readTypesafeKey();
  if (!apiKey) return null;

  const response = await fetch(JEV_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getJevModelId(),
      state: options.state,
      questions: options.questions,
    }),
    signal: AbortSignal.timeout(JEV_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Jev request failed with ${response.status}.`);
  }

  return parseJevResponse(await response.json());
}
