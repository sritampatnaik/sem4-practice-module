"use client";

import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PromptLogEntry, RoutingDecision, StudentProfile } from "@/agents/_shared/types";
import { AGENT_COPY } from "@/lib/agent-copy";
import type { MetsUIMessage } from "@/lib/ui-types";
import { MessageThread } from "./message-thread";

type TracePayload = {
  langflow: { configured: boolean; reachable: boolean };
  routing: RoutingDecision[];
  logs: PromptLogEntry[];
};

export function StudioShell({
  profile,
  sessionId,
  onReset,
}: {
  profile: StudentProfile;
  sessionId: string;
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

  return (
    <div className="flex min-h-screen bg-[var(--desk)] text-[var(--ink)]">
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[oklch(0.25_0.03_55)] bg-[oklch(0.27_0.035_55)] px-5 py-6 text-[oklch(0.93_0.02_85)] lg:flex">
        <div>
          <p className="text-[0.65rem] tracking-[0.28em] uppercase text-[oklch(0.78_0.05_75)]">
            Team 5 · ISS
          </p>
          <h1
            className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl leading-none"
            style={{ fontVariationSettings: '"SOFT" 40, "WONK" 1' }}
          >
            METS
          </h1>
          <p className="mt-4 text-sm leading-6 text-[oklch(0.82_0.03_85)]">
            {profile.name}
            <br />
            {profile.gradeLevel === "jc"
              ? "Junior College"
              : profile.gradeLevel[0].toUpperCase() + profile.gradeLevel.slice(1)}
          </p>
          <dl className="mt-8 grid gap-4 text-sm">
            {(["math", "physics", "chemistry"] as const).map((subject) => (
              <div key={subject}>
                <dt className="text-[0.65rem] tracking-[0.18em] uppercase text-[oklch(0.75_0.03_85)]">
                  {subject}
                </dt>
                <dd className="mt-1 capitalize">
                  {profile.diagnostic[subject] ?? "unseen"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid gap-3">
          <Link
            href="/evals"
            className="text-left text-xs tracking-[0.16em] uppercase text-[oklch(0.78_0.04_75)]"
          >
            Agent evals
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="text-left text-xs tracking-[0.16em] uppercase text-[oklch(0.78_0.04_75)]"
          >
            New student cover
          </button>
        </div>
      </aside>

      <main className="foolscap grain relative flex min-w-0 flex-1 flex-col">
        <header className="flex items-end justify-between gap-4 px-8 pb-4 pt-6 sm:px-14">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-[var(--margin)]">
              Foolscap · last 10 chats remembered
            </p>
            <p
              className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl"
              style={{ fontVariationSettings: '"SOFT" 35, "WONK" 1' }}
            >
              {profile.name}&rsquo;s tutorial
            </p>
          </div>
          {routing ? (
            <p className="hidden text-right text-xs leading-5 text-[var(--ink-soft)] sm:block">
              Routed to {AGENT_COPY[routing.agent].label}
              <br />
              {routing.intent} · {Math.round(routing.confidence * 100)}%
            </p>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8 sm:px-14">
          {messages.length === 0 ? (
            <EmptyDesk name={profile.name} />
          ) : (
            <MessageThread messages={messages} routing={routing} />
          )}
          {busy ? (
            <p className="mt-6 text-sm italic text-[var(--ink-soft)]">
              {status === "submitted" ? "The desk is reading your question…" : "Writing…"}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm text-[var(--margin)]">
              {error.message || "The tutor could not complete that turn. Check the API key and try again."}
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="border-t border-[oklch(0.82_0.03_85)] bg-[oklch(0.97_0.015_85)] px-8 py-4 sm:px-14"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim() || busy) return;
            sendMessage({ text: input.trim() });
            setInput("");
          }}
        >
          <label className="block text-xs tracking-[0.18em] uppercase text-[var(--ink-soft)]">
            Ask to learn, or ask to be tested
          </label>
          <div className="mt-2 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!input.trim() || busy) return;
                  sendMessage({ text: input.trim() });
                  setInput("");
                }
              }}
              rows={2}
              placeholder="Explain chemical bonding for O-Level, or give me five kinematics MCQs."
              className="min-h-[3.2rem] flex-1 resize-none border-0 bg-transparent py-2 outline-none"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => stop()}
                className="border border-[var(--ink)] px-4 py-2 text-sm"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-sm text-[var(--paper)] disabled:opacity-40"
              >
                Send
              </button>
            )}
          </div>
        </form>
      </main>

      <aside className="hidden w-80 shrink-0 flex-col border-l border-[oklch(0.25_0.03_55)] bg-[oklch(0.29_0.03_55)] px-5 py-6 text-[oklch(0.93_0.02_85)] xl:flex">
        <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[oklch(0.78_0.04_75)]">
          Audit trail
        </p>
        <h2
          className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl"
          style={{ fontVariationSettings: '"SOFT" 40' }}
        >
          Routing log
        </h2>
        <p className="mt-3 text-xs leading-5 text-[oklch(0.8_0.03_85)]">
          Langflow{" "}
          {traces?.langflow.reachable
            ? "is receiving prompt logs."
            : traces?.langflow.configured
              ? "is configured but not reachable."
              : "is optional. Local JSONL logs still write to /logs."}
        </p>
        <ol className="mt-6 grid gap-4 overflow-y-auto text-sm">
          {(traces?.routing.length ? traces.routing : routing ? [routing] : []).map(
            (item, index) => (
              <li
                key={`${item.agent}-${item.rationale}-${index}`}
                className="border-t border-[oklch(0.4_0.03_55)] pt-3"
              >
                <p className="text-[0.65rem] tracking-[0.16em] uppercase text-[oklch(0.78_0.04_75)]">
                  {item.intent} → {item.agent}
                </p>
                <p className="mt-1 leading-5">{item.rationale}</p>
                <p className="mt-1 text-xs text-[oklch(0.75_0.03_85)]">
                  v{item.promptVersion} · {Math.round(item.confidence * 100)}%
                </p>
              </li>
            ),
          )}
        </ol>
      </aside>
    </div>
  );
}

function EmptyDesk({ name }: { name: string }) {
  return (
    <div className="max-w-lg pt-8">
      <p
        className="font-[family-name:var(--font-fraunces)] text-3xl leading-tight"
        style={{ fontVariationSettings: '"SOFT" 50, "WONK" 1' }}
      >
        Good afternoon, {name}.
      </p>
      <p className="mt-4 leading-7 text-[var(--ink-soft)]">
        Ask for a worked example, a syllabus check, or a short quiz. The desk
        routes you to Math, Physics, Chemistry, or Testing.
      </p>
      <ul className="mt-6 grid gap-2 text-sm text-[var(--ink-soft)]">
        <li>How do I differentiate x² sin x at H2?</li>
        <li>Convert 72 km/h to m/s and show the working.</li>
        <li>Balance Fe + O₂ → Fe₂O₃, then quiz me on redox.</li>
      </ul>
    </div>
  );
}
