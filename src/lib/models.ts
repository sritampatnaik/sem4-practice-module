export const MODEL_PROVIDERS = ["openai", "google"] as const;
export type ModelProvider = (typeof MODEL_PROVIDERS)[number];

export type EvalModelOption = {
  id: string;
  provider: ModelProvider;
  label: string;
};

export const EVAL_MODELS: EvalModelOption[] = [
  { id: "gpt-4o", provider: "openai", label: "GPT-4o" },
  { id: "gpt-4o-mini", provider: "openai", label: "GPT-4o mini" },
  { id: "gpt-4.1", provider: "openai", label: "GPT-4.1" },
  { id: "gpt-4.1-mini", provider: "openai", label: "GPT-4.1 mini" },
  { id: "gemini-2.5-flash", provider: "google", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", provider: "google", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.5-flash-lite", provider: "google", label: "Gemini 2.5 Flash-Lite" },
];

export const DEFAULT_EVAL_MODEL_ID = "gpt-4o";

export function findEvalModel(id: string | null | undefined) {
  return EVAL_MODELS.find((model) => model.id === id) ?? null;
}

export function resolveEvalModel(id: unknown): EvalModelOption {
  if (typeof id === "string") {
    const match = findEvalModel(id.trim());
    if (match) return match;
  }
  return findEvalModel(DEFAULT_EVAL_MODEL_ID) ?? EVAL_MODELS[0]!;
}

export function modelsByProvider() {
  return MODEL_PROVIDERS.map((provider) => ({
    provider,
    label: provider === "openai" ? "OpenAI" : "Google",
    models: EVAL_MODELS.filter((model) => model.provider === provider),
  }));
}
