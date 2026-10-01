import { tool } from "ai";
import { z } from "zod";
import type { AgentRuntimeContext } from "../_shared/types";
import {
  buildAssessmentPlan,
  buildMermaidDiagram,
  DIFFICULTY_LEVELS,
  TESTING_MODES,
  VISUAL_FORMATS,
  type ScoreContext,
} from "./assessment-planner";
import type { TestingTrend } from "./score-history";
import {
  appendAssessmentPerformanceEntry,
  readRecentAssessmentPerformance,
} from "./performance-log";
import {
  buildChemistryAssessmentSource,
  buildMathAssessmentSource,
  buildPhysicsAssessmentSource,
} from "./subject-source";

const subjectSchema = z.enum(["math", "physics", "chemistry"]);
const gradeLevelSchema = z.enum(["primary", "secondary", "jc"]);
const testingModeSchema = z.enum(TESTING_MODES);
const visualFormatSchema = z.enum(VISUAL_FORMATS);
const difficultyLevelSchema = z.enum(DIFFICULTY_LEVELS);
const trendSchema = z.enum(["new", "improving", "regressing", "stable"] as const satisfies readonly [TestingTrend, ...TestingTrend[]]);
const nonEmptyText = z.string().trim().min(1);

function findDuplicateIds(values: { id: string }[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value.id)) {
      duplicates.add(value.id);
      continue;
    }
    seen.add(value.id);
  }

  return [...duplicates];
}

const mcqOptionSchema = z.object({
  id: nonEmptyText,
  label: nonEmptyText,
});

