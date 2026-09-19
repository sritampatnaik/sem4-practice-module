import { listGuardrailAlerts } from "@/agents/guardrail";
import { AdminAlertsDesk } from "@/components/admin-alerts-desk";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  const alerts = await listGuardrailAlerts();
  const bypass =
    process.env.NODE_ENV !== "production" && process.env.METS_ADMIN_DEV === "1";
  return <AdminAlertsDesk initialAlerts={alerts} developmentBypass={bypass} />;
}
