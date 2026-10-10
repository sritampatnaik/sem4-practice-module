import { tool } from "ai";
import { z } from "zod";
import type { GradeLevel, Subject } from "@/agents/_shared/types";
import { searchSyllabus, searchWebStub } from "@/lib/syllabus";

export function documentSearchTool(subject: Subject) {
  return tool({
    description:
      "Search official MOE/SEAB learning-outcome maps for this subject (not encyclopedic notes). Use this before claiming a topic is in-syllabus. Pass the student's gradeLevel so Primary, O-Level, and A-Level outcomes rank correctly.",
    inputSchema: z.object({
      query: z.string().describe("Topic or keyword, e.g. 'differentiation' or 'electrolysis'"),
      gradeLevel: z
        .enum(["primary", "secondary", "jc"])
        .describe("Student grade band"),
    }),
    execute: async ({ query, gradeLevel }: { query: string; gradeLevel: GradeLevel }) => {
      const results = await searchSyllabus({ subject, query, gradeLevel });
      return { subject, query, results };
    },
  });
}

export const webSearchTool = tool({
  description:
    "Optional supplementary web lookup. Prefer document_search for MOE alignment. Use this only for public definitions or historical context.",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }: { query: string }) => searchWebStub(query),
});
