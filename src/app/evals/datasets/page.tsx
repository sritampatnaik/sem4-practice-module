import { EvalDatasetDesk } from "@/components/eval-dataset-desk";
import { listEvalSuites, refreshEvalCatalog } from "@/evals";
import { getLastEvalRun, refreshEvalHistory } from "@/evals/store";

export default async function EvalDatasetsPage() {
  await refreshEvalHistory();
  await refreshEvalCatalog();
  return (
    <EvalDatasetDesk
      initial={{
        suites: listEvalSuites(),
        lastRun: getLastEvalRun(),
      }}
    />
  );
}
