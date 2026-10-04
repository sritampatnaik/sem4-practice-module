"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMemoryItem, PromptLogEntry, RoutingDecision, StudentProfile } from "@/agents/_shared/types";
import { ValuePill } from "@/components/atoms/ValuePill";
import { AppFrame, DeskNav } from "@/components/app-frame";
import { ConversationRail, type ConversationItem } from "@/components/conversation-rail";
import { StudentSidebar } from "@/components/student-sidebar";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { PromptBar } from "@/components/ui/prompt-bar";
import ThinkingState from "@/components/primitives/ThinkingState";
import StreamingText from "@/components/primitives/StreamingText";
import { AGENT_COPY } from "@/lib/agent-copy";
import { isTestingWidgetToolType, shouldSuppressTestingBusyIndicator } from "@/lib/testing-turn";
import type { MetsUIMessage } from "@/lib/ui-types";
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

function toUiMessages(items: ChatMemoryItem[]): MetsUIMessage[] {
  return items.map((item, index) => ({
    id: `history-${item.at}-${index}`,
    role: item.role,
    parts: [{ type: "text" as const, text: item.text }],
  }));
}

function routingTone(agent: RoutingDecision["agent"]): "neutral" | "green" | "orange" | "accent" {
  if (agent === "chemistry") return "green";
  if (agent === "physics") return "accent";
  if (agent === "math" || agent === "testing") return "orange";
  return "neutral";
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
      nav={<DeskNav />}
      actions={
        <Button type="button" variant="quiet" size="sm" className="gap-1.5" onClick={onReset}>
          <Icon icon={signedIn ? "signOut" : "guest"} size={14} />
          {signedIn ? "Sign out" : "Leave desk"}
        </Button>
      }
      sidebar={
        <StudentSidebar profile={profile} email={email} signedIn={signedIn}>
          <ConversationRail
            items={conversations}
            activeId={activeId}
            onNew={() => void startNewChat()}
            onPick={(id) => setActiveId(id)}
          />
        </StudentSidebar>
      }
      rail={<RoutingRail sessionId={activeId} />}
    >
      {loadedId === activeId ? (
        <ChatPane
          key={activeId}
          profile={profile}
          sessionId={activeId}
          signedIn={signedIn}
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
          <LoadingState label="Loading this chat" />
        </div>
      )}
    </AppFrame>
  );
}

