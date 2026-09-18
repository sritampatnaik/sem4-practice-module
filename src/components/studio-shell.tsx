"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMemoryItem, PromptLogEntry, RoutingDecision, StudentProfile } from "@/agents/_shared/types";
import { schoolGradeLabel } from "@/agents/_shared/types";
import { AppFrame, NavLink } from "@/components/app-frame";
import { ConversationRail, type ConversationItem } from "@/components/conversation-rail";
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

function toUiMessages(items: ChatMemoryItem[]): MetsUIMessage[] {
  return items.map((item, index) => ({
    id: `history-${item.at}-${index}`,
    role: item.role,
    parts: [{ type: "text" as const, text: item.text }],
  }));
}

export function StudioShell({
  profile,
  sessionId,
  email,
  signedIn,
  onReset,
}: {
  profile: StudentProfile;
  sessionId: string;
  email?: string;
  signedIn?: boolean;
  onReset: () => void;
}) {
  const [conversations, setConversations] = useState<ConversationItem[]>([
    { id: sessionId, title: "New chat", updatedAt: new Date().toISOString() },
  ]);
  const [activeId, setActiveId] = useState(sessionId);
  const [history, setHistory] = useState<MetsUIMessage[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(signedIn ? null : sessionId);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void fetch("/api/conversations")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { conversations?: ConversationItem[] } | null) => {
        if (cancelled || !payload?.conversations?.length) return;
        setConversations(payload.conversations);
      })
      .catch(() => {
        /* Keep the current thread if the list cannot be loaded. */
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void fetch(`/api/conversations/${activeId}`)
      .then((response) => (response.ok ? response.json() : { messages: [] }))
      .then((payload: { messages?: ChatMemoryItem[] }) => {
        if (cancelled) return;
        setHistory(toUiMessages(payload.messages ?? []));
        setLoadedId(activeId);
      })
      .catch(() => {
        if (cancelled) return;
        setHistory([]);
        setLoadedId(activeId);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId, signedIn]);

  function openThread(id: string, messages: MetsUIMessage[] = []) {
    setActiveId(id);
    setHistory(messages);
    setLoadedId(id);
  }

  async function startNewChat() {
    if (!signedIn) {
      const id = crypto.randomUUID();
      setConversations((current) => [
        { id, title: "New chat", updatedAt: new Date().toISOString() },
        ...current,
      ]);
      openThread(id);
      return;
    }
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        conversation?: ConversationItem;
      };
      if (!payload.conversation) return;
      setConversations((current) => [payload.conversation!, ...current]);
      openThread(payload.conversation.id);
    } catch {
      /* Keep the current thread if a new one cannot be created. */
    }
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
          {signedIn ? "Sign out" : "Leave desk"}
        </Button>
      }
      sidebar={
        <>
          <div>
            <p className="ui-label">Student</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">{profile.name}</h1>
            <p className="mt-1 text-sm text-ink-2">{gradeLabel(profile)}</p>
            {email ? <p className="mt-1 truncate text-xs text-ink-3">{email}</p> : null}
            <dl className="mt-6 grid gap-3">
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
          <ConversationRail
            items={conversations}
            activeId={activeId}
            onNew={() => void startNewChat()}
            onPick={(id) => setActiveId(id)}
          />
        </>
      }
      rail={<RoutingRail sessionId={activeId} />}
    >
      {loadedId === activeId ? (
        <ChatPane
          key={activeId}
          profile={profile}
          sessionId={activeId}
          initialMessages={history}
          onFirstUserMessage={(text) => {
            setConversations((current) =>
              current.map((item) =>
                item.id === activeId && item.title === "New chat"
                  ? { ...item, title: text.slice(0, 48) }
                  : item,
              ),
            );
          }}
        />
      ) : (
        <div className="flex h-[calc(100vh-3.4rem)] items-center px-8">
          <p className="text-sm text-ink-2">Loading this chat…</p>
        </div>
      )}
    </AppFrame>
  );
}

function ChatPane({
  profile,
  sessionId,
  initialMessages,
  onFirstUserMessage,
}: {
  profile: StudentProfile;
  sessionId: string;
  initialMessages: MetsUIMessage[];
  onFirstUserMessage: (text: string) => void;
}) {
  const [input, setInput] = useState("");
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
    messages: initialMessages,
  });

  const latestRouting = [...messages]
    .reverse()
    .flatMap((message) => message.parts)
    .find((part) => part.type === "data-routing");

  const routing =
    latestRouting && "data" in latestRouting ? latestRouting.data : undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (messages.length === 0) onFirstUserMessage(trimmed);
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-3.4rem)] min-w-0 flex-col">
      <header className="flex items-end justify-between gap-4 px-5 pt-5 pb-3 sm:px-8">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {profile.name}&rsquo;s desk
          </p>
          <p className="mt-1 text-sm text-ink-2">
            Ask, then pick up the same thread later.
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
          <EmptyDesk name={profile.name} onPick={send} />
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
          <p className="mt-4 text-sm text-red">
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
          onSubmit={() => send(input)}
          onStop={stop}
          busy={busy}
          placeholder="Explain chemical bonding for O-Level, or give me five kinematics MCQs."
        />
      </div>
    </div>
  );
}

function RoutingRail({ sessionId }: { sessionId: string }) {
  const [traces, setTraces] = useState<TracePayload | null>(null);

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
  }, [sessionId]);

  const routing = traces?.routing ?? [];

  return (
    <>
      <p className="ui-label">Audit trail</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">Why this agent</h2>
      <p className="mt-2 text-xs leading-5 text-ink-2">
        {routing[0]
          ? routing[0].rationale
          : "After you send a question, this rail shows which specialist answered and why."}
      </p>
      <ol className="mt-5 grid gap-3 overflow-y-auto text-sm">
        {routing.map((item, index) => (
          <li key={`${item.agent}-${item.rationale}-${index}`}>
            <Thinking
              defaultOpen={index === 0}
              summary={`${item.intent} → ${item.agent} · ${Math.round(item.confidence * 100)}%`}
            >
              <p className="leading-5 text-ink">{item.rationale}</p>
              <p className="mt-1 text-xs text-ink-3">v{item.promptVersion}</p>
            </Thinking>
          </li>
        ))}
      </ol>
    </>
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
      <div className="mt-3 text-ink-2">
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
