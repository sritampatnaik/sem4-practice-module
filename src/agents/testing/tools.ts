import { tool } from "ai";
import { z } from "zod";
import type { AgentRuntimeContext } from "../_shared/types";
import {
  buildAssessmentPlan,
  buildMermaidDiagram,
  TESTING_MODES,
  VISUAL_FORMATS,
} from "./assessment-planner";
import {
  appendAssessmentPerformanceEntry,
  readRecentAssessmentPerformance,
} from "./performance-log";

const subjectSchema = z.enum(["math", "physics", "chemistry"]);
const gradeLevelSchema = z.enum(["primary", "secondary", "jc"]);
const testingModeSchema = z.enum(TESTING_MODES);
const visualFormatSchema = z.enum(VISUAL_FORMATS);
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

export const planAssessmentTool = tool({
  description:
    "Plan a Testing response by selecting MCQ vs flashcards, extracting topics, and deciding if a Mermaid diagram would help.",
  inputSchema: z.object({
    request: nonEmptyText,
    subject: subjectSchema.optional(),
    gradeLevel: gradeLevelSchema,
    requestedCount: z.number().int().min(1).max(8).optional(),
  }),
  execute: async (input) => buildAssessmentPlan(input),
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

export const createMcqSetTool = tool({
  description: "Build an interactive multiple-choice quiz. The UI renders this as a quiz widget.",
  inputSchema: z
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
    }),
  execute: async (input) => input,
});

export const createFlashcardsTool = tool({
  description: "Build an interactive flashcard deck. The UI renders this as a flip deck.",
  inputSchema: z
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
    }),
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

export function recordPerformanceTool(ctx: AgentRuntimeContext) {
    return tool({
      description:
        "Persist a compact Testing note for this session. Log real student outcomes only when they are explicitly known.",
      inputSchema: z.object({
        subject: subjectSchema,
        mode: testingModeSchema,
        title: nonEmptyText,
        topics: z.array(nonEmptyText).min(1).max(8),
        visualFormat: visualFormatSchema.default("none"),
        note: nonEmptyText,
        outcome: nonEmptyText.optional(),
      }),
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
