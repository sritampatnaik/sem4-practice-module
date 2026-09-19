"use client";

import { useEffect, useMemo, useState } from "react";
import type { GuardrailAlert } from "@/agents/guardrail/types";
import { ValuePill } from "@/components/atoms/ValuePill";
import { Button } from "@/components/ui/button";

function severityTone(severity: GuardrailAlert["severity"]): "neutral" | "orange" | "red" {
  if (severity === "critical" || severity === "high") return "red";
  if (severity === "medium") return "orange";
  return "neutral";
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminAlertsDesk({
  initialAlerts,
  developmentBypass = false,
}: {
  initialAlerts: GuardrailAlert[];
  developmentBypass?: boolean;
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/alerts")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { alerts?: GuardrailAlert[] } | null) => {
        if (cancelled || !payload?.alerts) return;
        setAlerts(payload.alerts);
      })
      .catch(() => {
        /* Keep the server-rendered list if refresh fails. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openCount = useMemo(
    () => alerts.filter((alert) => !alert.acknowledgedAt).length,
    [alerts],
  );

  async function acknowledge(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/alerts/${id}`, { method: "PATCH" });
      if (!response.ok) throw new Error("Could not acknowledge that alert.");
      const payload = (await response.json()) as { alert?: GuardrailAlert };
      if (!payload.alert) throw new Error("Could not acknowledge that alert.");
      setAlerts((current) =>
        current.map((item) => (item.id === payload.alert?.id ? payload.alert : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not acknowledge that alert.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
      <p className="ui-label">Parents and tutors</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Safety alerts</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-2">
        The guardrail watches student–tutor chat in the background. Students never
        see this agent or this page. On disappointment, distress, or self-harm it
        stores an alert and emails a parent or tutor when an address is configured.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ValuePill tone={openCount ? "red" : "green"}>
          {openCount} open · {alerts.length} total
        </ValuePill>
        {developmentBypass ? (
          <ValuePill tone="orange">Local staff bypass</ValuePill>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-red">{error}</p> : null}

      {alerts.length === 0 ? (
        <div className="ui-inset mt-8 px-5 py-6">
          <p className="text-sm text-ink-2">
            No alerts yet. Flagged turns will appear here after the specialist
            reply, without changing what the student sees.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {alerts.map((alert) => (
            <li key={alert.id} className="ui-card px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <ValuePill tone={severityTone(alert.severity)}>{alert.severity}</ValuePill>
                {alert.categories.map((category) => (
                  <ValuePill key={category} tone="neutral">
                    {category.replace("_", "-")}
                  </ValuePill>
                ))}
                {alert.acknowledgedAt ? (
                  <ValuePill tone="green">acknowledged</ValuePill>
                ) : (
                  <ValuePill tone="orange">open</ValuePill>
                )}
              </div>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">
                {alert.studentName}
              </h2>
              <p className="mt-1 text-xs text-ink-3">
                {formatWhen(alert.createdAt)}
                {alert.studentEmail ? ` · ${alert.studentEmail}` : ""}
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-2">{alert.reason}</p>
              <blockquote className="ui-inset mt-3 px-4 py-3 text-sm leading-6">
                {alert.snippet}
              </blockquote>
              <p className="mt-3 text-xs text-ink-3">
                {alert.notifiedEmail
                  ? `Emailed ${alert.notifiedEmail}`
                  : "In-app only — add METS_PARENT_NOTIFY_EMAIL or parent_email, plus Resend, to send mail."}
              </p>
              {alert.acknowledgedAt ? (
                <p className="mt-3 text-xs text-ink-3">
                  Acknowledged {formatWhen(alert.acknowledgedAt)}
                  {alert.acknowledgedBy ? ` by ${alert.acknowledgedBy}` : ""}
                </p>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  disabled={busyId === alert.id}
                  onClick={() => void acknowledge(alert.id)}
                >
                  {busyId === alert.id ? "Saving" : "Acknowledge"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
