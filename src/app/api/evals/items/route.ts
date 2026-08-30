import {
  addEvalItem,
  listEvalSuites,
  parseCatalogDraft,
  removeEvalItem,
  resetEvalCatalog,
  saveEvalItem,
} from "@/evals/live-catalog";
import { EVAL_SUITE_IDS } from "@/evals/types";
import type { EvalSuiteId } from "@/evals/types";

export async function PUT(req: Request) {
  try {
    const draft = parseCatalogDraft(await req.json());
    const item = await saveEvalItem(draft);
    return Response.json({ item, suites: listEvalSuites() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save eval.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { suiteId?: unknown; reset?: unknown };
    if (body.reset === true) {
      return Response.json({ suites: await resetEvalCatalog() });
    }
    const suiteId = body.suiteId;
    if (typeof suiteId !== "string" || !EVAL_SUITE_IDS.includes(suiteId as EvalSuiteId)) {
      return Response.json({ error: "suiteId is required." }, { status: 400 });
    }
    const item = await addEvalItem(suiteId as EvalSuiteId);
    return Response.json({ item, suites: listEvalSuites() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add eval.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required." }, { status: 400 });
    await removeEvalItem(id);
    return Response.json({ suites: listEvalSuites() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete eval.";
    return Response.json({ error: message }, { status: 400 });
  }
}
