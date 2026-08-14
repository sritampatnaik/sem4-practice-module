"use client";

import { useState } from "react";
import type { McqSet } from "@/agents/_shared/types";

export function QuizWidget({ quiz }: { quiz: McqSet }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const item = quiz.items[index];
  const revealed = Boolean(picked);

  if (!item) return null;

  if (done) {
    return (
      <section className="mt-4 border border-[oklch(0.8_0.03_85)] bg-[oklch(0.98_0.012_85)] p-4">
        <p className="text-xs tracking-[0.18em] uppercase text-[var(--ink-soft)]">
          {quiz.subject} · marked script
        </p>
        <h3
          className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl"
          style={{ fontVariationSettings: '"SOFT" 40, "WONK" 1' }}
        >
          {score} / {quiz.items.length}
        </h3>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{quiz.title}</p>
        <button
          type="button"
          className="mt-4 text-sm underline underline-offset-4"
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
        >
          Sit it again
        </button>
      </section>
    );
  }

  return (
    <section className="mt-4 border border-[oklch(0.8_0.03_85)] bg-[oklch(0.98_0.012_85)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs tracking-[0.18em] uppercase text-[var(--ink-soft)]">
          {quiz.subject} · {item.topic}
        </p>
        <p className="text-xs text-[var(--ink-soft)]">
          {index + 1} / {quiz.items.length}
        </p>
      </div>
      <p className="mt-3 text-[1.05rem] leading-7">{item.question}</p>
      <ul className="mt-3 grid gap-2">
        {item.options.map((option) => {
          const isPicked = picked === option.id;
          const isCorrect = option.id === item.correctOptionId;
          const showMark = revealed && (isPicked || isCorrect);
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => {
                  setPicked(option.id);
                  if (option.id === item.correctOptionId) {
                    setScore((value) => value + 1);
                  }
                }}
                className="flex w-full items-start gap-3 border px-3 py-2 text-left transition-colors disabled:cursor-default"
                style={{
                  borderColor: showMark
                    ? isCorrect
                      ? "oklch(0.5 0.1 155)"
                      : "oklch(0.52 0.14 25)"
                    : "oklch(0.82 0.03 85)",
                  background: isPicked
                    ? "oklch(0.95 0.02 85)"
                    : "transparent",
                }}
              >
                <span className="mt-0.5 font-[family-name:var(--font-fraunces)] text-sm">
                  {option.id.toUpperCase()}
                </span>
                <span>{option.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {revealed ? (
        <div className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
          <p>{item.explanation}</p>
          <button
            type="button"
            className="mt-3 border border-[var(--ink)] bg-[var(--ink)] px-3 py-1.5 text-[var(--paper)]"
            onClick={() => {
              if (index + 1 >= quiz.items.length) {
                setDone(true);
                return;
              }
              setIndex((value) => value + 1);
              setPicked(null);
            }}
          >
            {index + 1 >= quiz.items.length ? "See mark" : "Next question"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
