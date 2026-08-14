import type { PromptLogEntry, RoutingDecision } from "@/agents/_shared/types";

const MAX_ENTRIES = 200;
const entries: PromptLogEntry[] = [];
const routingBySession = new Map<string, RoutingDecision[]>();

export function recordPromptLog(entry: PromptLogEntry) {
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }
}

export function recordRouting(sessionId: string, decision: RoutingDecision) {
  const current = routingBySession.get(sessionId) ?? [];
  current.unshift(decision);
  routingBySession.set(sessionId, current.slice(0, 40));
}

export function listPromptLogs(sessionId?: string) {
  if (!sessionId) return entries.slice(0, 80);
  return entries.filter((entry) => entry.sessionId === sessionId).slice(0, 80);
}

export function listRouting(sessionId: string) {
  return routingBySession.get(sessionId) ?? [];
}

export function newLogId() {
  return `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
