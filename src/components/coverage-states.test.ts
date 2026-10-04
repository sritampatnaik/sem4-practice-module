import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConversationRail } from "./conversation-rail";
import { EvalDatasetDesk } from "./eval-dataset-desk";
import { EvalModelPicker } from "./eval-model-picker";
import BeautifulLoadingState from "./primitives/LoadingState";
import { TestingProgressPanel } from "./testing-progress-panel";
import { LoadingState } from "./ui/loading-state";
import { TaskRow } from "./ui/task-row";

test("conversation rail distinguishes an empty desk from the active thread", () => {
  const callbacks = { onNew: () => {}, onPick: () => {} };
  const empty = renderToStaticMarkup(createElement(ConversationRail, {
    ...callbacks,
    items: [],
    activeId: null,
  }));
  assert.match(empty, /No chats yet/);
  assert.match(empty, /New chat/);

  const populated = renderToStaticMarkup(createElement(ConversationRail, {
    ...callbacks,
    items: [
      { id: "first", title: "Kinematics", updatedAt: "2026-09-26T00:00:00.000Z" },
      { id: "second", title: "", updatedAt: "2026-09-26T01:00:00.000Z" },
    ],
    activeId: "first",
  }));
  assert.match(populated, /Kinematics/);
  assert.match(populated, /New chat/);
  assert.doesNotMatch(populated, /No chats yet/);
});

test("dataset desk starts with the supplied suite and no result", () => {
  const html = renderToStaticMarkup(createElement(EvalDatasetDesk, {
    initial: {
      suites: [{
        id: "physics",
        name: "Physics",
        description: "Physics teaching cases",
        kind: "teaching",
        itemCount: 0,
        items: [],
      }],
      lastRun: null,
    },
  }));
  assert.match(html, /Physics \(0\)/);
  assert.match(html, /No evals in this suite yet/);
});

test("model picker identifies the selected provider and honours a disabled compact state", () => {
  const openAi = renderToStaticMarkup(createElement(EvalModelPicker, {
    value: "gpt-4o",
    onChange: () => {},
  }));
  assert.match(openAi, /GPT-4o/);
  assert.match(openAi, /OpenAI/);

  const google = renderToStaticMarkup(createElement(EvalModelPicker, {
    value: "gemini-2.5-flash",
    onChange: () => {},
    compact: true,
    disabled: true,
  }));
  assert.match(google, /Gemini 2.5 Flash/);
  assert.match(google, /disabled=""/);
  assert.doesNotMatch(google, />Model<\/p>/);
});

test("loading variants expose their status without requiring a browser", () => {
  const dots = renderToStaticMarkup(createElement(LoadingState, {
    label: "Drawing physics diagram",
    variant: "Dots",
  }));
  assert.match(dots, /Drawing physics diagram/);
  assert.match(dots, /role="status"/);

  const surfer = renderToStaticMarkup(createElement(BeautifulLoadingState, {
    variant: "Surfer",
    videoSrc: "https://example.test/clip.mp4",
  }));
  assert.match(surfer, /Subway surfing/);
  assert.match(surfer, /example.test\/clip.mp4/);
});

test("task rows show an error state and preserve a supplied detail", () => {
  const failed = renderToStaticMarkup(createElement(TaskRow, {
    title: "Syllabus retrieval",
    detail: "No source found",
    status: "error",
  }));
  assert.match(failed, /Syllabus retrieval/);
  assert.match(failed, /No source found/);
  assert.match(failed, /data-status="error"/);

  const pending = renderToStaticMarkup(createElement(TaskRow, {
    title: "Prepare quiz",
    status: "pending",
  }));
  assert.match(pending, /Prepare quiz/);
  assert.doesNotMatch(pending, /data-status=/);
});

test("testing progress explains that score history requires sign-in", () => {
  const html = renderToStaticMarkup(createElement(TestingProgressPanel, {
    signedIn: false,
  }));
  assert.match(html, /Testing progress/);
  assert.match(html, /Sign in to save quiz scores/);
  assert.doesNotMatch(html, /Loading saved score history/);
});
