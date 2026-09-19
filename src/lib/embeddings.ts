import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { chunkText } from "./chunks";
import { getSupabaseData } from "./supabase";

const MODEL = "text-embedding-3-small";

function embeddingModel() {
  return openai.embedding(MODEL);
}

export async function storeChatEmbedding(options: {
  conversationId: string;
  userId: string;
  text: string;
  accessToken?: string;
}) {
  const supabase = getSupabaseData(options.accessToken);
  const pieces = chunkText(options.text);
  if (!supabase || !pieces.length || !process.env.OPENAI_API_KEY) return;

  try {
    const { embeddings } = await embedMany({
      model: embeddingModel(),
      values: pieces,
    });
    const rows = pieces.map((content, chunkIndex) => ({
      conversation_id: options.conversationId,
      user_id: options.userId,
      chunk_index: chunkIndex,
      content,
      embedding: embeddings[chunkIndex] as unknown as string,
    }));
    await supabase.from("chat_chunks").insert(rows);
  } catch {
    // Retrieval is an extra; a failed embed must not block the turn.
  }
}

export async function retrieveChatContext(options: {
  userId: string;
  query: string;
  accessToken?: string;
  limit?: number;
}): Promise<string[]> {
  const supabase = getSupabaseData(options.accessToken);
  const query = options.query.trim();
  if (!supabase || !query || !process.env.OPENAI_API_KEY) return [];

  try {
    const { embedding } = await embed({
      model: embeddingModel(),
      value: query,
    });
    const { data, error } = await supabase.rpc("match_chat_chunks", {
      query_embedding: embedding as unknown as string,
      match_count: options.limit ?? 6,
      filter_user_id: options.userId,
    });
    if (error || !data) return [];
    return data
      .map((row) => row.content)
      .filter((content) => content.trim().length > 0);
  } catch {
    return [];
  }
}
