import { tool } from "ai";
import { z } from "zod";

/**
 * Examination format facts, checked by hand against the published SEAB documents.
 *
 * The syllabus corpus that document search reads covers content, not paper
 * format, so without this the model guessed at calculator rules and weightings
 * and got them wrong (eval baseline, 29 Sep 2026). Every fact here has a source
 * and a check date; anything not yet confirmed is listed as unconfirmed rather
 * than filled in. Update the check date whenever SEAB publishes a new year.
 */
export const EXAM_FACTS_CHECKED_ON = "2026-09-29";

export type ExamFacts = {
  name: string;
  code: string;
  source: string;
  papers: string[];
  calculator: string;
  assessmentObjectives?: string;
  formulae?: string;
  working?: string;
  notes?: string[];
  unconfirmed?: string[];
};

export const EXAM_FACTS = {
  "psle-standard": {
    name: "PSLE Mathematics (Standard)",
    code: "0008",
    source: "https://isomer-user-content.by.gov.sg/334/fe51f29b-04ae-4fcb-a907-8db04c028510/0008_y26_sy.pdf",
    papers: [
      "Paper 1: 1 h 10 min, 50 marks, no calculator. Booklet A is multiple-choice (1- and 2-mark questions); Booklet B is short-answer (2 marks each).",
      "Paper 2: 1 h 20 min, 50 marks, calculator allowed. 5 short-answer questions (2 marks each) and 10 structured or long-answer questions (3, 4 or 5 marks each).",
      "Total: 100 marks, 2 h 30 min.",
    ],
    calculator: "Not allowed in Paper 1. Allowed in Paper 2.",
    unconfirmed: ["Whether any formulae are supplied."],
  },
  "psle-foundation": {
    name: "PSLE Foundation Mathematics",
    code: "0038",
    source: "https://isomer-user-content.by.gov.sg/334/5c51824e-16d2-47cf-bf64-ea5774beca04/0038_y26_sy.pdf",
    papers: [
      "Paper 1: 1 h, no calculator.",
      "Paper 2: 45 min, calculator allowed.",
      "Total: 80 marks, 1 h 45 min. Both papers are on the same day with a break between them.",
    ],
    calculator: "Not allowed in Paper 1. Allowed in Paper 2.",
    assessmentObjectives:
      "The same three objectives as Standard, written for simple contexts and simple situations rather than a variety of contexts.",
    notes: ["It is a separate assessment with its own objectives, not a shortened Standard paper (Standard is 100 marks over 2 h 30 min)."],
    unconfirmed: ["The split of the 80 marks between Paper 1 and Paper 2.", "Whether any formulae are supplied."],
  },
  "o-level-mathematics": {
    name: "O-Level Mathematics",
    code: "4052",
    source: "https://isomer-user-content.by.gov.sg/334/fece62fa-b6d4-4daf-ab47-96c9c168b51b/4052_y26_sy.pdf",
    papers: [
      "Paper 1: 2 h 15 min, 90 marks (50%), about 26 short-answer questions, all compulsory.",
      "Paper 2: 2 h 15 min, 90 marks (50%), 9 to 10 questions of varying marks and lengths; the last applies mathematics to a real-world scenario.",
    ],
    calculator: "An approved calculator may be used in both Paper 1 and Paper 2.",
    assessmentObjectives: "AO1 using techniques 45%, AO2 solving problems 40%, AO3 reasoning and communicating 15%.",
    formulae: "Relevant mathematical formulae are provided.",
    working: "Omission of essential working will result in loss of marks.",
  },
  "o-level-additional-mathematics": {
    name: "O-Level Additional Mathematics",
    code: "4049",
    source: "https://isomer-user-content.by.gov.sg/334/f4aaac1d-0d7f-492b-88d9-43e392418490/4049_y26_sy.pdf",
    papers: [
      "Paper 1: 2 h 15 min, 90 marks (50%), 12 to 14 questions, up to 10 marks each, all compulsory.",
      "Paper 2: 2 h 15 min, 90 marks (50%), 9 to 11 questions, up to 12 marks each, all compulsory.",
    ],
    calculator: "An approved calculator may be used in both Paper 1 and Paper 2.",
    assessmentObjectives: "AO1 using techniques 35%, AO2 solving problems in context 50%, AO3 reasoning and communicating 15%.",
    formulae: "Relevant mathematical formulae are provided.",
    working: "Omission of essential working will result in loss of marks.",
  },
  "a-level-h1": {
    name: "A-Level H1 Mathematics",
    code: "8865",
    source: "https://isomer-user-content.by.gov.sg/334/ee60af06-7c13-484f-8f0c-1e37f3d2937c/8865_y26_sy.pdf",
    papers: [
      "One 3-hour paper, 100 marks: Section A Pure Mathematics (40 marks, about 5 questions) and Section B Probability and Statistics (60 marks, 6 to 8 questions).",
      "One question applies mathematics in a real-world context and carries at least 12 marks.",
    ],
    calculator:
      "An approved graphing calculator (GC) without a computer algebra system is expected. Unsupported answers from the GC are allowed unless the question says otherwise.",
    assessmentObjectives:
      "AO1 understanding and applying techniques 40%, AO2 formulating and solving problems in context 55%, AO3 reasoning and communicating 5%.",
    formulae:
      "A list of formulae and results is provided: MF27, though the syllabus does not use that name. MF27 does not include the product, quotient or chain rules; for its full contents, use exam \"mf27\".",
    working:
      "Incorrect answers without working receive no marks, but written evidence of using the GC correctly may earn method marks. Where unsupported GC answers are not allowed, the mathematical steps must be shown.",
  },
  "a-level-h2": {
    name: "A-Level H2 Mathematics",
    code: "9758",
    source: "https://isomer-user-content.by.gov.sg/334/f27e37f7-f0ec-4a35-b1e8-3a5e88ae2f81/9758_y26_sy.pdf",
    papers: [
      "Paper 1: 3 h, 100 marks (50%), 10 to 12 Pure Mathematics questions, including one real-world application question of at least 12 marks.",
      "Paper 2: 3 h, 100 marks (50%). Section A Pure Mathematics (40 marks, 4 to 5 questions); Section B Probability and Statistics (60 marks, 6 to 8 questions, including one real-world application question of at least 12 marks).",
    ],
    calculator:
      "An approved graphing calculator (GC) without a computer algebra system is expected. Unsupported answers from the GC are allowed unless the question says otherwise.",
    assessmentObjectives:
      "AO1 understanding and applying techniques 30%, AO2 formulating and solving problems in context 60%, AO3 reasoning and communicating 10%.",
    formulae:
      "A list of formulae and results is provided: MF27, though the syllabus does not use that name. MF27 does not include the product, quotient or chain rules; for its full contents, use exam \"mf27\".",
    working:
      "Incorrect answers without working receive no marks, but written evidence of using the GC correctly may earn method marks.",
  },
  mf27: {
    name: "MF27 List of Formulae and Results",
    code: "MF27",
    source: "https://isomer-user-content.by.gov.sg/334/34bda122-a7f7-484f-9b46-9c4ad006fa21/SEAB_Mathematics_MF27__2025__.pdf",
    papers: ["For use from 2025 in all papers for H1, H2 and H3 Mathematics and H2 Further Mathematics."],
    calculator: "Not applicable.",
    formulae:
      "Includes the Maclaurin expansions of (1 + x)^n, e^x, sin x, cos x and ln(1 + x); and the derivatives of sin^-1 x, cos^-1 x, tan^-1 x, cosec x and sec x. It also has sections on integrals, vectors, numerical methods and statistics.",
    notes: [
      "The product, quotient and chain rules are not on MF27, so students must know them.",
      "Formulae on MF27 do not need to be memorised; knowing when and how to apply them does.",
    ],
  },
} satisfies Record<string, ExamFacts>;

export type ExamId = keyof typeof EXAM_FACTS;
const EXAM_IDS = Object.keys(EXAM_FACTS) as [ExamId, ...ExamId[]];

export const examFactsTool = tool({
  description: [
    "Checked facts about a Singapore mathematics examination: papers, durations, marks, calculator rules, assessment-objective weightings, supplied formulae and how working is marked.",
    "Use it before any claim about an examination's format or rules, and quote what it returns.",
    "If the answer is not in the result, say you do not have that detail rather than guessing.",
  ].join(" "),
  inputSchema: z.object({
    exam: z
      .enum(EXAM_IDS)
      .describe("psle-standard, psle-foundation, o-level-mathematics (4052), o-level-additional-mathematics (4049), a-level-h1 (8865), a-level-h2 (9758) or mf27"),
  }),
  execute: async ({ exam }: { exam: ExamId }) => ({
    ok: true as const,
    checkedOn: EXAM_FACTS_CHECKED_ON,
    ...EXAM_FACTS[exam],
  }),
});