function ChatPane({
  profile,
  sessionId,
  signedIn,
  initialMessages,
  onFirstUserMessage,
}: {
  profile: StudentProfile;
  sessionId: string;
  signedIn?: boolean;
  initialMessages: MetsUIMessage[];
  onFirstUserMessage: (text: string) => void;
}) {
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
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const hideTestingBusy = shouldSuppressTestingBusyIndicator({
    agent: routing?.agent,
    status,
    hasWidgetTool: Boolean(
      lastAssistant?.parts.some((part) => isTestingWidgetToolType(part.type)),
    ),
  });

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (messages.length === 0) onFirstUserMessage(trimmed);
    sendMessage({ text: trimmed });
  }

  return (
    <div className="flex h-[calc(100vh-3.4rem)] min-w-0 flex-col bg-gradient-to-b from-canvas to-page">
      <header className="flex items-end justify-between gap-4 border-b border-line/50 bg-surface/80 px-5 pt-6 pb-4 backdrop-blur-sm sm:px-8">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-ink">
            {profile.name}&rsquo;s desk
          </p>
          <p className="mt-1.5 text-sm text-ink-2">
            Ask questions, get expert help, and continue learning.
          </p>
        </div>
        {routing ? (
          <ValuePill className="hidden gap-1.5 sm:inline-flex" tone={routingTone(routing.agent)}>
            <Icon icon={routing.agent} size={13} />
            <span className="font-medium">{AGENT_COPY[routing.agent].label}</span>
            <span className="text-ink-3">·</span>
            <span className="text-xs">{routing.intent}</span>
            <span className="text-ink-3">·</span>
            <span className="text-xs font-semibold">{Math.round(routing.confidence * 100)}%</span>
          </ValuePill>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {messages.length === 0 ? (
            <EmptyDesk name={profile.name} onPick={send} />
          ) : (
            <MessageThread
              messages={messages}
              routing={routing}
              streaming={status === "streaming"}
              conversationId={sessionId}
              signedIn={signedIn}
            />
          )}
          {busy && !hideTestingBusy ? (
            <LoadingState
              className="mt-6"
              variant={status === "streaming" ? "Dots" : "Drive"}
              label={status === "submitted" ? "Reading your question" : "Writing"}
            />
          ) : null}
          {error ? (
            <div className="mt-4 rounded-lg border border-red/20 bg-red-tint p-4">
              <p className="text-sm font-medium text-red">
                {error.message ||
                  "The tutor could not complete that turn. Check the API key and try again."}
              </p>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-line/50 bg-surface/80 px-5 py-4 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-4xl">
          <PromptBar
            id="tutor-input"
            onSubmit={send}
            onStop={stop}
            busy={busy}
            placeholder="Explain chemical bonding for O-Level, or give me five kinematics MCQs..."
          />
        </div>
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
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Agent Routing</p>
        <h2 className="text-xl font-bold tracking-tight text-ink">Why this agent?</h2>
        <p className="mt-3 rounded-lg border border-line/50 bg-inset/30 p-3 text-xs leading-relaxed text-ink-2">
          {routing[0]
            ? routing[0].rationale
            : "After you send a question, this panel shows which specialist answered and the reasoning behind the decision."}
        </p>
      </div>
      
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {routing.length === 0 ? (
          <div className="rounded-xl border border-line/50 bg-inset/30 p-5">
            <ThinkingState
              variant="Steps"
              active="Waiting for a question"
              done="No turns yet"
              rows={[
                { primary: "Ask a question from your desk" },
                { primary: "Orchestration selects a specialist" },
                { primary: "This panel shows the decision trail" },
              ]}
            />
          </div>
        ) : (
          routing.map((item, index) => (
            <div 
              key={`${item.agent}-${item.rationale}-${index}`}
              className="rounded-xl border border-line/50 bg-surface/50 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
            >
              <ThinkingState
                variant="Reasoning"
                active={`${item.intent} → ${item.agent}`}
                done={`${item.intent} → ${item.agent} · ${Math.round(item.confidence * 100)}%`}
                rows={[
                  { primary: item.rationale },
                  { primary: `Prompt v${item.promptVersion}`, mono: true },
                ]}
              />
            </div>
          ))
        )}
      </div>
    </div>
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
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
      <div className="max-w-2xl text-center">
        <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-accent/10 p-4">
          <Icon icon="tutor" size={32} className="text-accent" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight text-ink">
          Hello, {name}
        </h2>
        <p className="mt-4 text-lg text-ink-2">
          Welcome to your personal learning desk. Ask me anything about Mathematics, Physics, or Chemistry.
        </p>
        <div className="mt-8">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-ink-3">
            Try these questions
          </p>
          <div className="grid gap-3 sm:grid-cols-1">
            {STARTERS.map((starter, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onPick(starter)}
                className="group relative overflow-hidden rounded-xl border border-line bg-surface p-4 text-left shadow-card transition-all hover:border-accent/30 hover:shadow-raised hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <Icon 
                      icon={starter.includes("differentiate") ? "math" : starter.includes("Convert") ? "physics" : "chemistry"} 
                      size={18} 
                      className="text-ink-2 transition-colors group-hover:text-accent" 
                    />
                  </div>
                  <p className="flex-1 text-sm font-medium text-ink transition-colors group-hover:text-accent">
                    {starter}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-3">
          <Icon icon="read" size={14} />
          <span>Powered by Singapore syllabus maps</span>
        </div>
      </div>
    </div>
  );
}
