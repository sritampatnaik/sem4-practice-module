import type { Subject } from "../_shared/types";
import type { TestingMode } from "./assessment-planner";

export type TestingAttemptRecord = {
  id: string;
  userId: string;
  conversationId: string;
  subject: Subject;
  mode: TestingMode;
  topicKey: string;
  topicLabel: string;
  title: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  topics: string[];
};

export type TestingAttemptSummary = {
  subject: Subject;
  mode: TestingMode;
  topicKey: string;
  topicLabel: string;
  title: string;
  attemptsCount: number;
  latest: TestingAttemptSnapshot;
  previous: TestingAttemptSnapshot | null;
  best: TestingAttemptSnapshot;
  trend: TestingTrend;
};

export type TestingAttemptSnapshot = {
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
};

export type TestingTrend = "new" | "improving" | "regressing" | "stable";

export type PersistedTopicScoreContext = {
  latestPercentage: number;
  previousPercentage: number | null;
  bestPercentage: number;
  trend: TestingTrend;
  attemptsCount: number;
  topicKey: string;
  topicLabel: string;
};

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function dedupeTopics(topics: string[]) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const topic of topics) {
    const cleaned = cleanText(topic);
    const normalised = cleaned.toLowerCase();
    if (!normalised || seen.has(normalised)) continue;
    seen.add(normalised);
    results.push(cleaned);
  }

  return results;
}

function slugifyPart(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleWords(title: string) {
  return cleanText(title)
    .split(/\s+/)
    .map(slugifyPart)
    .filter((word) => word.length >= 3)
    .slice(0, 4);
}

export function normaliseAttemptTopics(topics: string[]) {
  return dedupeTopics(topics).slice(0, 8);
}

export function buildTestingTopicKey(input: { topics: string[]; title: string }) {
  const topicParts = normaliseAttemptTopics(input.topics)
    .map(slugifyPart)
    .filter(Boolean);
  const fallbackParts = titleWords(input.title);
  const parts = (topicParts.length ? topicParts : fallbackParts).slice(0, 4);

  return parts.join("--") || "general";
}

export function buildTestingTopicLabel(input: { topics: string[]; title: string }) {
  const topics = normaliseAttemptTopics(input.topics);
  if (topics.length > 0) return topics.join(" / ");
  return cleanText(input.title) || "General practice";
}

export function buildTestingTopicLookupKeys(input: { topics: string[]; title?: string }) {
  const topics = normaliseAttemptTopics(input.topics);
  const fallbackTitle = cleanText(input.title ?? topics.join(" "));
  const keys = new Set<string>();

  if (topics.length > 0) {
    keys.add(buildTestingTopicKey({ topics, title: fallbackTitle }));

    for (const topic of topics) {
      keys.add(buildTestingTopicKey({ topics: [topic], title: topic }));
    }
  }

  if (fallbackTitle) {
    keys.add(buildTestingTopicKey({ topics: [], title: fallbackTitle }));
  }

  keys.delete("general");
  return [...keys];
}

function toPercentage(score: number, totalQuestions: number) {
  if (totalQuestions <= 0) return 0;
  return Math.round((score / totalQuestions) * 100);
}

function toSnapshot(attempt: TestingAttemptRecord): TestingAttemptSnapshot {
  return {
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage: toPercentage(attempt.score, attempt.totalQuestions),
    completedAt: attempt.completedAt,
  };
}

function compareAttempts(left: TestingAttemptRecord, right: TestingAttemptRecord) {
  return Date.parse(right.completedAt) - Date.parse(left.completedAt);
}

function detectTrend(latest: TestingAttemptSnapshot, previous: TestingAttemptSnapshot | null): TestingTrend {
  if (!previous) return "new";
  if (latest.percentage > previous.percentage) return "improving";
  if (latest.percentage < previous.percentage) return "regressing";
  return "stable";
}

export function summariseTestingAttempts(attempts: TestingAttemptRecord[]) {
  const groups = new Map<string, TestingAttemptRecord[]>();

  for (const attempt of attempts) {
    const groupKey = `${attempt.subject}:${attempt.mode}:${attempt.topicKey}`;
    const current = groups.get(groupKey);
    if (current) current.push(attempt);
    else groups.set(groupKey, [attempt]);
  }

  const summaries: TestingAttemptSummary[] = [];

  for (const group of groups.values()) {
    const ordered = [...group].sort(compareAttempts);
    const latestAttempt = ordered[0];

    if (!latestAttempt) continue;

    const bestAttempt = [...ordered].sort(
      (left, right) =>
        toPercentage(right.score, right.totalQuestions) - toPercentage(left.score, left.totalQuestions) ||
        Date.parse(right.completedAt) - Date.parse(left.completedAt),
    )[0]!;

    const latest = toSnapshot(latestAttempt);
    const previous = ordered[1] ? toSnapshot(ordered[1]) : null;

    summaries.push({
      subject: latestAttempt.subject,
      mode: latestAttempt.mode,
      topicKey: latestAttempt.topicKey,
      topicLabel: latestAttempt.topicLabel,
      title: latestAttempt.title,
      attemptsCount: ordered.length,
      latest,
      previous,
      best: toSnapshot(bestAttempt),
      trend: detectTrend(latest, previous),
    });
  }

  return summaries.sort(
    (left, right) => Date.parse(right.latest.completedAt) - Date.parse(left.latest.completedAt),
  );
}

export function findTestingAttemptSummary(
  summaries: TestingAttemptSummary[],
  options: {
    subject: Subject;
    mode: TestingMode;
    topics: string[];
    title?: string;
  },
): TestingAttemptSummary | null {
  const candidateKeys = new Set(
    buildTestingTopicLookupKeys({ topics: options.topics, title: options.title }),
  );

  for (const summary of summaries) {
    if (summary.subject !== options.subject || summary.mode !== options.mode) continue;
    if (candidateKeys.has(summary.topicKey)) return summary;
  }

  return null;
}

export function toPersistedTopicScoreContext(summary: TestingAttemptSummary): PersistedTopicScoreContext {
  return {
    latestPercentage: summary.latest.percentage,
    previousPercentage: summary.previous?.percentage ?? null,
    bestPercentage: summary.best.percentage,
    trend: summary.trend,
    attemptsCount: summary.attemptsCount,
    topicKey: summary.topicKey,
    topicLabel: summary.topicLabel,
  };
}
