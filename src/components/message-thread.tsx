"use client";

import type { AgentId, FlashcardSet, McqSet, RoutingDecision } from "@/agents/_shared/types";
import { AGENT_COPY } from "@/lib/agent-copy";
import type { MetsUIMessage } from "@/lib/ui-types";
import { FlashcardWidget } from "./flashcard-widget";
import { MarkdownBody } from "./markdown-body";
import { QuizWidget } from "./quiz-widget";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asMcq(value: unknown): McqSet | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  return value as McqSet;
}

function asDeck(value: unknown): FlashcardSet | null {
  if (!isRecord(value) || !Array.isArray(value.cards)) return null;
  return value as FlashcardSet;
}

function toolLabel(type: string) {
  return type.replace(/^tool-/, "").replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`);
}

export function MessageThread({
  messages,
  routing,
}: {
  messages: MetsUIMessage[];
  routing?: RoutingDecision;
}) {
  return (
    <div className="flex flex-col gap-8">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const routingPart = message.parts.find((part) => part.type === "data-routing");
        const stamp = routingPart && "data" in routingPart ? routingPart.data.agent : routing?.agent;

        return (
          <article key={message.id} className={isUser ? "pl-2" : "pl-0"}>
            {isUser ? (
              <p className="text-xs tracking-[0.18em] uppercase text-[var(--margin)]">
                Student
              </p>
            ) : (
              <AgentStamp agent={stamp ?? "orchestration"} />
            )}
            <div className={`mt-2 max-w-[46rem] ${isUser ? "text-[1.05rem] leading-7" : ""}`}>
              {message.parts.map((part, index) => {
                if (part.type === "text" && part.text.trim()) {
                  return isUser ? (
                    <p key={`${message.id}-t-${index}`}>{part.text}</p>
                  ) : (
                    <MarkdownBody key={`${message.id}-t-${index}`} text={part.text} />
                  );
                }

                if (part.type === "data-routing") {
                  return null;
                }

                if (part.type.startsWith("tool-")) {
                  const toolPart = part as {
                    type: string;
                    state?: string;
                    output?: unknown;
                    input?: unknown;
                    errorText?: string;
                  };

                  if (
                    toolPart.type === "tool-createMcqSet" &&
                    toolPart.state === "output-available"
                  ) {
                    const quiz = asMcq(toolPart.output);
                    return quiz ? (
                      <QuizWidget key={`${message.id}-q-${index}`} quiz={quiz} />
                    ) : null;
                  }

                  if (
                    toolPart.type === "tool-createFlashcards" &&
                    toolPart.state === "output-available"
                  ) {
                    const deck = asDeck(toolPart.output);
                    return deck ? (
                      <FlashcardWidget key={`${message.id}-f-${index}`} deck={deck} />
                    ) : null;
                  }

                  if (toolPart.state === "output-error") {
                    return (
                      <p
                        key={`${message.id}-e-${index}`}
                        className="mt-2 text-sm text-[var(--margin)]"
                      >
                        Tool {toolLabel(toolPart.type)} failed.
                      </p>
                    );
                  }

                  return (
                    <p
                      key={`${message.id}-tool-${index}`}
                      className="mt-2 text-xs tracking-[0.14em] uppercase text-[var(--ink-soft)]"
                    >
                      {toolPart.state === "output-available" ? "Used" : "Using"}{" "}
                      {toolLabel(toolPart.type)}
                    </p>
                  );
                }

                return null;
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AgentStamp({ agent }: { agent: AgentId }) {
  const copy = AGENT_COPY[agent];
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex h-8 min-w-8 items-center justify-center border px-2 text-[0.65rem] font-bold tracking-[0.16em] uppercase"
        style={{ borderColor: copy.tone, color: copy.tone }}
      >
        {copy.label}
      </span>
      <span className="text-xs tracking-[0.16em] uppercase text-[var(--ink-soft)]">
        {copy.subject} specialist
      </span>
    </div>
  );
}
