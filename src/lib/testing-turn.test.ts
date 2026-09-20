import assert from "node:assert/strict";
import {
  isTestingWidgetToolType,
  resolveTestingTurn,
  shouldSuppressTestingBusyIndicator,
  testingWidgetPayloadReady,
} from "./testing-turn";

assert.equal(isTestingWidgetToolType("tool-createMcqSet"), true);
assert.equal(isTestingWidgetToolType("tool-createFlashcards"), true);
assert.equal(isTestingWidgetToolType("tool-documentSearchMath"), false);

assert.equal(testingWidgetPayloadReady("input-available"), true);
assert.equal(testingWidgetPayloadReady("output-available"), true);
assert.equal(testingWidgetPayloadReady("input-streaming"), false);
assert.equal(testingWidgetPayloadReady("output-error"), false);

const widgets = resolveTestingTurn({
  agent: "testing",
  streaming: true,
  hasReadyWidget: true,
  hasPendingWidget: false,
});
assert.deepEqual(widgets, { kind: "widgets", hideText: true, hideToolChips: true });

const stillWidgetsAfterStream = resolveTestingTurn({
  agent: "testing",
  streaming: false,
  hasReadyWidget: true,
  hasPendingWidget: false,
});
assert.equal(stillWidgetsAfterStream.kind, "widgets");
assert.equal(stillWidgetsAfterStream.hideText, true);

const pending = resolveTestingTurn({
  agent: "testing",
  streaming: true,
  hasReadyWidget: false,
  hasPendingWidget: true,
});
assert.deepEqual(pending, { kind: "preparing", hideText: true, hideToolChips: true });

const streamingBeforeTools = resolveTestingTurn({
  agent: "testing",
  streaming: true,
  hasReadyWidget: false,
  hasPendingWidget: false,
});
assert.deepEqual(streamingBeforeTools, {
  kind: "preparing",
  hideText: true,
  hideToolChips: true,
});

const clarifyingQuestion = resolveTestingTurn({
  agent: "testing",
  streaming: false,
  hasReadyWidget: false,
  hasPendingWidget: false,
});
assert.deepEqual(clarifyingQuestion, {
  kind: "prose",
  hideText: false,
  hideToolChips: false,
});

const widgetError = resolveTestingTurn({
  agent: "testing",
  streaming: false,
  hasReadyWidget: false,
  hasPendingWidget: false,
  hasWidgetError: true,
});
assert.deepEqual(widgetError, { kind: "prose", hideText: false, hideToolChips: false });

const mathStream = resolveTestingTurn({
  agent: "math",
  streaming: true,
  hasReadyWidget: false,
  hasPendingWidget: false,
});
assert.equal(mathStream.kind, "prose");
assert.equal(mathStream.hideText, false);

assert.equal(
  shouldSuppressTestingBusyIndicator({
    agent: "testing",
    status: "streaming",
    hasWidgetTool: false,
  }),
  true,
);
assert.equal(
  shouldSuppressTestingBusyIndicator({
    agent: "testing",
    status: "ready",
    hasWidgetTool: true,
  }),
  true,
);
assert.equal(
  shouldSuppressTestingBusyIndicator({
    agent: "math",
    status: "streaming",
    hasWidgetTool: false,
  }),
  false,
);
assert.equal(
  shouldSuppressTestingBusyIndicator({
    agent: "testing",
    status: "submitted",
    hasWidgetTool: false,
  }),
  false,
);

console.log("testing-turn layout tests passed");
