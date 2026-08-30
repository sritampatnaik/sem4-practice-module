import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase";

const COOKIE = "mets-auth";

export type AuthUser = {
  id: string;
  email: string;
};

type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  };
}

function asSession(value: unknown): StoredSession | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.access_token !== "string" || typeof raw.refresh_token !== "string") {
    return null;
  }
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: typeof raw.expires_at === "number" ? raw.expires_at : undefined,
  };
}

export function parseEmailPassword(body: unknown):
  | { email: string; password: string }
  | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Email and password are required." };
  }
  const raw = body as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";
  if (!email || !email.includes("@")) return { error: "Enter a valid email." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  return { email, password };
}

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already") || lower.includes("registered")) {
    return "That email already has an account. Sign in instead.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email or password is wrong.";
  }
  if (lower.includes("email not confirmed")) {
    return "This account is not ready yet. Try signing up again.";
  }
  return message;
}

async function writeSession(session: StoredSession) {
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(session), cookieOptions());
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

async function readSession(): Promise<StoredSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return asSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

function asUser(id: string, email: string | undefined): AuthUser | null {
  if (!email) return null;
  return { id, email };
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseAdmin();
  const stored = await readSession();
  if (!supabase || !stored) return null;

  const current = await supabase.auth.getUser(stored.access_token);
  if (current.data.user) {
    return asUser(current.data.user.id, current.data.user.email);
  }

  const refreshed = await supabase.auth.refreshSession({
    refresh_token: stored.refresh_token,
  });
  if (refreshed.error || !refreshed.data.session || !refreshed.data.user) {
    await clearAuthCookie();
    return null;
  }
  await writeSession({
    access_token: refreshed.data.session.access_token,
    refresh_token: refreshed.data.session.refresh_token,
    expires_at: refreshed.data.session.expires_at,
  });
  return asUser(refreshed.data.user.id, refreshed.data.user.email);
}

export async function signUpStudent(
  email: string,
  password: string,
): Promise<{ user: AuthUser } | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Supabase is not configured." };

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) return { error: friendlyAuthError(created.error.message) };

  return signInStudent(email, password);
}

export async function signInStudent(
  email: string,
  password: string,
): Promise<{ user: AuthUser } | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Supabase is not configured." };

  const signed = await supabase.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session || !signed.data.user?.email) {
    return { error: friendlyAuthError(signed.error?.message ?? "Could not sign in.") };
  }

  await writeSession({
    access_token: signed.data.session.access_token,
    refresh_token: signed.data.session.refresh_token,
    expires_at: signed.data.session.expires_at,
  });
  return {
    user: { id: signed.data.user.id, email: signed.data.user.email },
  };
}
