import { langflowHealth } from "@/lib/langflow";
import { listPromptLogs, listRouting } from "@/lib/traces";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") ?? undefined;
  const health = await langflowHealth();

  return Response.json({
    langflow: health,
    routing: sessionId ? listRouting(sessionId) : [],
    logs: listPromptLogs(sessionId),
  });
}
