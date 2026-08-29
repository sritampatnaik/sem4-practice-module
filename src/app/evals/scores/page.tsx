import { EvalScoresDesk } from "@/components/eval-scores-desk";
import { listEvalSuites, refreshEvalCatalog } from "@/evals";
import { getLastEvalRun, listEvalRunRecords, refreshEvalHistory } from "@/evals/store";
import { getModelId } from "@/lib/llm";

export default async function EvalScoresPage() {
  await refreshEvalHistory();
  await refreshEvalCatalog();
  return (
    <EvalScoresDesk
      initial={{
        model: getModelId(),
        suites: listEvalSuites(),
        lastRun: getLastEvalRun(),
        history: listEvalRunRecords(),
      }}
    />
  );
}
