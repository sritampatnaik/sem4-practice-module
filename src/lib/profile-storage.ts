import {
  DEFAULT_PROFILE,
  type GradeLevel,
  type MasteryLevel,
  type StudentProfile,
  type Subject,
} from "@/agents/_shared/types";

const PROFILE_KEY = "mets.profile";
const SESSION_KEY = "mets.session";

export function getSessionId() {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = `ses_${crypto.randomUUID()}`;
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

export function loadProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: StudentProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearLocalStudent() {
  window.localStorage.removeItem(PROFILE_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function emptyProfile(): StudentProfile {
  return { ...DEFAULT_PROFILE, diagnostic: {}, notes: [] };
}

export type DiagnosticQuestion = {
  id: Subject;
  prompt: string;
  acceptable: string[];
};

export const DIAGNOSTICS: Record<GradeLevel, DiagnosticQuestion[]> = {
  primary: [
    { id: "math", prompt: "What is 3/4 of 12?", acceptable: ["9"] },
    {
      id: "physics",
      prompt: "A push or a pull is called a _____.",
      acceptable: ["force"],
    },
    {
      id: "chemistry",
      prompt: "Ice melting into water is a _____ change (physical or chemical).",
      acceptable: ["physical"],
    },
  ],
  secondary: [
    { id: "math", prompt: "Solve 2x + 3 = 11. What is x?", acceptable: ["4"] },
    {
      id: "physics",
      prompt: "What is the SI unit of force?",
      acceptable: ["newton", "n"],
    },
    {
      id: "chemistry",
      prompt: "What is the proton number of carbon?",
      acceptable: ["6"],
    },
  ],
  jc: [
    {
      id: "math",
      prompt: "Differentiate x^2 with respect to x.",
      acceptable: ["2x", "2 x"],
    },
    {
      id: "physics",
      prompt: "In an elastic collision, which quantity is conserved besides momentum?",
      acceptable: ["kinetic energy", "ke"],
    },
    {
      id: "chemistry",
      prompt: "What is the shape of BF3?",
      acceptable: ["trigonal planar", "triangular planar"],
    },
  ],
};

export function scoreAnswer(answer: string, acceptable: string[]): boolean {
  const normalised = answer.trim().toLowerCase().replace(/\s+/g, " ");
  return acceptable.some((item) => normalised === item || normalised.includes(item));
}

export function masteryFromCorrect(correct: boolean, answer: string): MasteryLevel {
  if (correct) return "secure";
  if (answer.trim()) return "developing";
  return "emerging";
}
