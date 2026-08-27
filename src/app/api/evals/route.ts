import { listEvalRunRecords, listEvalSuites } from "@/evals";
import { getLastEvalRun } from "@/evals/store";
import { getModelId } from "@/lib/llm";

export async function GET() {
  return Response.json({
    model: getModelId(),
    suites: listEvalSuites(),
    lastRun: getLastEvalRun(),
    history: listEvalRunRecords(),
  });
}