const mcqItemSchema = z
  .object({
    id: nonEmptyText,
    question: nonEmptyText,
    options: z.array(mcqOptionSchema).min(3).max(5),
    correctOptionId: nonEmptyText,
    explanation: nonEmptyText,
    topic: nonEmptyText,
  })
  .superRefine((item, ctx) => {
    const duplicateOptionIds = findDuplicateIds(item.options);
    for (const duplicateId of duplicateOptionIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate option id '${duplicateId}' is not allowed.`,
        path: ["options"],
      });
    }

    if (!item.options.some((option) => option.id === item.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctOptionId must match one of the option ids.",
        path: ["correctOptionId"],
      });
    }
  });

const flashcardSchema = z.object({
  id: nonEmptyText,
  front: nonEmptyText,
  back: nonEmptyText,
  topic: nonEmptyText,
});

const mermaidNodeSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Node ids must start with a letter and use only letters, numbers, or underscores."),
  label: nonEmptyText,
});

const mermaidEdgeSchema = z.object({
  from: nonEmptyText,
  to: nonEmptyText,
  label: nonEmptyText.optional(),
});

function extractTrailingNumericResult(explanation: string) {
  const matches = [
    ...explanation.matchAll(/=\s*(?:\$)?(-?\d+(?:\.\d+)?)(?![\d.])/g),
  ];
  const last = matches.at(-1)?.[1];
  return last ? Number(last) : null;
}

function extractLeadingNumericValue(label: string) {
  const match = label.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function sameNumericValue(left: number, right: number) {
  return Math.abs(left - right) < 1e-9;
}

function validatePhysicsMcqCorrectness(items: z.infer<typeof mcqItemSchema>[]) {
  const issues: string[] = [];

  for (const item of items) {
    const explanationValue = extractTrailingNumericResult(item.explanation);
    const numericOptions = item.options
      .map((option) => ({
        id: option.id,
        label: option.label,
        value: extractLeadingNumericValue(option.label),
      }))
      .filter((option) => option.value !== null) as Array<{
      id: string;
      label: string;
      value: number;
    }>;

    if (explanationValue === null || numericOptions.length < 2) continue;

    const correct = numericOptions.find(
      (option) => option.id === item.correctOptionId,
    );
    if (!correct) continue;

    if (sameNumericValue(correct.value, explanationValue)) continue;

    const matchingOption = numericOptions.find((option) =>
      sameNumericValue(option.value, explanationValue),
    );

    if (!matchingOption) continue;

    issues.push(
      `Item '${item.id}' explanation resolves to ${explanationValue}, but correctOptionId points to '${correct.label}' instead of '${matchingOption.label}'.`,
    );
  }

  return issues;
}

export const planAssessmentTool = tool({
  description:
    "Plan a Testing response by selecting MCQ vs flashcards, extracting topics, deciding if a Mermaid diagram would help, and recommending difficulty based on score history. Pass latestPercentage and trend if you have topic-scoped score context.",
  inputSchema: z.object({
    request: nonEmptyText,
    subject: subjectSchema.optional(),
    gradeLevel: gradeLevelSchema,
    requestedCount: z.number().int().min(1).max(8).optional(),
    latestPercentage: z.number().min(0).max(100).optional().describe(
      "Student's latest score percentage for this specific topic (0–100). Only pass if you have topic-scoped score context.",
    ),
    trend: trendSchema.optional().describe(
      "Score trend for this specific topic. Only pass if you have topic-scoped score context.",
    ),
  }),
  execute: async (input) => {
    const scoreContext: ScoreContext | undefined =
      input.latestPercentage !== undefined && input.trend !== undefined
        ? { latestPercentage: input.latestPercentage, trend: input.trend }
        : undefined;
    return buildAssessmentPlan({ ...input, scoreContext });
  },
});

/**
 * Extract topic-scoped score context from profile notes or performance text.
 * Searches notes for a line that mentions one of the given topics and contains
 * both a percentage and a trend label. Returns null if no matching note is found.
 * Topic-scoped: a kinematics note will not match a heat query.
 */
function extractTopicScoreFromNotes(
  notes: string[],
  topics: string[],
): ScoreContext | null {
  const topicWords = topics
    .flatMap((t) => t.toLowerCase().split(/\s+/))
    .filter((w) => w.length >= 3);

  for (const note of notes) {
    const lower = note.toLowerCase();
    if (!topicWords.some((word) => lower.includes(word))) continue;

    const percentageMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);
    if (!percentageMatch) continue;
    const latestPercentage = Number(percentageMatch[1]);

    const trendMatch = lower.match(/trend[:\s]+(improving|regressing|stable|new)/);
    if (!trendMatch) continue;
    const trend = trendMatch[1] as TestingTrend;

    return { latestPercentage, trend };
  }

  return null;
}

export function getTopicScoreContextTool(ctx: AgentRuntimeContext) {
  return tool({
    description:
      "Look up topic-scoped score history for the student before calling planAssessment. " +
      "Searches the student's profile notes and recent performance notes for a score entry matching the given subject and topics. " +
      "Returns trend and latestPercentage only for the matching topic — a kinematics score will never affect a heat quiz. " +
      "Returns null if no matching score history is found (guest user or first attempt on this topic).",
    inputSchema: z.object({
      subject: subjectSchema,
      topics: z.array(nonEmptyText).min(1).max(4),
    }),
    execute: async ({ topics }) => {
      const allNotes = ctx.profile.notes;
      const result = extractTopicScoreFromNotes(allNotes, topics);
      if (!result) return { available: false as const };
      return { available: true as const, ...result };
    },
  });
}

const assessmentSourceInputSchema = z.object({
  request: nonEmptyText,
  gradeLevel: gradeLevelSchema,
  topics: z.array(nonEmptyText).min(1).max(4).optional(),
  requestedCount: z.number().int().min(1).max(8).optional(),
});

export const getPhysicsAssessmentSourceTool = tool({
  description:
    "Build structured Physics source material for the Testing agent before creating Physics MCQs or flashcards. Use this before generating a Physics widget.",
  inputSchema: assessmentSourceInputSchema,
  execute: async (input) => buildPhysicsAssessmentSource(input),
});

export const getMathAssessmentSourceTool = tool({
  description:
    "Build structured Maths source material for the Testing agent before creating Maths MCQs or flashcards. Use this before generating a Maths widget.",
  inputSchema: assessmentSourceInputSchema,
  execute: async (input) => buildMathAssessmentSource(input),
});

export const getChemistryAssessmentSourceTool = tool({
  description:
    "Build structured Chemistry source material for the Testing agent before creating Chemistry MCQs or flashcards. Use this before generating a Chemistry widget.",
  inputSchema: assessmentSourceInputSchema,
  execute: async (input) => buildChemistryAssessmentSource(input),
});

export const createMermaidDiagramTool = tool({
  description:
    "Build a simple Mermaid diagram spec for a Testing response when a labelled visual helps.",
  inputSchema: z
    .object({
      title: nonEmptyText,
      direction: z.enum(["TB", "LR"]).default("TB"),
      nodes: z.array(mermaidNodeSchema).min(2).max(12),
      edges: z.array(mermaidEdgeSchema).min(1).max(20),
    })
    .superRefine((diagram, ctx) => {
      const nodeIds = new Set(diagram.nodes.map((node) => node.id));

      for (const edge of diagram.edges) {
        if (!nodeIds.has(edge.from)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Edge source '${edge.from}' does not match a node id.`,
            path: ["edges"],
          });
        }

        if (!nodeIds.has(edge.to)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Edge destination '${edge.to}' does not match a node id.`,
            path: ["edges"],
          });
        }
      }
    }),
  execute: async (input) => ({
    title: input.title,
    format: "mermaid" as const,
    diagram: buildMermaidDiagram(input),
  }),
});

export const mcqSetInputSchema = z
  .object({
    title: nonEmptyText,
    subject: subjectSchema,
    items: z.array(mcqItemSchema).min(2).max(6),
  })
  .superRefine((set, ctx) => {
    const duplicateItemIds = findDuplicateIds(set.items);
    for (const duplicateId of duplicateItemIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate item id '${duplicateId}' is not allowed.`,
        path: ["items"],
      });
    }
  });

