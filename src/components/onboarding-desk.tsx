"use client";

import { useMemo, useState } from "react";
import type { GradeLevel, StudentProfile } from "@/agents/_shared/types";
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
      <section className="foolscap grain relative w-full max-w-2xl px-10 py-12 shadow-[12px_18px_0_oklch(0.22_0.03_55)] sm:px-16">
        <p className="text-[0.7rem] tracking-[0.28em] uppercase text-[var(--margin)]">
          NUS-ISS Practice Module · Team 5
        </p>
        <h1
          className="mt-4 font-[family-name:var(--font-fraunces)] text-5xl leading-[0.95] text-[var(--ink)] sm:text-6xl"
          style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1' }}
        >
          METS
        </h1>
        <p className="mt-3 max-w-md text-lg leading-7 text-[var(--ink-soft)]">
          A five-agent tutor for Singapore Mathematics, Physics, and Chemistry.
          Write your name on the cover if you like, or skip and start asking.
        </p>

        {step === "cover" ? (
          <form
            className="mt-10 grid gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              setStep("diagnostic");
            }}
          >
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.18em] uppercase">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="border-0 border-b border-[var(--ink)] bg-transparent px-0 py-2 text-xl outline-none"
                placeholder="As on your exercise book"
              />
            </label>
            <fieldset className="grid gap-3">
              <legend className="text-xs tracking-[0.18em] uppercase">
                Grade band
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {BANDS.map((band) => (
                  <button
                    key={band.id}
                    type="button"
                    onClick={() => setGradeLevel(band.id)}
                    className="border px-3 py-3 text-left"
                    style={{
                      borderColor: gradeLevel === band.id ? "var(--ink)" : "oklch(0.8 0.03 85)",
                      background:
                        gradeLevel === band.id ? "oklch(0.98 0.01 85)" : "transparent",
                    }}
                  >
                    <span className="block font-[family-name:var(--font-fraunces)] text-xl">
                      {band.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--ink-soft)]">
                      {band.line}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="border border-[var(--ink)] bg-[var(--ink)] px-5 py-2 text-[var(--paper)]"
              >
                Open the book
              </button>
              <button
                type="button"
                className="px-2 py-2 text-sm text-[var(--ink-soft)] underline underline-offset-4"
                onClick={skipOnboarding}
              >
                Skip and start tutoring
              </button>
            </div>
          </form>
        ) : (
          <form
            className="mt-10 grid gap-6"
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
            <p className="text-sm leading-6 text-[var(--ink-soft)]">
              Three quick checks so the specialists can pitch explanations. Guessing is allowed. You can skip this step.
            </p>
            {questions.map((question) => (
              <label key={question.id} className="grid gap-2">
                <span className="text-xs tracking-[0.18em] uppercase">
                  {question.id}
                </span>
                <span>{question.prompt}</span>
                <input
                  value={answers[question.id] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: event.target.value,
                    }))
                  }
                  className="border-0 border-b border-[var(--ink)] bg-transparent px-0 py-2 outline-none"
                />
              </label>
            ))}
            <div className="flex gap-3">
              <button
                type="button"
                className="border border-[var(--ink)] px-4 py-2"
                onClick={() => setStep("cover")}
              >
                Back
              </button>
              <button
                type="submit"
                className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[var(--paper)]"
              >
                Start tutoring
              </button>
              <button
                type="button"
                className="px-2 py-2 text-sm text-[var(--ink-soft)] underline underline-offset-4"
                onClick={skipDiagnostics}
              >
                Skip diagnostics
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
