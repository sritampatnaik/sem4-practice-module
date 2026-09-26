"use client";

import { useMemo, useRef, useState } from "react";
import type { McqSet } from "@/agents/_shared/types";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/icons";
import ApprovalCard, { type ApprovalQuestion } from "@/components/primitives/ApprovalCard";
import { MarkdownBody } from "./markdown-body";

type AttemptSaveState = "idle" | "saving" | "saved" | "error" | "guest";

function uniqueTopics(quiz: McqSet) {
  const seen = new Set<string>();
  const topics: string[] = [];

  for (const item of quiz.items) {
    const topic = item.topic.trim();
    const normalised = topic.toLowerCase();
    if (!normalised || seen.has(normalised)) continue;
    seen.add(normalised);
    topics.push(topic);
  }

  return topics;
}

export function QuizWidget({
  quiz,
  conversationId,
  signedIn,
}: {
  quiz: McqSet;
  conversationId?: string;
  signedIn?: boolean;
}) {
  const marks = useRef<boolean[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [attemptState, setAttemptState] = useState<AttemptSaveState>("idle");

  const questions = useMemo<ApprovalQuestion[]>(
    () =>
      quiz.items.map((item) => ({
        q: item.question,
        type: "radio",
        options: item.options.map((option) => option.label),
        heading: <MarkdownBody text={item.question} className="text-[14px] leading-6 font-medium" />,
        optionNodes: item.options.map((option) => (
          <span key={option.id} className="flex min-w-0 items-start gap-1.5">
            <span className="mt-px shrink-0 text-[11px] font-semibold text-ink-3">
              {option.id.toUpperCase()}
            </span>
            <MarkdownBody text={option.label} inline className="min-w-0" />
          </span>
        )),
      })),
    [quiz.items],
  );

  async function saveAttempt(nextScore: number) {
    if (!signedIn || !conversationId) {
      setAttemptState("guest");
      return;
    }

    setAttemptState("saving");

    try {
      const response = await fetch("/api/testing-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          subject: quiz.subject,
          mode: "mcq",
          title: quiz.title,
          score: nextScore,
          totalQuestions: quiz.items.length,
          topics: uniqueTopics(quiz),
        }),
      });

      if (!response.ok) {
        setAttemptState("error");
        return;
      }

      setAttemptState("saved");
      window.dispatchEvent(new Event("testing-progress-updated"));
    } catch {
      setAttemptState("error");
    }
  }

  if (score !== null) {
    return (
      <div className="flex flex-wrap items-center gap-3" style={{ animation: "pop-in 260ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint py-1 pr-2.5 pl-1 text-[12.5px] font-medium text-green">
          <span className="flex size-4.5 items-center justify-center rounded-full bg-green text-white">
            <Icon icon="quiz" size={12} strokeWidth={2} />
          </span>
          {score} / {quiz.items.length} marked
        </span>
        <p className="text-[12.5px] text-ink-2">{quiz.title}</p>
        {attemptState === "saving" ? (
          <p className="text-[12.5px] text-ink-3">Saving this score…</p>
        ) : attemptState === "saved" ? (
          <p className="text-[12.5px] text-ink-3">Saved to your Testing progress.</p>
        ) : attemptState === "guest" ? (
          <p className="text-[12.5px] text-ink-3">Sign in to track score history across quizzes.</p>
        ) : attemptState === "error" ? (
          <p className="text-[12.5px] text-red">Could not save this score.</p>
        ) : null}
        <Button type="button" variant="ghost" size="sm" onClick={() => {
          marks.current = [];
          setScore(null);
          setAttemptState("idle");
        }}>
          Sit it again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="ui-label mb-2 inline-flex items-center gap-1">
        <Icon icon="quiz" size={12} />
        Multiple-choice
      </p>
      <ApprovalCard
        key={quiz.title}
        className="max-w-full"
        questions={questions}
        allowCustom={false}
        autoAdvance={false}
        lockAfterAnswer
        labels={{
          skip: "Skip",
          continue: "Next question",
          send: "See mark",
          sentMessage: "Marked",
          open: "Open quiz",
          startOver: "Sit it again",
        }}
        renderExtra={(index, selected) => {
          const item = quiz.items[index];
          const picked = selected[0];
          if (picked === undefined || !item) return null;
          const option = item.options[picked];
          const correct = option?.id === item.correctOptionId;
          return (
            <div className="mt-3 rounded-control bg-field px-2.5 py-2 text-[12.5px] leading-5 text-ink-2">
              <p className={`inline-flex items-center gap-1 font-medium ${correct ? "text-green" : "text-red"}`}>
                <Icon icon={correct ? "tick" : "cancel"} size={13} strokeWidth={2.2} />
                {correct ? "Correct" : "Not quite"}
              </p>
              <MarkdownBody text={item.explanation} className="mt-1" />
            </div>
          );
        }}
        onAnswerChange={(index, selected) => {
          const item = quiz.items[index];
          const option = item?.options[selected[0]];
          if (!item || !option) return;
          marks.current[index] = option.id === item.correctOptionId;
        }}
        onSubmitted={() => {
          const nextScore = marks.current.filter(Boolean).length;
          setScore(nextScore);
          void saveAttempt(nextScore);
        }}
      />
    </div>
  );
}
