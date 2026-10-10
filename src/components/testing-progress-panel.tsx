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
    <div className="rounded-xl border border-line/50 bg-inset/50 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Testing Progress</p>
        {signedIn ? (
          <ValuePill className="ml-0 gap-1 shadow-sm" tone="accent">
            <Icon icon="quiz" size={11} />
            <span className="text-xs">MCQ</span>
          </ValuePill>
        ) : null}
      </div>

      {!signedIn ? (
        <div className="rounded-lg border border-line/50 bg-surface/50 p-4 text-center">
          <Icon icon="quiz" size={20} className="mx-auto mb-2 text-ink-3" />
          <p className="text-xs leading-relaxed text-ink-3">
            Sign in to save quiz scores and track your topic-by-topic progress over time.
          </p>
        </div>
      ) : state.loading ? (
        <div className="rounded-lg border border-line/50 bg-surface/50 p-4 text-center">
          <div className="mb-2 inline-flex size-5 animate-spin items-center justify-center rounded-full border-2 border-accent/30 border-t-accent" />
          <p className="text-xs text-ink-3">Loading score history...</p>
        </div>
      ) : state.error ? (
        <div className="rounded-lg border border-red/30 bg-red-tint p-4">
          <p className="text-xs font-medium text-red">{state.error}</p>
        </div>
      ) : state.summaries.length === 0 ? (
        <div className="rounded-lg border border-line/50 bg-surface/50 p-4 text-center">
          <Icon icon="flashcards" size={20} className="mx-auto mb-2 text-ink-3" />
          <p className="text-xs leading-relaxed text-ink-3">
            Complete your first MCQ quiz to start tracking your improvement.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.summaries.map((summary) => {
            const percentage = Math.round((summary.latest.score / summary.latest.totalQuestions) * 100);
            return (
              <div 
                key={`${summary.subject}:${summary.mode}:${summary.topicKey}`} 
                className="group rounded-lg border border-line/50 bg-surface/80 p-3 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-2 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{summary.topicLabel}</p>
                    <p className="mt-0.5 text-xs text-ink-2">{summary.title}</p>
                  </div>
                  <ValuePill className="ml-0 gap-1 shadow-sm" tone={trendTone(summary.trend)}>
                    <Icon icon={summary.trend === "improving" ? "tick" : summary.trend === "regressing" ? "cancel" : "quiz"} size={10} />
                    <span className="text-xs font-semibold">{trendLabel(summary.trend)}</span>
                  </ValuePill>
                </div>
                
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-3/20">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      percentage >= 80 ? 'bg-green' : percentage >= 60 ? 'bg-accent' : 'bg-orange'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
                  <span className="font-medium">{subjectLabel(summary.subject)}</span>
                  <span>•</span>
                  <span>{summary.attemptsCount} {summary.attemptsCount === 1 ? "attempt" : "attempts"}</span>
                  <span>•</span>
                  <span className="font-semibold text-accent">Latest: {scoreLabel(summary.latest.score, summary.latest.totalQuestions)}</span>
                  <span>•</span>
                  <span className="font-semibold text-green">Best: {scoreLabel(summary.best.score, summary.best.totalQuestions)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
