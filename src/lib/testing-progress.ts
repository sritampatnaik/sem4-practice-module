import type { Subject } from "@/agents/_shared/types";
import {
  buildTestingTopicKey,
  buildTestingTopicLabel,
  normaliseAttemptTopics,
  summariseTestingAttempts,
  type TestingAttemptRecord,
} from "@/agents/testing/score-history";
import type { TestingMode } from "@/agents/testing/assessment-planner";
import type { Json } from "./database.types";
import { getSupabaseAdmin, getSupabaseData } from "./supabase";

type TestingAttemptRow = {
  id: string;
  user_id: string;
  conversation_id: string;
  subject: Subject;
  mode: TestingMode;
  topic_key: string;
  topic_label: string;
  title: string;
  score: number;
  total_questions: number;
  topics: Json;
  completed_at: string;
  created_at: string;
};

export type RecordTestingAttemptInput = {
  userId: string;
  conversationId: string;
  subject: Subject;
  mode: TestingMode;
  title: string;
  score: number;
  totalQuestions: number;
  topics: string[];
};

function getTestingProgressClient(accessToken?: string) {
  return getSupabaseData(accessToken) ?? getSupabaseAdmin();
}

function mapAttemptRow(row: TestingAttemptRow): TestingAttemptRecord {
  return {
    id: row.id,
    userId: row.user_id,
    conversationId: row.conversation_id,
    subject: row.subject,
    mode: row.mode,
    topicKey: row.topic_key,
    topicLabel: row.topic_label,
    title: row.title,
    score: row.score,
    totalQuestions: row.total_questions,
    completedAt: row.completed_at,
    topics: Array.isArray(row.topics)
      ? row.topics.filter((topic): topic is string => typeof topic === "string")
      : [],
  };
}

export async function verifyConversationOwnership(
  conversationId: string,
  userId: string,
  accessToken?: string,
) {
  const supabase = getTestingProgressClient(accessToken);
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && Boolean(data?.id);
}

export async function recordTestingAttempt(
  input: RecordTestingAttemptInput,
  accessToken?: string,
) {
  const supabase = getTestingProgressClient(accessToken);
  if (!supabase) {
    return {
      ok: false as const,
      reason: "unconfigured",
    };
  }

  const topics = normaliseAttemptTopics(input.topics);
  const topicKey = buildTestingTopicKey({ topics, title: input.title });
  const topicLabel = buildTestingTopicLabel({ topics, title: input.title });
  const completedAt = new Date().toISOString();

  const payload = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    conversation_id: input.conversationId,
    subject: input.subject,
    mode: input.mode,
    topic_key: topicKey,
    topic_label: topicLabel,
    title: input.title.trim(),
    score: input.score,
    total_questions: input.totalQuestions,
    topics,
    completed_at: completedAt,
  };

  const { data, error } = await supabase
    .from("testing_attempts")
    .insert(payload)
    .select(
      "id, user_id, conversation_id, subject, mode, topic_key, topic_label, title, score, total_questions, topics, completed_at, created_at",
    )
    .single();

  if (error || !data) {
    return {
      ok: false as const,
      reason: error?.message ?? "Could not save the testing attempt.",
    };
  }

  return {
    ok: true as const,
    attempt: mapAttemptRow(data as TestingAttemptRow),
  };
}

export async function listTestingAttemptSummaries(
  userId: string,
  accessToken?: string,
  limit = 6,
) {
  const supabase = getTestingProgressClient(accessToken);
  if (!supabase) return { ok: false as const, reason: "unconfigured", summaries: [] };

  const { data, error } = await supabase
    .from("testing_attempts")
    .select(
      "id, user_id, conversation_id, subject, mode, topic_key, topic_label, title, score, total_questions, topics, completed_at, created_at",
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(Math.max(limit * 10, 30));

  if (error || !data) {
    return {
      ok: false as const,
      reason: error?.message ?? "Could not load testing progress.",
      summaries: [],
    };
  }

  const summaries = summariseTestingAttempts((data as TestingAttemptRow[]).map(mapAttemptRow)).slice(0, limit);
  return { ok: true as const, summaries };
}
