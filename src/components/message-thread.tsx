"use client";

import type { AgentId, FlashcardSet, McqSet, RoutingDecision } from "@/agents/_shared/types";
import { Chip } from "@/components/ui/chip";
import { ToolChip } from "@/components/ui/tool-chip";
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
    <div className="flex flex-col gap-6">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const routingPart = message.parts.find((part) => part.type === "data-routing");
        const stamp = routingPart && "data" in routingPart ? routingPart.data.agent : routing?.agent;

        return (
          <article key={message.id} className={isUser ? "ml-auto w-full max-w-[40rem]" : "w-full"}>
            {isUser ? (
              <p className="ui-label mb-2 text-right">Student</p>
            ) : (
              <AgentStamp agent={stamp ?? "orchestration"} />
            )}
            <div
              className={
                isUser
                  ? "ui-inset px-4 py-3 text-[0.98rem] leading-7"
                  : "max-w-[46rem]"
              }
            >
              {message.parts.map((part, index) => {
                if (part.type === "text" && part.text.trim()) {
                  return (
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
                      <ToolChip
                        key={`${message.id}-e-${index}`}
                        name={toolLabel(toolPart.type)}
                        state="error"
                      />
                    );
                  }

                  return (
                    <ToolChip
                      key={`${message.id}-tool-${index}`}
                      name={toolLabel(toolPart.type)}
                      state={toolPart.state === "output-available" ? "done" : "running"}
                    />
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
    <div className="mb-2 flex items-center gap-2">
      <Chip style={{ color: copy.tone, background: copy.tint }}>
        {copy.label}
      </Chip>
      <span className="text-xs text-[var(--bui-ink-3)]">{copy.subject} specialist</span>
    </div>
  );
}
