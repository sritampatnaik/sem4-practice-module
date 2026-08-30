import type { ChatMemoryItem, StudentProfile } from "@/agents/_shared/types";
import { getSupabaseAdmin } from "./supabase";
import { upsertStudentSession } from "./students";

const MEMORY_LIMIT = 10;
const sessions = new Map<string, ChatMemoryItem[]>();

function fallback(sessionId: string) {
  return sessions.get(sessionId)?.slice(-MEMORY_LIMIT) ?? [];
}

export async function getRecentChats(sessionId: string): Promise<ChatMemoryItem[]> {
  const supabase = getSupabaseAdmin();
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
) {
  const current = fallback(sessionId);
  current.push(item);
  sessions.set(sessionId, current.slice(-MEMORY_LIMIT));

  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const userId = /^[0-9a-f-]{36}$/i.test(sessionId) ? sessionId : undefined;
  if (profile) {
    await upsertStudentSession(sessionId, profile, userId);
  } else {
    await upsertStudentSession(
      sessionId,
      {
        name: "Student",
        gradeLevel: "secondary",
        grade: "sec3",
        diagnostic: {},
        notes: [],
      },
      userId,
    );
  }
  await supabase.from("chat_memory").insert({
    session_id: sessionId,
    role: item.role,
    text: item.text,
    agent: item.agent ?? null,
    at: item.at,
  });
}

export function previewText(text: string, max = 280) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1)}…`;
}
