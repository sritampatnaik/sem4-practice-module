import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { RoutingDecision } from "@/agents/_shared/types";
import type { MetsUIMessage } from "@/lib/ui-types";
import { AgentStamp, MessageThread } from "./message-thread";

function message(id: string, role: "user" | "assistant", parts: unknown[]): MetsUIMessage {
  return { id, role, parts } as MetsUIMessage;
}

const testingRoute: RoutingDecision = {
  intent: "testing",
  subject: "physics",
  agent: "testing",
  gradeLevel: "secondary",
  rationale: "The student requested practice.",
  confidence: 0.9,
  promptVersion: "test",
};

function render(messages: MetsUIMessage[], routing?: RoutingDecision, streaming = false) {
  return renderToStaticMarkup(createElement(MessageThread, { messages, routing, streaming }));
}

test("thread renders the student's question and the specialist's answer", () => {
  const html = render([
    message("student", "user", [{ type: "text", text: "What is force?" }]),
    message("reply", "assistant", [{ type: "text", text: "Force is a push or pull." }]),
  ]);
  assert.match(html, /What is force/);
  assert.match(html, /Force is a push or pull/);
  assert.match(html, /Desk/);
});

test("thread hides empty student messages and labels failed tools", () => {
  const html = render([
    message("blank", "user", [{ type: "text", text: "  " }]),
    message("reply", "assistant", [
      { type: "tool-documentSearch", state: "output-error", errorText: "No source available" },
      { type: "text", text: "I could not find a source." },
    ]),
  ]);
  assert.doesNotMatch(html, /blank/);
  assert.match(html, /1 tool call/);
  assert.match(html, /I could not find a source/);
});

test("testing turn prepares a pending widget without exposing provisional text", () => {
  const html = render([
    message("reply", "assistant", [
      { type: "tool-createMcqSet", state: "input-streaming", input: {} },
      { type: "text", text: "Provisional answer that should be hidden" },
    ]),
  ], testingRoute, true);
  assert.match(html, /Preparing practice/);
  assert.doesNotMatch(html, /Provisional answer that should be hidden/);
});

test("testing turn renders a ready question widget instead of duplicate answer text", () => {
  const html = render([
    message("reply", "assistant", [
      {
        type: "tool-createMcqSet",
        state: "output-available",
        output: {
          title: "Forces quiz",
          subject: "physics",
          items: [{
            id: "q1",
            question: "What is a force?",
            options: [{ id: "a", label: "A push or pull" }, { id: "b", label: "A colour" }],
            correctOptionId: "a",
            explanation: "A force is a push or pull.",
            topic: "forces",
          }],
        },
      },
      { type: "text", text: "Do not show an extra explanation before the quiz" },
    ]),
  ], testingRoute);
  assert.match(html, /What is a force/);
  assert.match(html, /A push or pull/);
  assert.doesNotMatch(html, /Do not show an extra explanation before the quiz/);
});

test("testing turn renders flashcards but keeps the answers concealed", () => {
  const html = render([
    message("reply", "assistant", [{
      type: "tool-createFlashcards",
      state: "output-available",
      output: {
        title: "Motion cards",
        subject: "physics",
        cards: [{ id: "card-1", front: "Define speed", back: "Distance per unit time", topic: "Motion" }],
      },
    }]),
  ], testingRoute);
  assert.match(html, /Define speed/);
  assert.doesNotMatch(html, /Distance per unit time/);
});

test("malformed testing output falls back to the assistant's explanation", () => {
  const html = render([
    message("reply", "assistant", [
      { type: "tool-createMcqSet", state: "output-available", output: { notAQuiz: true } },
      { type: "text", text: "I could not prepare the quiz yet." },
    ]),
  ], testingRoute);
  assert.match(html, /I could not prepare the quiz yet/);
  assert.doesNotMatch(html, /Preparing practice/);
});

test("agent stamp uses the routed specialist label", () => {
  const html = renderToStaticMarkup(createElement(AgentStamp, { agent: "physics" }));
  assert.match(html, /Physics/);
});
