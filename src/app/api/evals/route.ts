import { listEvalSuites } from "@/evals";
import { getLastEvalRun, listEvalRunRecords, refreshEvalHistory } from "@/evals/store";
import { getModelId } from "@/lib/llm";

export async function GET() {
  refreshEvalHistory();
  return Response.json({
    model: getModelId(),
    suites: listEvalSuites(),
    lastRun: getLastEvalRun(),
    history: listEvalRunRecords(),
  });
}
