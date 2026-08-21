import type { GradeLevel, Subject } from "../_shared/types";

export const TESTING_MODES = ["mcq", "flashcards"] as const;
export type TestingMode = (typeof TESTING_MODES)[number];

export const VISUAL_FORMATS = ["none", "mermaid"] as const;
export type VisualFormat = (typeof VISUAL_FORMATS)[number];

type AssessmentPlanInput = {
  request: string;
  subject?: Subject;
  gradeLevel: GradeLevel;
  requestedCount?: number;
};

export type AssessmentPlan = {
  mode: TestingMode;
  subject?: Subject;
  gradeLevel: GradeLevel;
  requestedCount?: number;
  topics: string[];
  needsVisual: boolean;
  visualFormat: VisualFormat;
  rationale: string;
};

type MermaidNode = {
  id: string;
  label: string;
};

type MermaidEdge = {
  from: string;
  to: string;
  label?: string;
};

type MermaidDiagramInput = {
  title: string;
  direction: "TB" | "LR";
  nodes: MermaidNode[];
  edges: MermaidEdge[];
};

const flashcardPattern = /\bflashcards?\b|\brevision cards?\b|\bstudy cards?\b/i;
const mcqPattern =
  /\bmcq\b|\bmcqs\b|multiple choice|\bquiz\b|\btest me\b|\bpractice questions?\b|\bassessment\b/i;
const visualPattern =
  /\bdiagram\b|\bvisual\b|\bflowchart\b|\bcycle\b|\bprocess\b|\bmap\b|\bdraw\b|\billustrat/i;

const topicStopwords = new Set([
  "a",
  "an",
  "and",
  "for",
  "give",
  "me",
  "of",
  "on",
  "please",
  "quiz",
  "questions",
  "revision",
  "test",
]);

function cleanTopic(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[,;:\- ]+|[,;:\- ]+$/g, "").trim();
}

function uniqueTopics(topics: string[]) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const topic of topics) {
    const normalised = topic.toLowerCase();
    if (!normalised || seen.has(normalised)) continue;
    seen.add(normalised);
    results.push(topic);
  }

  return results;
}

function extractTopics(request: string) {
  const lower = request.toLowerCase();
  const byLeadIn = lower.match(/\b(?:on|about|for|covering)\b(.+)$/i);
  const source =
    byLeadIn?.[1] ??
    request
      .replace(/\b(?:give|make|create|quiz|test)\b/gi, " ")
      .replace(/\b(?:me|some|please)\b/gi, " ")
      .replace(/\b(?:mcq|mcqs|multiple choice|flashcard|flashcards|revision cards?|study cards?|questions?|assessment)\b/gi, " ")
      .replace(/\b(?:one|two|three|four|five|six|seven|eight|\d+)\b/gi, " ")
      .replace(/\bwith\s+(?:a\s+)?(?:diagram|visual|flowchart|mermaid)\b.*$/i, " ")
      .replace(/\s+/g, " ")
      .trim();

  const candidates = source
    .split(/,|\/|\band\b/gi)
    .map((topic) => cleanTopic(topic))
    .filter(Boolean)
    .filter((topic) => {
      const words = topic.toLowerCase().split(/\s+/).filter(Boolean);
      return words.some((word) => !topicStopwords.has(word));
    });

  return uniqueTopics(candidates).slice(0, 4);
}

function inferMode(request: string): TestingMode {
  const wantsFlashcards = flashcardPattern.test(request);
  const wantsMcq = mcqPattern.test(request);

  if (wantsFlashcards && !wantsMcq) return "flashcards";
  return "mcq";
}

function inferVisualFormat(request: string): VisualFormat {
  return visualPattern.test(request) ? "mermaid" : "none";
}

export function buildAssessmentPlan(input: AssessmentPlanInput): AssessmentPlan {
  const mode = inferMode(input.request);
  const visualFormat = inferVisualFormat(input.request);
  const topics = extractTopics(input.request);

  const rationaleParts = [
    mode === "flashcards"
      ? "Flashcard language was detected in the student request."
      : "Quiz-style language was detected or used as the safe default.",
    visualFormat === "mermaid"
      ? "A simple Mermaid diagram may help because the student asked for a visual explanation."
      : "No visual cue was detected, so a plain widget should be enough.",
  ];

  return {
    mode,
    subject: input.subject,
    gradeLevel: input.gradeLevel,
    requestedCount: input.requestedCount,
    topics,
    needsVisual: visualFormat !== "none",
    visualFormat,
    rationale: rationaleParts.join(" "),
  };
}

function escapeMermaidText(value: string) {
  return value.replace(/"/g, '\\"').trim();
}

export function buildMermaidDiagram(input: MermaidDiagramInput) {
  const lines = [`---`, `title: ${input.title}`, `---`, `graph ${input.direction}`];

  for (const node of input.nodes) {
    lines.push(`  ${node.id}["${escapeMermaidText(node.label)}"]`);
  }

  for (const edge of input.edges) {
    const label = edge.label?.trim()
      ? `|${escapeMermaidText(edge.label)}|`
      : "";
    lines.push(`  ${edge.from} -->${label} ${edge.to}`);
  }

  return lines.join("\n");
}
