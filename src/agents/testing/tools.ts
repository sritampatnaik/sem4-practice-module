import { tool } from "ai";
import { z } from "zod";

const subjectSchema = z.enum(["math", "physics", "chemistry"]);

export const createMcqSetTool = tool({
  description: "Build an interactive multiple-choice quiz. The UI renders this as a quiz widget.",
  inputSchema: z.object({
    title: z.string(),
    subject: subjectSchema,
    items: z
      .array(
        z.object({
          id: z.string(),
          question: z.string(),
          options: z.array(
            z.object({
              id: z.string(),
              label: z.string(),
            }),
          ).min(3).max(5),
          correctOptionId: z.string(),
          explanation: z.string(),
          topic: z.string(),
        }),
      )
      .min(2)
      .max(6),
  }),
  execute: async (input) => input,
});

export const createFlashcardsTool = tool({
  description: "Build an interactive flashcard deck. The UI renders this as a flip deck.",
  inputSchema: z.object({
    title: z.string(),
    subject: subjectSchema,
    cards: z
      .array(
        z.object({
          id: z.string(),
          front: z.string(),
          back: z.string(),
          topic: z.string(),
        }),
      )
      .min(3)
      .max(8),
  }),
  execute: async (input) => input,
});
