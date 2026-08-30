import { refreshEvaluators } from "@/evals/evaluators";
import { parseEvalJobs } from "@/evals/jobs";
import { runEvalSuites } from "@/evals/runner";
import { saveEvalRun } from "@/evals/store";
import { requireProviderKey } from "@/lib/llm";

export const maxDuration = 600;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    jobs?: unknown;
    suiteIds?: unknown;
    suiteId?: unknown;
    model?: unknown;
  };
  const jobs = parseEvalJobs(body);
  const models = [...new Set(jobs.map((job) => job.model))];
  try {
    for (const model of models) requireProviderKey(model);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Model API key is missing." },
      { status: 500 },
    );
  }

  await refreshEvaluators();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        for await (const event of runEvalSuites({ jobs })) {
          if (event.type === "done") {
            await saveEvalRun(event.run);
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
