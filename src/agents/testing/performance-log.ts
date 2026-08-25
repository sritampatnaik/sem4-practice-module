import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { GradeLevel, Subject } from "../_shared/types";
import type { TestingMode, VisualFormat } from "./assessment-planner";

const LOG_DIR = path.join(process.cwd(), "logs", "testing-performance");
const JSONL_FILE = path.join(LOG_DIR, "entries.jsonl");

export type AssessmentPerformanceEntry = {
  sessionId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  subject: Subject;
  mode: TestingMode;
  title: string;
  topics: string[];
  visualFormat: VisualFormat;
  note: string;
  outcome?: string;
  at: string;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "anon";
}

function markdownPath(sessionId: string) {
  return path.join(LOG_DIR, `${slugify(sessionId)}.md`);
}

function formatMarkdown(entry: AssessmentPerformanceEntry) {
  const lines = [
    `## ${entry.at} - ${entry.title}`,
    ``,
    `- Student: ${entry.studentName}`,
    `- Session: ${entry.sessionId}`,
    `- Grade level: ${entry.gradeLevel}`,
    `- Subject: ${entry.subject}`,
    `- Mode: ${entry.mode}`,
    `- Topics: ${entry.topics.join(", ")}`,
    `- Visual format: ${entry.visualFormat}`,
    `- Note: ${entry.note}`,
  ];

  if (entry.outcome) {
    lines.push(`- Outcome: ${entry.outcome}`);
  }

  lines.push("", "");
  return lines.join("\n");
}

export async function appendAssessmentPerformanceEntry(entry: AssessmentPerformanceEntry) {
  await mkdir(LOG_DIR, { recursive: true });
  await Promise.all([
    appendFile(JSONL_FILE, `${JSON.stringify(entry)}\n`, "utf8"),
    appendFile(markdownPath(entry.sessionId), formatMarkdown(entry), "utf8"),
  ]);

  return {
    jsonlPath: JSONL_FILE,
    markdownPath: markdownPath(entry.sessionId),
  };
}

export async function readRecentAssessmentPerformance(sessionId: string, limit = 5) {
  try {
    const raw = await readFile(JSONL_FILE, "utf8");
    const entries = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AssessmentPerformanceEntry)
      .filter((entry) => entry.sessionId === sessionId)
      .slice(-limit)
      .reverse();

    return {
      sessionId,
      count: entries.length,
      entries,
      markdownPath: markdownPath(sessionId),
    };
  } catch {
    return {
      sessionId,
      count: 0,
      entries: [] as AssessmentPerformanceEntry[],
      markdownPath: markdownPath(sessionId),
    };
  }
}