export const createMcqSetTool = tool({
  description: "Build an interactive multiple-choice quiz. The UI renders this as a quiz widget.",
  inputSchema: mcqSetInputSchema,
  execute: async (input) => {
    if (input.subject === "physics") {
      const issues = validatePhysicsMcqCorrectness(input.items);
      if (issues.length) {
        throw new Error(
          `Physics MCQ validation failed: ${issues.join(" ")}`,
        );
      }
    }

    return input;
  },
});

export const flashcardSetInputSchema = z
  .object({
    title: nonEmptyText,
    subject: subjectSchema,
    cards: z.array(flashcardSchema).min(3).max(8),
  })
  .superRefine((deck, ctx) => {
    const duplicateCardIds = findDuplicateIds(deck.cards);
    for (const duplicateId of duplicateCardIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate card id '${duplicateId}' is not allowed.`,
        path: ["cards"],
      });
    }
  });

export const createFlashcardsTool = tool({
  description: "Build an interactive flashcard deck. The UI renders this as a flip deck.",
  inputSchema: flashcardSetInputSchema,
  execute: async (input) => input,
});

export function getRecentPerformanceTool(ctx: AgentRuntimeContext) {
  return tool({
    description:
      "Read the most recent Testing-performance notes for this session so follow-up quizzes can adapt.",
    inputSchema: z.object({
      limit: z.number().int().min(1).max(10).default(5),
    }),
    execute: async ({ limit }) => readRecentAssessmentPerformance(ctx.sessionId, limit),
  });
}

export const recordPerformanceInputSchema = z
  .object({
    subject: subjectSchema,
    mode: testingModeSchema,
    title: nonEmptyText,
    topics: z.array(nonEmptyText).min(1).max(8),
    visualFormat: visualFormatSchema.default("none"),
    note: nonEmptyText,
  })
  .strict();

export function recordPerformanceTool(ctx: AgentRuntimeContext) {
  return tool({
    description:
      "Persist a compact Testing note for this session after a meaningful assessment. This tool is for assessment notes only and must not include outcome or score fields.",
    inputSchema: recordPerformanceInputSchema,
    execute: async (input) => {
      const savedPaths = await appendAssessmentPerformanceEntry({
        sessionId: ctx.sessionId,
        studentName: ctx.profile.name,
        gradeLevel: ctx.profile.gradeLevel,
        ...input,
        at: new Date().toISOString(),
      });

      return {
        saved: true,
        sessionId: ctx.sessionId,
        studentName: ctx.profile.name,
        gradeLevel: ctx.profile.gradeLevel,
        ...input,
        ...savedPaths,
      };
    },
  });
}
