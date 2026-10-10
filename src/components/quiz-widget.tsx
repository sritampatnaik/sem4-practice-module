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
    const percentage = Math.round((score / quiz.items.length) * 100);
    const isPerfect = score === quiz.items.length;
    const isGood = percentage >= 70;
    
    return (
      <div className="rounded-xl border border-line/50 bg-gradient-to-br from-green-tint to-surface p-6 shadow-card" style={{ animation: "pop-in 260ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-green text-white shadow-md">
            <Icon icon="quiz" size={20} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-ink">{quiz.title}</h4>
            <p className="text-sm text-ink-2">Multiple Choice Quiz</p>
          </div>
        </div>
        
        <div className="mb-4 rounded-lg border border-green/20 bg-white/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-green">
              {score} / {quiz.items.length}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isPerfect ? 'bg-green text-white' : isGood ? 'bg-green-tint text-green' : 'bg-orange-tint text-orange'
            }`}>
              {isPerfect ? '🎉 Perfect!' : isGood ? '✓ Good job!' : '📚 Keep practicing'}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-3/20">
            <div 
              className="h-full rounded-full bg-green transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          {attemptState === "saving" ? (
            <p className="text-sm text-ink-3">💾 Saving your score...</p>
          ) : attemptState === "saved" ? (
            <p className="text-sm text-green">✓ Saved to your Testing progress!</p>
          ) : attemptState === "guest" ? (
            <p className="text-sm text-ink-3">ℹ️ Sign in to track your score history</p>
          ) : attemptState === "error" ? (
            <p className="text-sm text-red">⚠️ Could not save this score</p>
          ) : null}
          
          <Button 
            type="button" 
            variant="secondary" 
            size="sm" 
            onClick={() => {
              marks.current = [];
              setScore(null);
              setAttemptState("idle");
            }}
            className="w-full"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line/50 bg-surface/50 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
          <Icon icon="quiz" size={16} className="text-accent" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Multiple Choice Quiz</p>
          <h4 className="text-sm font-bold text-ink">{quiz.title}</h4>
        </div>
      </div>
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
            <div className={`mt-4 rounded-lg border p-4 ${
              correct 
                ? 'border-green/30 bg-green-tint' 
                : 'border-red/30 bg-red-tint'
            }`}>
              <p className={`mb-2 inline-flex items-center gap-2 text-sm font-bold ${
                correct ? "text-green" : "text-red"
              }`}>
                <span className={`flex size-5 items-center justify-center rounded-full ${
                  correct ? 'bg-green' : 'bg-red'
                } text-white`}>
                  <Icon icon={correct ? "tick" : "cancel"} size={12} strokeWidth={2.5} />
                </span>
                {correct ? "Correct!" : "Not quite"}
              </p>
              <MarkdownBody text={item.explanation} className="text-sm" />
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
