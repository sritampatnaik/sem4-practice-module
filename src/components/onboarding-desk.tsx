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
import {
  DIAGNOSTICS,
  masteryFromCorrect,
  scoreAnswer,
} from "@/lib/profile-storage";

const BAND_COPY: Record<GradeLevel, { title: string; line: string }> = {
  primary: { title: "Primary", line: "P1 to P6" },
  secondary: { title: "Secondary", line: "Sec 1 to Sec 5" },
  jc: { title: "Junior College", line: "JC 1 and JC 2" },
};

function buildProfile(options: {
  name: string;
  grade: SchoolGrade;
  diagnostic?: StudentProfile["diagnostic"];
  notes: string[];
}): StudentProfile {
  return {
    name: options.name.trim() || "Student",
    grade: options.grade,
    gradeLevel: bandForGrade(options.grade),
    diagnostic: options.diagnostic ?? {},
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
  const [step, setStep] = useState<"cover" | "diagnostic">("cover");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const gradeLevel = bandForGrade(grade);
  const questions = useMemo(() => DIAGNOSTICS[gradeLevel], [gradeLevel]);

  function skipOnboarding() {
    onComplete(
      buildProfile({
        name,
        grade,
        notes: [
          `Year: ${SCHOOL_GRADE_META[grade].label}. Onboarding skipped. Infer prior knowledge from the conversation.`,
        ],
      }),
    );
  }

  function skipDiagnostics() {
    onComplete(
      buildProfile({
        name,
        grade,
        notes: [
          `Year: ${SCHOOL_GRADE_META[grade].label}. Diagnostics skipped. Infer prior knowledge from the conversation.`,
        ],
      }),
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="ui-card w-full max-w-xl px-7 py-8 sm:px-9 sm:py-10">
        <p className="ui-label">NUS-ISS Practice Module · Team 5</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--bui-ink)] sm:text-5xl">
          METS
        </h1>
        <p className="mt-3 max-w-md text-[0.95rem] leading-6 text-[var(--bui-ink-2)]">
          A five-agent tutor for Singapore Mathematics, Physics, and Chemistry.
          Add your name if you like, or skip and start asking.
        </p>

        {step === "cover" ? (
          <form
            className="mt-8 grid gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              setStep("diagnostic");
            }}
          >
            <label className="grid gap-2">
              <span className="ui-label">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="ui-field text-base"
                placeholder="As on your exercise book"
              />
            </label>
            <fieldset className="grid gap-4">
              <legend className="ui-label">Which year are you in?</legend>
              {GRADE_LEVELS.map((band) => (
                <div key={band} className="grid gap-2">
                  <p className="text-sm font-medium text-[var(--bui-ink)]">
                    {BAND_COPY[band].title}
                    <span className="ml-2 font-normal text-[var(--bui-ink-3)]">
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
                            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                            style={{
                              background: selected
                                ? "var(--bui-accent-tint)"
                                : "var(--bui-surface)",
                              boxShadow: selected
                                ? "0 0 0 1px var(--bui-accent)"
                                : "var(--bui-shadow-hairline)",
                            }}
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
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Button type="submit">Continue</Button>
              <Button type="button" variant="ghost" onClick={skipOnboarding}>
                Skip and start tutoring
              </Button>
            </div>
          </form>
        ) : (
          <form
            className="mt-8 grid gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              const diagnostic: StudentProfile["diagnostic"] = {};
              const notes: string[] = [
                `Year: ${SCHOOL_GRADE_META[grade].label}.`,
              ];
              for (const question of questions) {
                const answer = answers[question.id] ?? "";
                const correct = scoreAnswer(answer, question.acceptable);
                diagnostic[question.id] = masteryFromCorrect(correct, answer);
                notes.push(
                  `${question.id} diagnostic: ${correct ? "secure" : "needs teaching"} (${answer || "blank"})`,
                );
              }
              onComplete(
                buildProfile({
                  name,
                  grade,
                  diagnostic,
                  notes,
                }),
              );
            }}
          >
            <p className="text-sm leading-6 text-[var(--bui-ink-2)]">
              Three quick checks for {SCHOOL_GRADE_META[grade].label} so the
              specialists can pitch explanations. Guessing is allowed. You can
              skip this step.
            </p>
            {questions.map((question) => (
              <label key={question.id} className="grid gap-2">
                <span className="ui-label">{question.id}</span>
                <span className="text-sm">{question.prompt}</span>
                <input
                  value={answers[question.id] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: event.target.value,
                    }))
                  }
                  className="ui-field"
                />
              </label>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setStep("cover")}>
                Back
              </Button>
              <Button type="submit">Start tutoring</Button>
              <Button type="button" variant="ghost" onClick={skipDiagnostics}>
                Skip diagnostics
              </Button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
