import { openai } from "@ai-sdk/openai";

export function getModelId() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o";
}

export function getModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Copy .env.example to .env.local and add your key.",
    );
  }

  return openai(getModelId());
}
