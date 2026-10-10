import { listGuardrailAlerts } from "@/agents/guardrail";
import { AdminAlertsDesk } from "@/components/admin-alerts-desk";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  const alerts = await listGuardrailAlerts();
  return <AdminAlertsDesk initialAlerts={alerts} />;
}
