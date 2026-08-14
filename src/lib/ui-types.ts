import type { UIMessage } from "ai";
import type { RoutingDecision } from "@/agents/_shared/types";

export type MetsDataParts = {
  routing: RoutingDecision;
};

export type MetsUIMessage = UIMessage<never, MetsDataParts>;
