import { EVAL_SUITE_IDS } from "@/evals/types";
import { runEvalSuites } from "@/evals/runner";
import { saveEvalRun } from "@/evals/store";
import type { EvalSuiteId } from "@/evals/types";

export const maxDuration = 300;

function asSuiteIds(value: unknown): EvalSuiteId[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const ids = value.filter((item): item is EvalSuiteId =>
    EVAL_SUITE_IDS.includes(item as EvalSuiteId),
  );
  return ids.length ? ids : undefined;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    suiteIds?: unknown;
    suiteId?: unknown;
  };
  const suiteIds =
    asSuiteIds(body.suiteIds) ??
    (typeof body.suiteId === "string" ? asSuiteIds([body.suiteId]) : undefined);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        for await (const event of runEvalSuites({ suiteIds })) {
          if (event.type === "done") {
            saveEvalRun(event.run);
          }
          write(event.type, event);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Eval run failed.";
        write("error", { error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
