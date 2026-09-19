import type { ChatMemoryItem } from "@/agents/_shared/types";
import { titleFromText } from "./chunks";
import { getSupabaseData } from "./supabase";

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

function asConversation(row: {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}): Conversation {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listConversations(userId: string, accessToken?: string) {
  const supabase = getSupabaseData(accessToken);
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map(asConversation);
}

export async function createConversation(
  userId: string,
  options?: { id?: string; title?: string; accessToken?: string },
) {
  const supabase = getSupabaseData(options?.accessToken);
  const conversation: Conversation = {
    id: options?.id ?? crypto.randomUUID(),
    title: options?.title?.trim() || "New chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!supabase) return conversation;
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      id: conversation.id,
      user_id: userId,
      title: conversation.title,
      created_at: conversation.createdAt,
      updated_at: conversation.updatedAt,
    })
    .select("id, title, created_at, updated_at")
    .single();
  if (error || !data) return conversation;
  return asConversation(data);
}

export async function ensureConversation(
  conversationId: string,
  userId: string,
  accessToken?: string,
) {
  const supabase = getSupabaseData(accessToken);
  if (!supabase) return { id: conversationId, title: "New chat", createdAt: "", updatedAt: "" };
  const existing = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.data) return asConversation(existing.data);
  return createConversation(userId, { id: conversationId, accessToken });
}

export async function touchConversation(
  conversationId: string,
  options?: { title?: string; accessToken?: string },
) {
  const supabase = getSupabaseData(options?.accessToken);
  if (!supabase) return;
  const payload: { updated_at: string; title?: string } = {
    updated_at: new Date().toISOString(),
  };
  if (options?.title) payload.title = options.title;
  await supabase.from("conversations").update(payload).eq("id", conversationId);
}

export async function listConversationMessages(
  conversationId: string,
  userId: string,
  accessToken?: string,
): Promise<ChatMemoryItem[]> {
  const supabase = getSupabaseData(accessToken);
  if (!supabase) return [];
  const owned = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!owned.data) return [];
  const { data, error } = await supabase
    .from("chat_memory")
    .select("role, text, agent, at")
    .eq("session_id", conversationId)
    .order("at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    role: row.role as ChatMemoryItem["role"],
    text: row.text,
    agent: row.agent as ChatMemoryItem["agent"],
    at: row.at,
  }));
}

export function nextTitle(current: string, userText: string) {
  if (current && current !== "New chat") return current;
  return titleFromText(userText);
}
