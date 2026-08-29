import { listEvalSuites, refreshEvalCatalog } from "@/evals";
import { listEvaluators, refreshEvaluators } from "@/evals/evaluators";
import { getLastEvalRun, listEvalRunRecords, refreshEvalHistory } from "@/evals/store";
import { getModelId } from "@/lib/llm";
import { EVAL_MODELS } from "@/lib/models";

export async function GET() {
  await refreshEvalHistory();
  await refreshEvalCatalog();
  await refreshEvaluators();
  return Response.json({
    model: getModelId(),
    models: EVAL_MODELS,
    suites: listEvalSuites(),
    lastRun: getLastEvalRun(),
    history: listEvalRunRecords(),
    evaluators: listEvaluators(),
  });
}
