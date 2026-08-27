import { listEvalSuites } from "@/evals";
import { getLastEvalRun } from "@/evals/store";

export async function GET() {
  return Response.json({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
    suites: listEvalSuites(),
    lastRun: getLastEvalRun(),
  });
}
