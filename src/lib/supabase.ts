import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import type { Database } from "./database.types";

if (typeof WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: typeof ws }).WebSocket = ws;
}

/** Server-only client. Fresh each call so auth.signIn does not taint later queries. */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}
