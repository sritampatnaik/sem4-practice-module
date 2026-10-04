import { refreshEvaluators } from "../src/evals/evaluators";
import { allEvalItems, refreshEvalCatalog } from "../src/evals/live-catalog";
import { runEvalItem } from "../src/evals/runner";
import { loadPromptfooEnv } from "./load-env";

type PromptfooContext = {
  vars?: {
    itemId?: string;
  };
};

async function main() {
  loadPromptfooEnv();
  const rawContext = process.argv[4];
  const context = rawContext ? (JSON.parse(rawContext) as PromptfooContext) : {};
  const itemId = context.vars?.itemId;

  if (!itemId) {
    throw new Error("Promptfoo provider expected vars.itemId.");
  }

  await refreshEvalCatalog();
  await refreshEvaluators();

  const item = allEvalItems().find((entry) => entry.id === itemId);
  if (!item) {
    throw new Error(`Unknown eval item '${itemId}'.`);
  }

  const result = await runEvalItem(item);
  process.stdout.write(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
