import type { AgentRuntimeContext, GradeLevel } from "./types";

const GRADE_LABEL: Record<GradeLevel, string> = {
  primary: "Primary school (MOE Primary syllabus)",
  secondary: "Secondary school (O-Level / N-Level)",
  jc: "Junior College (A-Level H1/H2)",
};

export function formatStudentContext(ctx: AgentRuntimeContext): string {
  const diagnostic = Object.entries(ctx.profile.diagnostic)
    .map(([subject, level]) => `${subject}: ${level}`)
    .join(", ");

  const memory = ctx.recentChats
    .slice(-10)
    .map((item) => `- ${item.role}${item.agent ? `/${item.agent}` : ""}: ${item.text}`)
    .join("\n");

  const notes = ctx.profile.notes.length
    ? ctx.profile.notes.map((note) => `- ${note}`).join("\n")
    : "- none yet";

  return [
    `Student name: ${ctx.profile.name}`,
    `Grade band: ${GRADE_LABEL[ctx.profile.gradeLevel]}`,
    `Diagnostic snapshot: ${diagnostic || "not yet recorded"}`,
    `Tutor notes:`,
    notes,
    `Short-term memory (last ${Math.min(ctx.recentChats.length, 10)} chats):`,
    memory || "- none yet",
  ].join("\n");
}

export function singaporeTutorRules(): string {
  return [
    "You teach in the Singapore MOE context. Prefer Singapore English spelling (colour, metre, practise as a verb).",
    "Align explanations to the relevant Primary, O-Level, or A-Level syllabus. Do not introduce university content unless the student asks.",
    "Use RAG / document search before asserting syllabus coverage. If a topic is outside the band, say so and offer the closest in-syllabus path.",
    "Show working. Prefer short paragraphs, numbered steps, and LaTeX for mathematics ($...$ or $$...$$).",
    "Never invent marks schemes, SEAB paper numbers, or official wording. Quote syllabus points only from retrieved documents.",
    "Refuse requests to generate entire live exam papers, leak assessment answers, or bypass academic integrity.",
    "If the student seems stuck, ask one diagnostic question before dumping a full solution.",
    "Keep a warm, precise tutor voice. No hype. No filler.",
  ].join("\n");
}
