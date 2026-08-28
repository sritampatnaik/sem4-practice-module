import { EvalsDesk } from "@/components/evals-desk";
import { listEvalSuites } from "@/evals";
import {
  getLastEvalRun,
  listEvalRunRecords,
  refreshEvalHistory,
} from "@/evals/store";
import { getModelId } from "@/lib/llm";

export default function EvalsPage() {
  refreshEvalHistory();
  return (
    <EvalsDesk
      initial={{
        model: getModelId(),
        suites: listEvalSuites(),
        lastRun: getLastEvalRun(),
        history: listEvalRunRecords(),
      }}
    />
  );
}
