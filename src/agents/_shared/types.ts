export const GRADE_LEVELS = ["primary", "secondary", "jc"] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];

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
  diagnostic: {},
  notes: [],
};
