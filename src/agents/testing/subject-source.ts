import { searchSyllabus } from "@/lib/syllabus";
import type { GradeLevel } from "../_shared/types";
import { extractAssessmentTopics } from "./assessment-planner";

type SubjectSourceInput = {
  request: string;
  gradeLevel: GradeLevel;
  topics?: string[];
  requestedCount?: number;
};

type SourceChunk = {
  id: string;
  title: string;
  gradeLevel: GradeLevel;
  excerpt: string;
  score: number;
};

export type PhysicsAssessmentSource = {
  subject: "physics";
  gradeLevel: GradeLevel;
  request: string;
  sourceQuery: string;
  topics: string[];
  requestedCount?: number;
  supported: boolean;
  supportReason: string;
  sourceChunks: SourceChunk[];
  keyConcepts: string[];
  formulaHints: string[];
  misconceptionSeeds: string[];
  questionAngles: string[];
  suggestedVisual?: string;
};

const sentenceSplitPattern = /(?<=[.!?])\s+/;

function uniqueNonEmpty(values: string[], limit: number) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const value of values) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    const normalised = cleaned.toLowerCase();
    if (!cleaned || seen.has(normalised)) continue;
    seen.add(normalised);
    results.push(cleaned);
    if (results.length >= limit) break;
  }

  return results;
}

function truncateAtBoundary(value: string, limit: number) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).replace(/[ ,;:-]+$/g, "")}...`;
}

function resolveTopics(request: string, explicitTopics?: string[]) {
  return uniqueNonEmpty(
    [...(explicitTopics ?? []), ...extractAssessmentTopics(request)],
    4,
  );
}

function buildSourceQuery(request: string, topics: string[]) {
  if (topics.length) return topics.join(", ");
  return request.replace(/\s+/g, " ").trim();
}

function excerptSentences(excerpt: string) {
  return excerpt
    .split(sentenceSplitPattern)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractKeyConcepts(chunks: SourceChunk[]) {
  const candidates = chunks.flatMap((chunk) => {
    const sentences = excerptSentences(chunk.excerpt).slice(0, 3);
    if (sentences.length) return sentences;

    return chunk.excerpt
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
  });

  return uniqueNonEmpty(
    candidates.map((line) => truncateAtBoundary(line, 160)),
    6,
  );
}

function extractFormulaHints(chunks: SourceChunk[]) {
  const candidates = chunks.flatMap((chunk) =>
    chunk.excerpt
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          /=|\/s\^?2|m\/s|newton|joule|watt|pascal|ohm|suvat|acceleration|velocity/i.test(
            line,
          ),
      ),
  );

  return uniqueNonEmpty(
    candidates.map((line) => truncateAtBoundary(line, 120)),
    4,
  );
}

function inferMisconceptionSeeds(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const seeds = [
    "mixing up variables when substituting into a formula",
    "dropping or misreading units in the final answer",
  ];

  if (/\bvelocity-time\b|\bdistance-time\b|\bgraph\b/.test(haystack)) {
    seeds.push("confusing graph gradient with area under the graph");
  }
  if (/\bforce\b|\bacceleration\b|\bvelocity\b|\bmotion\b/.test(haystack)) {
    seeds.push("ignoring direction when the quantity is a vector");
  }
  if (/\bcurrent\b|\bvoltage\b|\bresistance\b|\bcircuit\b|\belectric/.test(haystack)) {
    seeds.push("mixing up series and parallel relationships");
  }
  if (/\bwave\b|\blight\b|\blens\b|\breflection\b|\brefraction\b/.test(haystack)) {
    seeds.push("mixing up wavelength, frequency, and wave speed");
  }
  if (/\benergy\b|\bpower\b|\bpressure\b|\bdensity\b/.test(haystack)) {
    seeds.push("choosing a related but wrong formula for the physical quantity asked");
  }

  return uniqueNonEmpty(seeds, 5);
}

function inferQuestionAngles(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();
  const angles = [
    "definition or concept check",
    "single-step application of a principle or formula",
    "common-misconception distractor check",
  ];

  if (/\bgraph\b|\bvelocity-time\b|\bdistance-time\b/.test(haystack)) {
    angles.push("graph interpretation");
  }
  if (/\bcalculate\b|\bfind\b|\bdetermine\b|\bforce\b|\bspeed\b|\benergy\b/.test(haystack)) {
    angles.push("numerical calculation with units");
  }
  if (/\bcompare\b|\bdifference\b|\bexplain\b/.test(haystack)) {
    angles.push("qualitative comparison or explanation");
  }

  return uniqueNonEmpty(angles, 5);
}

function inferSuggestedVisual(query: string, concepts: string[]) {
  const haystack = `${query} ${concepts.join(" ")}`.toLowerCase();

  if (/\bvelocity-time\b|\bdistance-time\b|\bgraph\b/.test(haystack)) {
    return "A simple labelled motion graph highlighting gradient or area may help.";
  }
  if (/\bcircuit\b|\bcurrent\b|\bvoltage\b|\bresistance\b/.test(haystack)) {
    return "A simple labelled circuit sketch may help.";
  }
  if (/\blens\b|\breflection\b|\brefraction\b|\blight\b/.test(haystack)) {
    return "A simple labelled ray diagram may help.";
  }
  if (/\bforce\b|\bmoment\b|\bpressure\b/.test(haystack)) {
    return "A simple labelled force diagram may help.";
  }

  return undefined;
}

export async function buildPhysicsAssessmentSource(
  input: SubjectSourceInput,
): Promise<PhysicsAssessmentSource> {
  const topics = resolveTopics(input.request, input.topics);
  const sourceQuery = buildSourceQuery(input.request, topics);
  const sourceChunks = await searchSyllabus({
    subject: "physics",
    query: sourceQuery,
    gradeLevel: input.gradeLevel,
  });

  const supported = sourceChunks.some((chunk) => chunk.score > 0);
  const keyConcepts = extractKeyConcepts(sourceChunks);
  const formulaHints = extractFormulaHints(sourceChunks);
  const misconceptionSeeds = inferMisconceptionSeeds(sourceQuery, keyConcepts);
  const questionAngles = inferQuestionAngles(sourceQuery, keyConcepts);
  const suggestedVisual = inferSuggestedVisual(sourceQuery, keyConcepts);

  return {
    subject: "physics",
    gradeLevel: input.gradeLevel,
    request: input.request,
    sourceQuery,
    topics,
    requestedCount: input.requestedCount,
    supported,
    supportReason: supported
      ? "Physics syllabus matches were found for this request."
      : "No strong Physics syllabus match was found. Narrow the topic or ask the student to clarify before inventing content.",
    sourceChunks,
    keyConcepts,
    formulaHints,
    misconceptionSeeds,
    questionAngles,
    suggestedVisual,
  };
}
