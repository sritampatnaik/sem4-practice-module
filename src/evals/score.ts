import type { EvalCheck, EvalItem, EvalItemResult, GoldRouting } from "./types";

function haystack(text: string) {
  return text.toLowerCase();
}

function includesPhrase(text: string, phrase: string) {
  return haystack(text).includes(phrase.toLowerCase());
}

function routingScore(expected: GoldRouting, actual?: GoldRouting) {
  const fields: Array<keyof GoldRouting> = ["agent", "intent", "subject"];
  const checks: EvalCheck[] = fields.map((field) => {
    const passed = actual?.[field] === expected[field];
    return {
      name: field,
      passed,
      detail: `expected ${expected[field]}, got ${actual?.[field] ?? "missing"}`,
    };
  });
  const hits = checks.filter((check) => check.passed).length;
  return { score: hits / fields.length, checks };
}

function phraseScore(text: string, phrases: string[], label: string, invert = false) {
  const checks: EvalCheck[] = phrases.map((phrase) => {
    const found = includesPhrase(text, phrase);
    const passed = invert ? !found : found;
    return {
      name: `${label}:${phrase}`,
      passed,
      detail: invert
        ? found
          ? `forbidden phrase present: ${phrase}`
          : `correctly avoided: ${phrase}`
        : found
          ? `found: ${phrase}`
          : `missing: ${phrase}`,
    };
  });
  const hits = checks.filter((check) => check.passed).length;
  return { score: phrases.length ? hits / phrases.length : 1, checks };
}

export function scoreAgainstScaffold(options: {
  item: EvalItem;
  actualText: string;
  toolCalls: string[];
  actualRouting?: GoldRouting;
}): { accuracy: number; passed: boolean; checks: EvalCheck[] } {
  const { item, actualText, toolCalls, actualRouting } = options;
  const combined = `${actualText}\n${toolCalls.join(" ")}`;

  if (item.kind === "routing" && item.scaffold.routing) {
    const routed = routingScore(item.scaffold.routing, actualRouting);
    return {
      accuracy: routed.score,
      passed: routed.score === 1,
      checks: routed.checks,
    };
  }

  const must = phraseScore(combined, item.scaffold.mustInclude ?? [], "must");
  const mustNot = phraseScore(combined, item.scaffold.mustNotInclude ?? [], "mustNot", true);
  const required = item.scaffold.requiredTools ?? [];
  const toolChecks: EvalCheck[] = required.map((tool) => ({
    name: `tool:${tool}`,
    passed: toolCalls.includes(tool),
    detail: toolCalls.includes(tool) ? `called ${tool}` : `missing tool ${tool}`,
  }));
  const toolScore = required.length
    ? toolChecks.filter((check) => check.passed).length / required.length
    : 1;

  let accuracy: number;
  if (item.kind === "testing") {
    const widgetOk = required.length ? toolScore : 1;
    accuracy = required.length
      ? 0.55 * widgetOk + 0.25 * must.score + 0.2 * mustNot.score
      : 0.7 * must.score + 0.3 * mustNot.score;
  } else if (item.kind === "concierge") {
    accuracy = 0.6 * must.score + 0.4 * mustNot.score;
  } else {
    accuracy = 0.45 * must.score + 0.35 * toolScore + 0.2 * mustNot.score;
  }

  const checks = [...must.checks, ...mustNot.checks, ...toolChecks];
  const passed = item.kind === "testing" ? toolScore === 1 && accuracy >= 0.7 : accuracy >= 0.7;
  return { accuracy: Number(accuracy.toFixed(3)), passed, checks };
}

export function passThreshold(result: Pick<EvalItemResult, "kind" | "accuracy" | "passed">) {
  return result.passed;
}
