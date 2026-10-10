import { getAdminAccess, listGuardrailAlerts } from "@/agents/guardrail";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAdminAccess();
  if (!access.ok) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  const alerts = await listGuardrailAlerts();
  return Response.json({ alerts });
}
