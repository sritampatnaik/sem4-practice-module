"use client";

import type { ReactNode } from "react";
import type { AgentId, FlashcardSet, McqSet, RoutingDecision } from "@/agents/_shared/types";
import { EntityChip } from "@/components/atoms/EntityChip";
import { ChatSection, ChatUserBubble } from "@/components/primitives/ChatComposer";
import ToolChips, { type ToolStep } from "@/components/primitives/ToolChips";
import { AGENT_COPY } from "@/lib/agent-copy";
import {
  isTestingWidgetToolType,
  resolveTestingTurn,
  testingWidgetPayloadReady,
} from "@/lib/testing-turn";
import type { MetsUIMessage } from "@/lib/ui-types";
import { FlashcardWidget } from "./flashcard-widget";
import { MarkdownBody } from "./markdown-body";
import { QuizWidget } from "./quiz-widget";
import { LoadingState } from "./ui/loading-state";

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

function toolIcon(type: string, state?: string) {
  if (state === "output-error") return "think";
  if (type === "tool-createMcqSet") return "quiz";
  if (type === "tool-createFlashcards") return "flashcards";
  if (type.toLowerCase().includes("syllabus") || type.toLowerCase().includes("search")) {
    return "read";
  }
  if (type.toLowerCase().includes("run") || type.toLowerCase().includes("eval")) return "run";
  return "think";
}

export function MessageThread({
  messages,
  routing,
  streaming = false,
}: {
  messages: MetsUIMessage[];
  routing?: RoutingDecision;
  streaming?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {messages.map((message, messageIndex) => {
        const isUser = message.role === "user";
        const routingPart = message.parts.find((part) => part.type === "data-routing");
        const stamp = routingPart && "data" in routingPart ? routingPart.data.agent : undefined;
        const agent = stamp ?? (messageIndex === messages.length - 1 ? routing?.agent : undefined) ?? "orchestration";
        const copy = AGENT_COPY[agent];
        const streamingThis = streaming && messageIndex === messages.length - 1 && !isUser;

        if (isUser) {
          const text = message.parts
            .filter((part) => part.type === "text")
            .map((part) => ("text" in part ? part.text : ""))
            .join("\n")
            .trim();
          if (!text) return null;
          return (
            <ChatUserBubble key={message.id}>
              <MarkdownBody text={text} />
            </ChatUserBubble>
          );
        }

        const widgets: Array<{ key: string; node: ReactNode }> = [];
        const steps: ToolStep[] = [];
        const textParts: string[] = [];
        let hasPendingWidget = false;
        let hasWidgetError = false;

        message.parts.forEach((part, index) => {
          if (part.type === "text" && part.text.trim()) {
            textParts.push(part.text);
            return;
          }
          if (part.type === "data-routing") return;
          if (!part.type.startsWith("tool-")) return;

          const toolPart = part as {
            type: string;
            state?: string;
            output?: unknown;
            input?: unknown;
            errorText?: string;
          };

          if (isTestingWidgetToolType(toolPart.type)) {
            if (toolPart.state === "output-error") {
              hasWidgetError = true;
            } else if (testingWidgetPayloadReady(toolPart.state)) {
              if (toolPart.type === "tool-createMcqSet") {
                const quiz = asMcq(toolPart.output) ?? asMcq(toolPart.input);
                if (quiz) {
                  widgets.push({
                    key: `${message.id}-q-${index}`,
                    node: <QuizWidget quiz={quiz} />,
                  });
                  return;
                }
              }
              if (toolPart.type === "tool-createFlashcards") {
                const deck = asDeck(toolPart.output) ?? asDeck(toolPart.input);
                if (deck) {
                  widgets.push({
                    key: `${message.id}-f-${index}`,
                    node: <FlashcardWidget deck={deck} />,
                  });
                  return;
                }
              }
              hasWidgetError = true;
            } else {
              hasPendingWidget = true;
              return;
            }
          }

          const name = toolLabel(toolPart.type).trim();
          const state = toolPart.state === "output-error" ? "error" : toolPart.state === "output-available" ? "done" : "running";
          steps.push({
            icon: toolIcon(toolPart.type, toolPart.state),
            label: name || `tool ${index + 1}`,
            chip: state === "error" ? "Failed" : state === "done" ? "Done" : "Running",
            mono: false,
            detailMono: false,
            detail: [
              {
                text:
                  toolPart.state === "output-error"
                    ? toolPart.errorText || "That tool did not finish."
                    : state === "done"
                      ? "Returned a result for this turn."
                      : "Still running.",
              },
            ],
          });
        });

        const uniqueSteps = steps.map((step, index) => ({
          ...step,
          label: steps.filter((item) => item.label === step.label).length > 1 ? `${step.label} ${index + 1}` : step.label,
        }));
        const turn = resolveTestingTurn({
          agent,
          streaming: streamingThis,
          hasReadyWidget: widgets.length > 0,
          hasPendingWidget,
          hasWidgetError,
        });
        const visibleSteps = turn.hideToolChips ? [] : uniqueSteps;
        const visibleText = turn.hideText ? [] : textParts;

        return (
          <article key={message.id} className="w-full max-w-[46rem]">
            <div className="mb-2">
              <EntityChip name={copy.label} color={copy.swatch} monogram={copy.label.charAt(0)} />
            </div>
            {turn.kind === "widgets" ? (
              <div className="flex flex-col gap-1">
                {widgets.map((widget) => (
                  <div key={widget.key}>{widget.node}</div>
                ))}
              </div>
            ) : turn.kind === "preparing" ? (
              <LoadingState className="mt-1" variant="Dots" label="Preparing practice" />
            ) : (
              <ChatSection label={copy.label} sub="specialist" resolving={false}>
                {visibleSteps.length > 0 ? (
                  <ToolChips
                    steps={visibleSteps}
                    diffs={[]}
                    labels={{
                      header: `${visibleSteps.length} tool call${visibleSteps.length === 1 ? "" : "s"}`,
                      more: "",
                    }}
                  />
                ) : null}
                {visibleText.map((text, index) => (
                  <MarkdownBody key={`${message.id}-t-${index}`} text={text} />
                ))}
              </ChatSection>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function AgentStamp({ agent }: { agent: AgentId }) {
  const copy = AGENT_COPY[agent];
  return <EntityChip name={copy.label} color={copy.swatch} monogram={copy.label.charAt(0)} />;
}
