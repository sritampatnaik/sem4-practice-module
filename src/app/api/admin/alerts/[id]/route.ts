import { acknowledgeGuardrailAlert, getAdminAccess } from "@/agents/guardrail";

export const dynamic = "force-dynamic";

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccess();
  if (!access.ok) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "Alert id is required." }, { status: 400 });
  }
  const by = access.user.email;
  const alert = await acknowledgeGuardrailAlert(id, by);
  if (!alert) {
    return Response.json({ error: "Alert not found." }, { status: 404 });
  }
  return Response.json({ alert });
}
