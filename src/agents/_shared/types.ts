export const GRADE_LEVELS = ["primary", "secondary", "jc"] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];

export const SCHOOL_GRADES = [
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "sec1",
  "sec2",
  "sec3",
  "sec4",
  "sec5",
  "jc1",
  "jc2",
] as const;
export type SchoolGrade = (typeof SCHOOL_GRADES)[number];

export const SCHOOL_GRADE_META: Record<
  SchoolGrade,
  { label: string; short: string; band: GradeLevel }
> = {
  p1: { label: "Primary 1", short: "P1", band: "primary" },
  p2: { label: "Primary 2", short: "P2", band: "primary" },
  p3: { label: "Primary 3", short: "P3", band: "primary" },
  p4: { label: "Primary 4", short: "P4", band: "primary" },
  p5: { label: "Primary 5", short: "P5", band: "primary" },
  p6: { label: "Primary 6", short: "P6", band: "primary" },
  sec1: { label: "Secondary 1", short: "Sec 1", band: "secondary" },
  sec2: { label: "Secondary 2", short: "Sec 2", band: "secondary" },
  sec3: { label: "Secondary 3", short: "Sec 3", band: "secondary" },
  sec4: { label: "Secondary 4", short: "Sec 4", band: "secondary" },
  sec5: { label: "Secondary 5", short: "Sec 5", band: "secondary" },
  jc1: { label: "Junior College 1", short: "JC 1", band: "jc" },
  jc2: { label: "Junior College 2", short: "JC 2", band: "jc" },
};

export function isSchoolGrade(value: unknown): value is SchoolGrade {
  return typeof value === "string" && SCHOOL_GRADES.includes(value as SchoolGrade);
}

export function bandForGrade(grade: SchoolGrade): GradeLevel {
  return SCHOOL_GRADE_META[grade].band;
}

export function schoolGradeLabel(grade?: SchoolGrade | null, fallback?: GradeLevel) {
  if (grade && SCHOOL_GRADE_META[grade]) return SCHOOL_GRADE_META[grade].label;
  if (fallback === "jc") return "Junior College";
  if (fallback === "primary") return "Primary";
  if (fallback === "secondary") return "Secondary";
  return "Secondary";
}

export const SUBJECTS = ["math", "physics", "chemistry"] as const;
export type Subject = (typeof SUBJECTS)[number];

export const AGENT_IDS = [
  "orchestration",
  "math",
  "physics",
  "chemistry",
  "testing",
] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export const INTENTS = ["teaching", "testing", "general"] as const;
export type Intent = (typeof INTENTS)[number];

export const MASTERY_LEVELS = ["emerging", "developing", "secure"] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export type StudentProfile = {
  name: string;
  gradeLevel: GradeLevel;
  /** Specific year, e.g. sec3. gradeLevel stays the routing band. */
  grade?: SchoolGrade;
  diagnostic: Partial<Record<Subject, MasteryLevel>>;
  notes: string[];
};

export type ChatMemoryItem = {
  role: "user" | "assistant";
  text: string;
  agent?: AgentId;
  at: string;
};

export type AgentRuntimeContext = {
  sessionId: string;
  profile: StudentProfile;
  recentChats: ChatMemoryItem[];
};

export type RoutingDecision = {
  intent: Intent;
  subject: Subject | "none";
  agent: AgentId;
  gradeLevel: GradeLevel;
  rationale: string;
  confidence: number;
  promptVersion: string;
};

export type McqOption = {
  id: string;
  label: string;
};

export type McqItem = {
  id: string;
  question: string;
  options: McqOption[];
  correctOptionId: string;
  explanation: string;
  topic: string;
};

export type McqSet = {
  title: string;
  subject: Subject;
  items: McqItem[];
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  topic: string;
};

export type FlashcardSet = {
  title: string;
  subject: Subject;
  cards: Flashcard[];
};

export type PromptLogEntry = {
  id: string;
  sessionId: string;
  agent: AgentId;
  promptId: string;
  promptVersion: string;
  kind: "routing" | "generation" | "tool";
  input: string;
  output: string;
  model: string;
  latencyMs: number;
  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  routing?: RoutingDecision;
  at: string;
};

export const DEFAULT_PROFILE: StudentProfile = {
  name: "Student",
  gradeLevel: "secondary",
  grade: "sec3",
  diagnostic: {},
  notes: [],
};
