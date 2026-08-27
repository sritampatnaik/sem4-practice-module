/** Published OpenAI list prices (USD per 1M tokens), used for eval cost estimates. */
const RATES: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
};

export function estimateCostUsd(options: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const rates = RATES[options.model] ?? RATES["gpt-4o"];
  return (
    (options.inputTokens * rates.input + options.outputTokens * rates.output) /
    1_000_000
  );
}

export function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}
