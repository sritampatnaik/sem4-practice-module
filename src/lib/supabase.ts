import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import type { Database } from "./database.types";

if (typeof WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: typeof ws }).WebSocket = ws;
}

export type SupabaseKeyKind =
  | "anon"
  | "publishable"
  | "service_role"
  | "secret"
  | "unknown";

function readSupabaseUrl() {
  return process.env.SUPABASE_URL?.trim() ?? "";
}

function envKeys() {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const name of [
    "SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
  ] as const) {
    const value = process.env[name]?.trim() ?? "";
    if (!value || seen.has(value)) continue;
    seen.add(value);
    keys.push(value);
  }
  return keys;
}

function decodeJwtPayload(token: string): { role?: unknown } | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as { role?: unknown };
  } catch {
    return null;
  }
}

/** Classify a key by its value, not the env var it was pasted into. */
export function classifySupabaseKey(key: string): SupabaseKeyKind {
  const trimmed = key.trim();
  if (!trimmed) return "unknown";
  if (trimmed.startsWith("sb_publishable_")) return "publishable";
  if (trimmed.startsWith("sb_secret_")) return "secret";
  if (trimmed.startsWith("eyJ")) {
    const role = decodeJwtPayload(trimmed)?.role;
    if (role === "anon") return "anon";
    if (role === "service_role") return "service_role";
  }
  return "unknown";
}

/** Legacy anon JWT first so Auth can send a real Bearer; else publishable. */
function readPublicKey() {
  const keys = envKeys();
  return (
    keys.find((key) => classifySupabaseKey(key) === "anon") ||
    keys.find((key) => classifySupabaseKey(key) === "publishable") ||
    ""
  );
}

function readPrivilegedKey() {
  const keys = envKeys();
  return (
    keys.find((key) => classifySupabaseKey(key) === "service_role") ||
    keys.find((key) => classifySupabaseKey(key) === "secret") ||
    ""
  );
}

const AUTH_OPTIONS = { persistSession: false, autoRefreshToken: false } as const;

/**
 * New `sb_publishable_` / `sb_secret_` keys are not JWTs. supabase-js still
 * copies them onto `Authorization: Bearer`, and GoTrue Auth Admin then
 * responds "This endpoint requires a valid Bearer token". Strip only those
 * opaque Bearers; user access-token JWTs stay in place.
 */
function fetchWithoutOpaqueBearer(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const authorization = headers.get("Authorization");
  if (
    authorization &&
    /^Bearer\s+sb_(?:publishable|secret)_/i.test(authorization.trim())
  ) {
    headers.delete("Authorization");
  }
  return fetch(input, { ...init, headers });
}

function createServerClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: AUTH_OPTIONS,
    global: { fetch: fetchWithoutOpaqueBearer },
  });
}

/** Privileged server client. Null unless a real service_role JWT or sb_secret is set. */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  const url = readSupabaseUrl();
  const key = readPrivilegedKey();
  if (!url || !key) return null;
  return createServerClient(url, key);
}

/** Auth client. Always a public anon/publishable key — never the secret. */
export function getSupabaseAuth(): SupabaseClient<Database> | null {
  const url = readSupabaseUrl();
  const key = readPublicKey();
  if (!url || !key) return null;
  return createServerClient(url, key);
}

/** Data client. Prefers the service role; otherwise the signed-in user's JWT. */
export function getSupabaseData(accessToken?: string): SupabaseClient<Database> | null {
  const admin = getSupabaseAdmin();
  if (admin) return admin;
  const url = readSupabaseUrl();
  const anon = readPublicKey();
  if (!url || !anon || !accessToken) return null;
  return createClient<Database>(url, anon, {
    auth: AUTH_OPTIONS,
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
      fetch: fetchWithoutOpaqueBearer,
    },
  });
}

export function isSupabaseAuthConfigured() {
  return Boolean(readSupabaseUrl() && readPublicKey());
}

export function isSupabaseConfigured() {
  return Boolean(readSupabaseUrl() && (readPublicKey() || readPrivilegedKey()));
}
