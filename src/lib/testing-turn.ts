export const TESTING_WIDGET_TOOL_TYPES = [
  "tool-createMcqSet",
  "tool-createFlashcards",
] as const;

export type TestingTurnKind = "widgets" | "preparing" | "prose";

export type TestingTurnLayout = {
  kind: TestingTurnKind;
  hideText: boolean;
  hideToolChips: boolean;
};

export function isTestingWidgetToolType(type: string) {
  return type === "tool-createMcqSet" || type === "tool-createFlashcards";
}

export function testingWidgetPayloadReady(state?: string) {
  return state === "output-available" || state === "input-available";
}

export function resolveTestingTurn(input: {
  agent?: string;
  streaming: boolean;
  hasReadyWidget: boolean;
  hasPendingWidget: boolean;
  hasWidgetError?: boolean;
}): TestingTurnLayout {
  if (input.hasReadyWidget) {
    return { kind: "widgets", hideText: true, hideToolChips: true };
  }

  if (input.hasWidgetError) {
    return { kind: "prose", hideText: false, hideToolChips: false };
  }

  if (input.hasPendingWidget || (input.streaming && input.agent === "testing")) {
    return { kind: "preparing", hideText: true, hideToolChips: true };
  }

  return { kind: "prose", hideText: false, hideToolChips: false };
}

export function shouldSuppressTestingBusyIndicator(input: {
  agent?: string;
  status: string;
  hasWidgetTool: boolean;
}) {
  if (input.agent !== "testing") return false;
  return input.status === "streaming" || input.hasWidgetTool;
}
