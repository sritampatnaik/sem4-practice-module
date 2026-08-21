import type { StudentProfile } from "../../_shared/types";

export const TESTING_FIXTURE_PROFILES = {
  primaryStarter: {
    name: "Alya",
    gradeLevel: "primary",
    diagnostic: {
      math: "developing",
      physics: "emerging",
      chemistry: "developing",
    },
    notes: ["Prefers short prompts and confidence-building practice."],
  },
  secondaryOLevel: {
    name: "Ben",
    gradeLevel: "secondary",
    diagnostic: {
      math: "developing",
      physics: "developing",
      chemistry: "secure",
    },
    notes: ["Preparing for O-Level practice.", "Needs misconception-focused feedback."],
  },
  jcH2: {
    name: "Cara",
    gradeLevel: "jc",
    diagnostic: {
      math: "developing",
      physics: "secure",
      chemistry: "developing",
    },
    notes: ["Takes H2 Math.", "Needs stretch questions after basic fluency."],
  },
} satisfies Record<string, StudentProfile>;

export type TestingFixtureProfileId = keyof typeof TESTING_FIXTURE_PROFILES;
