"use client";

import { useMemo, useState } from "react";
import type { GradeLevel, StudentProfile } from "@/agents/_shared/types";
import { Button } from "@/components/ui/button";
import {
  DIAGNOSTICS,
  masteryFromCorrect,
  scoreAnswer,
} from "@/lib/profile-storage";

const BANDS: Array<{ id: GradeLevel; title: string; line: string }> = [
  { id: "primary", title: "Primary", line: "P4 to P6 model drawing and matter" },
  { id: "secondary", title: "Secondary", line: "O-Level / N-Level papers" },
  { id: "jc", title: "Junior College", line: "A-Level H1 and H2" },
];

function buildProfile(options: {
  name: string;
  gradeLevel: GradeLevel;
  diagnostic?: StudentProfile["diagnostic"];
  notes: string[];
}): StudentProfile {
  return {
    name: options.name.trim() || "Student",
    gradeLevel: options.gradeLevel,
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
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("secondary");
  const [step, setStep] = useState<"cover" | "diagnostic">("cover");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = useMemo(() => DIAGNOSTICS[gradeLevel], [gradeLevel]);

  function skipOnboarding() {
    onComplete(
      buildProfile({
        name,
        gradeLevel,
        notes: [
          "Onboarding skipped. Infer grade and prior knowledge from the conversation.",
        ],
      }),
    );
  }

  function skipDiagnostics() {
    onComplete(
      buildProfile({
        name,
        gradeLevel,
        notes: [
          "Diagnostics skipped. Infer prior knowledge from the conversation.",
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
            <fieldset className="grid gap-3">
              <legend className="ui-label">Grade band</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {BANDS.map((band) => {
                  const selected = gradeLevel === band.id;
                  return (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => setGradeLevel(band.id)}
                      className="rounded-xl px-3 py-3 text-left transition-colors"
                      style={{
                        background: selected
                          ? "var(--bui-accent-tint)"
                          : "var(--bui-surface)",
                        boxShadow: selected
                          ? "0 0 0 1px var(--bui-accent)"
                          : "var(--bui-shadow-hairline)",
                      }}
                    >
                      <span className="block text-[0.95rem] font-semibold">
                        {band.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--bui-ink-2)]">
                        {band.line}
                      </span>
                    </button>
                  );
                })}
              </div>
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
              const notes: string[] = [];
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
                  gradeLevel,
                  diagnostic,
                  notes,
                }),
              );
            }}
          >
            <p className="text-sm leading-6 text-[var(--bui-ink-2)]">
              Three quick checks so the specialists can pitch explanations.
              Guessing is allowed. You can skip this step.
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
