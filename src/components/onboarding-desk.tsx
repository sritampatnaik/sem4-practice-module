"use client";

import { useMemo, useState } from "react";
import type { GradeLevel, SchoolGrade, StudentProfile } from "@/agents/_shared/types";
import {
  GRADE_LEVELS,
  SCHOOL_GRADE_META,
  SCHOOL_GRADES,
  bandForGrade,
} from "@/agents/_shared/types";
import { Button } from "@/components/ui/button";

const BAND_COPY: Record<GradeLevel, { title: string; line: string }> = {
  primary: { title: "Primary", line: "P1 to P6" },
  secondary: { title: "Secondary", line: "Sec 1 to Sec 5" },
  jc: { title: "Junior College", line: "JC 1 and JC 2" },
};

function buildProfile(options: {
  name: string;
  grade: SchoolGrade;
  notes: string[];
}): StudentProfile {
  return {
    name: options.name.trim() || "Student",
    grade: options.grade,
    gradeLevel: bandForGrade(options.grade),
    diagnostic: {},
    notes: options.notes,
  };
}

export function OnboardingDesk({
  onComplete,
}: {
  onComplete: (profile: StudentProfile) => void;
}) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<SchoolGrade>("sec3");
  const yearLabel = useMemo(() => SCHOOL_GRADE_META[grade].label, [grade]);

  function finish(notes: string[]) {
    onComplete(buildProfile({ name, grade, notes }));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-canvas via-page to-canvas px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-line/50 bg-surface/95 px-8 py-10 shadow-overlay backdrop-blur-sm sm:px-10 sm:py-12">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
            NUS-ISS Practice Module · Team 5
          </p>
          <h1 className="bg-gradient-to-r from-ink to-ink-2 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Welcome to METS
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-2">
            Your personal multi-agent tutor for Singapore Mathematics, Physics, and Chemistry.
            Let's set up your learning profile to get started.
          </p>
        </div>

        <form
          className="space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            finish([
              `Year: ${yearLabel}. Diagnostics not taken yet. Infer prior knowledge from the conversation.`,
            ]);
          }}
        >
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                Your Name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-line bg-field px-4 py-3 text-base text-ink shadow-hairline transition-all placeholder:text-ink-3 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)] focus:outline-none"
                placeholder="As on your exercise book"
              />
            </label>
            <p className="text-xs text-ink-3">This helps personalize your learning experience</p>
          </div>
          
          <fieldset className="space-y-5">
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-3">
              Which year are you in?
            </legend>
            {GRADE_LEVELS.map((band) => (
              <div key={band} className="space-y-3 rounded-xl border border-line/50 bg-inset/30 p-5">
                <p className="text-base font-bold text-ink">
                  {BAND_COPY[band].title}
                  <span className="ml-2 text-sm font-normal text-ink-3">
                    {BAND_COPY[band].line}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SCHOOL_GRADES.filter((id) => SCHOOL_GRADE_META[id].band === band).map(
                    (id) => {
                      const selected = grade === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setGrade(id)}
                          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                            selected
                              ? "bg-accent/10 text-accent shadow-[0_0_0_2px_var(--accent)] hover:bg-accent/15"
                              : "bg-surface text-ink-2 shadow-hairline hover:bg-hover hover:text-ink hover:shadow-card"
                          }`}
                        >
                          {SCHOOL_GRADE_META[id].short}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
          </fieldset>
          
          <div className="space-y-3 pt-2">
            <Button 
              type="submit" 
              className="h-12 w-full gap-2 text-base font-semibold shadow-btn transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start your learning journey
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full font-medium transition-all hover:scale-[1.01]"
              onClick={() =>
                finish([
                  `Year: ${yearLabel}. Onboarding skipped. Infer prior knowledge from the conversation.`,
                ])
              }
            >
              Skip setup and explore
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
