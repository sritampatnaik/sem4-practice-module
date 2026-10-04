import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { GUARDRAIL_CATEGORIES, type GuardrailAlert, type GuardrailCategory } from "./types";

type AlertRow = Database["public"]["Tables"]["guardrail_alerts"]["Row"];

const globalAlerts = globalThis as typeof globalThis & {
  __metsGuardrailAlerts?: GuardrailAlert[];
};
if (!globalAlerts.__metsGuardrailAlerts) {
  globalAlerts.__metsGuardrailAlerts = [];
}
const memory = globalAlerts.__metsGuardrailAlerts;
const DEDUPE_MS = 2 * 60 * 1000;

function asUuid(value: string | null | undefined) {
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

function newId() {
  return `gr_${randomUUID()}`;
}

function asCategories(value: string[] | null | undefined): GuardrailCategory[] {
  if (!value) return [];
  return value.filter((item): item is GuardrailCategory =>
    GUARDRAIL_CATEGORIES.includes(item as GuardrailCategory),
  );
}

function fromRow(row: AlertRow): GuardrailAlert {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    studentName: row.student_name,
    studentEmail: row.student_email,
    snippet: row.snippet,
    reason: row.reason,
    categories: asCategories(row.categories),
    severity: row.severity as GuardrailAlert["severity"],
    promptVersion: row.prompt_version,
    notifiedEmail: row.notified_email,
    notifiedAt: row.notified_at,
    acknowledgedAt: row.acknowledged_at,
    acknowledgedBy: row.acknowledged_by,
    createdAt: row.created_at,
  };
}

function isFreshDuplicate(alert: Pick<GuardrailAlert, "sessionId" | "snippet" | "createdAt">) {
  const created = Date.parse(alert.createdAt);
  return memory.some(
    (item) =>
      item.sessionId === alert.sessionId &&
      item.snippet === alert.snippet &&
      Math.abs(Date.parse(item.createdAt) - created) < DEDUPE_MS,
  );
}

export async function lookupParentEmail(options: {
  userId?: string;
  sessionId?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  if (options.userId) {
    const byUser = await supabase
      .from("student_sessions")
      .select("parent_email")
      .eq("user_id", options.userId)
      .maybeSingle();
    if (!byUser.error && byUser.data?.parent_email) return byUser.data.parent_email;
  }
  if (options.sessionId) {
    const bySession = await supabase
      .from("student_sessions")
      .select("parent_email")
      .eq("id", options.sessionId)
      .maybeSingle();
    if (!bySession.error && bySession.data?.parent_email) {
      return bySession.data.parent_email;
    }
  }
  return null;
}

export async function storeGuardrailAlert(
  input: Omit<GuardrailAlert, "id" | "createdAt" | "notifiedEmail" | "notifiedAt" | "acknowledgedAt" | "acknowledgedBy"> & {
    createdAt?: string;
  },
): Promise<GuardrailAlert> {
  const alert: GuardrailAlert = {
    ...input,
    id: newId(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    notifiedEmail: null,
    notifiedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const recent = await supabase
      .from("guardrail_alerts")
      .select("id, created_at, snippet, session_id")
      .eq("session_id", alert.sessionId)
      .eq("snippet", alert.snippet)
      .gte("created_at", new Date(Date.parse(alert.createdAt) - DEDUPE_MS).toISOString())
      .limit(1)
      .maybeSingle();
    if (!recent.error && recent.data) {
      const existing = await supabase
        .from("guardrail_alerts")
        .select("*")
        .eq("id", recent.data.id)
        .maybeSingle();
      if (!existing.error && existing.data) return fromRow(existing.data);
    }

    const inserted = await supabase
      .from("guardrail_alerts")
      .insert({
        id: alert.id,
        session_id: alert.sessionId,
        user_id: asUuid(alert.userId),
        student_name: alert.studentName,
        student_email: alert.studentEmail,
        snippet: alert.snippet,
        reason: alert.reason,
        categories: alert.categories,
        severity: alert.severity,
        prompt_version: alert.promptVersion,
      })
      .select("*")
      .maybeSingle();
    if (!inserted.error && inserted.data) {
      const stored = fromRow(inserted.data);
      memory.unshift(stored);
      return stored;
    }
  }

  if (isFreshDuplicate(alert)) {
    return (
      memory.find(
        (item) => item.sessionId === alert.sessionId && item.snippet === alert.snippet,
      ) ?? alert
    );
  }
  memory.unshift(alert);
  return alert;
}

export async function markAlertNotified(id: string, email: string) {
  const notifiedAt = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase
      .from("guardrail_alerts")
      .update({ notified_email: email, notified_at: notifiedAt })
      .eq("id", id);
  }
  const current = memory.find((item) => item.id === id);
  if (current) {
    current.notifiedEmail = email;
    current.notifiedAt = notifiedAt;
  }
}

export async function listGuardrailAlerts(): Promise<GuardrailAlert[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("guardrail_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) return data.map(fromRow);
  }
  return memory.slice(0, 100);
}

export async function acknowledgeGuardrailAlert(id: string, by: string) {
  const acknowledgedAt = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("guardrail_alerts")
      .update({ acknowledged_at: acknowledgedAt, acknowledged_by: by })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (!error && data) {
      const stored = fromRow(data);
      const index = memory.findIndex((item) => item.id === id);
      if (index >= 0) memory[index] = stored;
      else memory.unshift(stored);
      return stored;
    }
  }
  const current = memory.find((item) => item.id === id);
  if (!current) return null;
  current.acknowledgedAt = acknowledgedAt;
  current.acknowledgedBy = by;
  return current;
}

export function resetGuardrailMemoryForTests() {
  memory.length = 0;
}
