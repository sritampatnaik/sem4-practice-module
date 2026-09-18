import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import type { Database } from "./database.types";

if (typeof WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: typeof ws }).WebSocket = ws;
}

function readSupabaseUrl() {
  return process.env.SUPABASE_URL?.trim() ?? "";
}

/** Legacy service_role JWT, or the Dashboard secret key (`sb_secret_...`). */
function readSupabaseSecret() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ""
  );
}

function readAnonKey() {
  return (
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

const AUTH_OPTIONS = { persistSession: false, autoRefreshToken: false } as const;

/** Privileged server client. Null when the service role / secret key is unset. */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  const url = readSupabaseUrl();
  const key = readSupabaseSecret();
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: AUTH_OPTIONS });
}

/** Auth client: service role when set, otherwise the publishable/anon key. */
export function getSupabaseAuth(): SupabaseClient<Database> | null {
  const url = readSupabaseUrl();
  const key = readSupabaseSecret() || readAnonKey();
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: AUTH_OPTIONS });
}

/** Data client. Prefers the service role; otherwise the signed-in user's JWT. */
export function getSupabaseData(accessToken?: string): SupabaseClient<Database> | null {
  const admin = getSupabaseAdmin();
  if (admin) return admin;
  const url = readSupabaseUrl();
  const anon = readAnonKey();
  if (!url || !anon || !accessToken) return null;
  return createClient<Database>(url, anon, {
    auth: AUTH_OPTIONS,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export function isSupabaseConfigured() {
  return Boolean(readSupabaseUrl() && (readSupabaseSecret() || readAnonKey()));
}
