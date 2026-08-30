"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PromptLogEntry, RoutingDecision, StudentProfile } from "@/agents/_shared/types";
import { schoolGradeLabel } from "@/agents/_shared/types";
import { AppFrame, NavLink } from "@/components/app-frame";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FollowUps } from "@/components/ui/follow-ups";
import { LoadingState } from "@/components/ui/loading-state";
import { PromptBar } from "@/components/ui/prompt-bar";
import { Thinking } from "@/components/ui/thinking";
import { AGENT_COPY } from "@/lib/agent-copy";
import type { MetsUIMessage } from "@/lib/ui-types";
import { MarkdownBody } from "./markdown-body";
import { MessageThread } from "./message-thread";

type TracePayload = {
  langflow: { configured: boolean; reachable: boolean };
  routing: RoutingDecision[];
  logs: PromptLogEntry[];
};

const STARTERS = [
  "How do I differentiate x² sin x at H2?",
  "Convert 72 km/h to m/s and show the working.",
  "Balance Fe + O₂ → Fe₂O₃, then quiz me on redox.",
];

function gradeLabel(profile: StudentProfile) {
  return schoolGradeLabel(profile.grade, profile.gradeLevel);
}

export function StudioShell({
  profile,
  sessionId,
  email,
  onReset,
}: {
  profile: StudentProfile;
  sessionId: string;
  email?: string;
  onReset: () => void;
}) {
  const [input, setInput] = useState("");
  const [traces, setTraces] = useState<TracePayload | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { profile, sessionId },
      }),
    [profile, sessionId],
  );

  const { messages, sendMessage, status, error, stop } = useChat<MetsUIMessage>({
    transport,
  });

  const latestRouting = [...messages]
    .reverse()
    .flatMap((message) => message.parts)
    .find((part) => part.type === "data-routing");

  const routing =
    latestRouting && "data" in latestRouting ? latestRouting.data : traces?.routing[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/traces?sessionId=${sessionId}`);
      if (response.ok) {
        setTraces((await response.json()) as TracePayload);
      }
    };
    void load();
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
  }, [sessionId, messages.length]);

  const busy = status === "submitted" || status === "streaming";

  function submit() {
    if (!input.trim() || busy) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }

  return (
    <AppFrame
      nav={
        <>
          <NavLink href="/">Tutor</NavLink>
          <NavLink href="/evals">Evals</NavLink>
        </>
      }
      actions={
        <Button type="button" variant="ghost" onClick={onReset}>
          Sign out
        </Button>
      }
      sidebar={
        <>
          <div className="flex-1">
            <p className="ui-label">Student</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">{profile.name}</h1>
            <p className="mt-1 text-sm text-[var(--bui-ink-2)]">{gradeLabel(profile)}</p>
            {email ? (
              <p className="mt-1 truncate text-xs text-[var(--bui-ink-3)]">{email}</p>
            ) : null}
            <dl className="mt-8 grid gap-4">
              {(["math", "physics", "chemistry"] as const).map((subject) => (
                <div key={subject}>
                  <dt className="ui-label">{subject}</dt>
                  <dd className="mt-1 text-sm capitalize">
                    {profile.diagnostic[subject] ?? "unseen"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      }
      rail={
        <>
          <p className="ui-label">Audit trail</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Routing log</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--bui-ink-2)]">
            Langflow{" "}
            {traces?.langflow.reachable
              ? "is receiving prompt logs."
              : traces?.langflow.configured
                ? "is configured but not reachable."
                : "is optional. Local JSONL logs still write to /logs."}
          </p>
          <ol className="mt-5 grid gap-3 overflow-y-auto text-sm">
            {(traces?.routing.length ? traces.routing : routing ? [routing] : []).map(
              (item, index) => (
                <li key={`${item.agent}-${item.rationale}-${index}`}>
                  <Thinking
                    defaultOpen={index === 0}
                    summary={`${item.intent} → ${item.agent} · ${Math.round(item.confidence * 100)}%`}
                  >
                    <p className="leading-5 text-[var(--bui-ink)]">{item.rationale}</p>
                    <p className="mt-1 text-xs text-[var(--bui-ink-3)]">
                      v{item.promptVersion}
                    </p>
                  </Thinking>
                </li>
              ),
            )}
          </ol>
        </>
      }
    >
      <div className="flex h-[calc(100vh-3.4rem)] min-w-0 flex-col">
        <header className="flex items-end justify-between gap-4 px-5 pt-5 pb-3 sm:px-8">
          <div>
            <p className="text-2xl font-semibold tracking-tight">
              {profile.name}&rsquo;s session
            </p>
          </div>
          {routing ? (
            <Chip className="hidden sm:inline-flex">
              {AGENT_COPY[routing.agent].label} · {routing.intent} ·{" "}
              {Math.round(routing.confidence * 100)}%
            </Chip>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-8">
          {messages.length === 0 ? (
            <EmptyDesk
              name={profile.name}
              onPick={(text) => {
                setInput(text);
              }}
            />
          ) : (
            <MessageThread messages={messages} routing={routing} />
          )}
          {busy ? (
            <LoadingState
              className="mt-5"
              label={status === "submitted" ? "Reading your question" : "Writing"}
            />
          ) : null}
          {error ? (
            <p className="mt-4 text-sm text-[var(--bui-red)]">
              {error.message ||
                "The tutor could not complete that turn. Check the API key and try again."}
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="px-5 pb-5 sm:px-8">
          <PromptBar
            id="tutor-input"
            value={input}
            onChange={setInput}
            onSubmit={submit}
            onStop={stop}
            busy={busy}
            placeholder="Explain chemical bonding for O-Level, or give me five kinematics MCQs."
          />
        </div>
      </div>
    </AppFrame>
  );
}

function EmptyDesk({
  name,
  onPick,
}: {
  name: string;
  onPick: (text: string) => void;
}) {
  return (
    <div className="max-w-lg pt-6">
      <p className="text-3xl font-semibold tracking-tight">Hello, {name}.</p>
      <div className="mt-3 text-[var(--bui-ink-2)]">
        <MarkdownBody
          text={String.raw`Ask for a worked example, a syllabus check, or a short quiz. METS routes you to Math, Physics, Chemistry, or Testing. Equations typeset as maths, for example $F = ma$ or $$x = \dfrac{-b \pm \sqrt{b^{2}-4ac}}{2a}.$$`}
        />
      </div>
      <div className="mt-5">
        <FollowUps items={STARTERS} onPick={onPick} />
      </div>
    </div>
  );
}
