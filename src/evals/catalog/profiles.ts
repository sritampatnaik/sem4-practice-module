import type { StudentProfile } from "@/agents/_shared/types";

export const primaryAlex: StudentProfile = {
  name: "Alex",
  gradeLevel: "primary",
  diagnostic: { math: "emerging", physics: "emerging", chemistry: "emerging" },
  notes: [],
};

export const secondaryAlex: StudentProfile = {
  name: "Alex",
  gradeLevel: "secondary",
  diagnostic: { math: "developing", physics: "developing", chemistry: "developing" },
  notes: [],
};

export const jcAlex: StudentProfile = {
  name: "Alex",
  gradeLevel: "jc",
  diagnostic: { math: "developing", physics: "secure", chemistry: "developing" },
  notes: ["Takes H2 Math and H2 Physics."],
};
