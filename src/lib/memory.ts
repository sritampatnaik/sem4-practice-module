import type { ChatMemoryItem, StudentProfile } from "@/agents/_shared/types";
import { ensureConversation, nextTitle, touchConversation } from "./conversations";
import { storeChatEmbedding } from "./embeddings";
import { getSupabaseData } from "./supabase";
import { upsertStudentSession } from "./students";

const MEMORY_LIMIT = 10;
const sessions = new Map<string, ChatMemoryItem[]>();

function fallback(sessionId: string) {
  return sessions.get(sessionId)?.slice(-MEMORY_LIMIT) ?? [];
}

export async function getRecentChats(
  sessionId: string,
  accessToken?: string,
): Promise<ChatMemoryItem[]> {
  const supabase = getSupabaseData(accessToken);
  if (supabase) {
    const { data, error } = await supabase
      .from("chat_memory")
      .select("role, text, agent, at")
      .eq("session_id", sessionId)
      .order("at", { ascending: false })
      .limit(MEMORY_LIMIT);
    if (!error && data) {
      return data
        .slice()
        .reverse()
        .map((row) => ({
          role: row.role as ChatMemoryItem["role"],
          text: row.text,
          agent: row.agent as ChatMemoryItem["agent"],
          at: row.at,
        }));
    }
  }
  return fallback(sessionId);
}

export async function rememberTurn(
  sessionId: string,
  item: ChatMemoryItem,
  profile?: StudentProfile,
  userId?: string,
  accessToken?: string,
) {
  const current = fallback(sessionId);
  current.push(item);
  sessions.set(sessionId, current.slice(-MEMORY_LIMIT));

  const supabase = getSupabaseData(accessToken);
  if (!supabase || !userId) return;

  await ensureConversation(sessionId, userId, accessToken);
  if (profile) {
    await upsertStudentSession(userId, profile, userId, accessToken);
  }
  if (item.role === "user") {
    const owned = await supabase
      .from("conversations")
      .select("title")
      .eq("id", sessionId)
      .maybeSingle();
    await touchConversation(sessionId, {
      title: nextTitle(owned.data?.title ?? "New chat", item.text),
      accessToken,
    });
  } else {
    await touchConversation(sessionId, { accessToken });
  }

  await supabase.from("chat_memory").insert({
    session_id: sessionId,
    role: item.role,
    text: item.text,
    agent: item.agent ?? null,
    at: item.at,
  });
  await storeChatEmbedding({
    conversationId: sessionId,
    userId,
    text: item.text,
    accessToken,
  });
}

export function previewText(text: string, max = 280) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1)}…`;
}
