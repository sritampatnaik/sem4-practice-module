import type { ChatMemoryItem } from "@/agents/_shared/types";

const MEMORY_LIMIT = 10;
const sessions = new Map<string, ChatMemoryItem[]>();

export function getRecentChats(sessionId: string): ChatMemoryItem[] {
  return sessions.get(sessionId)?.slice(-MEMORY_LIMIT) ?? [];
}

export function rememberTurn(sessionId: string, item: ChatMemoryItem) {
  const current = sessions.get(sessionId) ?? [];
  current.push(item);
  sessions.set(sessionId, current.slice(-MEMORY_LIMIT));
}

export function previewText(text: string, max = 280) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1)}…`;
}
