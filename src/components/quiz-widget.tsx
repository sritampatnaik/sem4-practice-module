"use client";

import { useState } from "react";
import type { McqSet } from "@/agents/_shared/types";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { MarkdownBody } from "./markdown-body";

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
      <section className="ui-card mt-4 p-4">
        <Chip>{quiz.subject} · marked</Chip>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">
          {score} / {quiz.items.length}
        </h3>
        <p className="mt-1 text-sm text-[var(--bui-ink-2)]">{quiz.title}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
        >
          Sit it again
        </Button>
      </section>
    );
  }

  return (
    <section className="ui-card mt-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <Chip>
          {quiz.subject} · {item.topic}
        </Chip>
        <p className="text-xs text-[var(--bui-ink-3)]">
          {index + 1} / {quiz.items.length}
        </p>
      </div>
      <MarkdownBody
        text={item.question}
        className="mt-3 text-[0.98rem] leading-7"
      />
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
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors disabled:cursor-default"
                style={{
                  background: isPicked ? "var(--bui-hover)" : "var(--bui-surface)",
                  boxShadow: showMark
                    ? isCorrect
                      ? "0 0 0 1px var(--bui-green)"
                      : "0 0 0 1px var(--bui-red)"
                    : "var(--bui-shadow-hairline)",
                }}
              >
                <span className="mt-0.5 text-sm font-semibold text-[var(--bui-ink-2)]">
                  {option.id.toUpperCase()}
                </span>
                <MarkdownBody
                  text={option.label}
                  inline
                  className="min-w-0 flex-1"
                />
              </button>
            </li>
          );
        })}
      </ul>
      {revealed ? (
        <div className="mt-3 text-sm leading-6 text-[var(--bui-ink-2)]">
          <MarkdownBody text={item.explanation} />
          <Button
            type="button"
            className="mt-3"
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
          </Button>
        </div>
      ) : null}
    </section>
  );
}
