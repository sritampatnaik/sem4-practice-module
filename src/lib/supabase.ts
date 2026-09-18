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

/** Server-only client. Fresh each call so auth.signIn does not taint later queries. */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  const url = readSupabaseUrl();
  const key = readSupabaseSecret();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured() {
  return Boolean(readSupabaseUrl() && readSupabaseSecret());
}
