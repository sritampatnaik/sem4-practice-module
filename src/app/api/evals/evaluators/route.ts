import {
  listEvaluators,
  refreshEvaluators,
  removeEvaluator,
  saveEvaluators,
  upsertEvaluator,
} from "@/evals/evaluators";

export async function GET() {
  await refreshEvaluators();
  return Response.json({ evaluators: listEvaluators() });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { evaluators?: unknown; evaluator?: unknown };
    if (Array.isArray(body.evaluators)) {
      return Response.json({ evaluators: await saveEvaluators(body.evaluators) });
    }
    if (body.evaluator) {
      return Response.json({ evaluators: await upsertEvaluator(body.evaluator) });
    }
    return Response.json({ error: "evaluators or evaluator is required." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save evaluators.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required." }, { status: 400 });
    return Response.json({ evaluators: await removeEvaluator(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete evaluator.";
    return Response.json({ error: message }, { status: 400 });
  }
}
