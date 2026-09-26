"use client";

import { useEffect, useState } from "react";
import type { TestingAttemptSummary } from "@/agents/testing/score-history";
import { ValuePill } from "@/components/atoms/ValuePill";
import { Icon } from "@/components/icons";

type ProgressState = {
  loading: boolean;
  summaries: TestingAttemptSummary[];
  error: string | null;
};

function trendTone(trend: TestingAttemptSummary["trend"]): "accent" | "green" | "orange" | "neutral" {
  if (trend === "improving") return "green";
  if (trend === "regressing") return "orange";
  if (trend === "stable") return "accent";
  return "neutral";
}

function trendLabel(trend: TestingAttemptSummary["trend"]) {
  if (trend === "improving") return "Improving";
  if (trend === "regressing") return "Regressing";
  if (trend === "stable") return "Stable";
  return "New";
}

function subjectLabel(subject: TestingAttemptSummary["subject"]) {
  if (subject === "math") return "Maths";
  if (subject === "physics") return "Physics";
  return "Chemistry";
}

function scoreLabel(score: number, totalQuestions: number) {
  return `${score}/${totalQuestions}`;
}

export function TestingProgressPanel({ signedIn }: { signedIn?: boolean }) {
  const [state, setState] = useState<ProgressState>({
    loading: Boolean(signedIn),
    summaries: [],
    error: null,
  });

  useEffect(() => {
    if (!signedIn) return;

    let cancelled = false;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await fetch("/api/testing-progress?limit=6");
        const payload = (await response.json().catch(() => ({}))) as {
          summaries?: TestingAttemptSummary[];
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          setState({
            loading: false,
            summaries: [],
            error: payload.error ?? "Could not load progress right now.",
          });
          return;
        }

        setState({
          loading: false,
          summaries: payload.summaries ?? [],
          error: null,
        });
      } catch {
        if (cancelled) return;
        setState({
          loading: false,
          summaries: [],
          error: "Could not load progress right now.",
        });
      }
    };

    const handleRefresh = () => {
      void load();
    };

    void load();
    window.addEventListener("testing-progress-updated", handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener("testing-progress-updated", handleRefresh);
    };
  }, [signedIn]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-2">
        <p className="ui-label">Testing progress</p>
        {signedIn ? (
          <ValuePill className="ml-0 gap-1" tone="accent">
            <Icon icon="quiz" size={12} />
            MCQ
          </ValuePill>
        ) : null}
      </div>

      {!signedIn ? (
        <p className="mt-2 rounded-lg bg-field px-3 py-2 text-[12.5px] leading-5 text-ink-3">
          Sign in to save quiz scores and track topic-by-topic progress.
        </p>
      ) : state.loading ? (
        <p className="mt-2 rounded-lg bg-field px-3 py-2 text-[12.5px] leading-5 text-ink-3">
          Loading saved score history…
        </p>
      ) : state.error ? (
        <p className="mt-2 rounded-lg bg-field px-3 py-2 text-[12.5px] leading-5 text-red">
          {state.error}
        </p>
      ) : state.summaries.length === 0 ? (
        <p className="mt-2 rounded-lg bg-field px-3 py-2 text-[12.5px] leading-5 text-ink-3">
          Complete a Testing MCQ while signed in to start tracking improvement.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {state.summaries.map((summary) => (
            <div key={`${summary.subject}:${summary.mode}:${summary.topicKey}`} className="rounded-xl bg-field px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-sm font-medium text-ink">{summary.topicLabel}</p>
                <ValuePill className="ml-0 gap-1" tone={trendTone(summary.trend)}>
                  {trendLabel(summary.trend)}
                </ValuePill>
              </div>
              <p className="mt-1 text-[12.5px] text-ink-2">{summary.title}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-3">
                <span>{subjectLabel(summary.subject)}</span>
                <span>{summary.attemptsCount} attempt{summary.attemptsCount === 1 ? "" : "s"}</span>
                <span>Latest {scoreLabel(summary.latest.score, summary.latest.totalQuestions)}</span>
                <span>Best {scoreLabel(summary.best.score, summary.best.totalQuestions)}</span>
                {summary.previous ? (
                  <span>Previous {scoreLabel(summary.previous.score, summary.previous.totalQuestions)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
