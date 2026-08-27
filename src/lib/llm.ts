import { openai } from "@ai-sdk/openai";

function readEnv(name: string) {
  const raw = process.env[name];
  if (!raw) return "";
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  const prefix = `${name}=`;
  if (value.startsWith(prefix)) {
    value = value.slice(prefix.length).trim();
  }
  return value;
}

export function getModelId() {
  return readEnv("OPENAI_MODEL") || "gpt-4o";
}

export function getModel() {
  const apiKey = readEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Copy .env.example to .env.local and add your key.",
    );
  }

  return openai(getModelId());
}
