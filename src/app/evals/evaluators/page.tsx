import { EvalEvaluatorsDesk } from "@/components/eval-evaluators-desk";
import { listEvaluators, refreshEvaluators } from "@/evals/evaluators";

export default async function EvalEvaluatorsPage() {
  await refreshEvaluators();
  return <EvalEvaluatorsDesk initial={listEvaluators()} />;
}
