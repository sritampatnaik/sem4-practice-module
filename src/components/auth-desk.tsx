"use client";

import { useState } from "react";
import { EntityChip } from "@/components/atoms/EntityChip";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";

export type AuthPayload = {
  user: { id: string; email: string };
  profile: import("@/agents/_shared/types").StudentProfile | null;
  sessionId: string;
};

export function AuthDesk({
  onSignedIn,
  configured = true,
}: {
  onSignedIn: (payload: AuthPayload) => void;
  configured?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signup = mode === "signup";

  async function submit() {
    if (!configured) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: signup ? "signup" : "login",
          email,
          password,
        }),
      });
      const payload = (await response.json()) as AuthPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not sign in.");
      if (!payload.user || !payload.sessionId) {
        throw new Error("Could not start a student session.");
      }
      onSignedIn({
        user: payload.user,
        profile: payload.profile,
        sessionId: payload.sessionId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="ui-card w-full max-w-xl px-7 py-8 sm:px-9 sm:py-10">
        <EntityChip name="METS" color="#111827" monogram="M" className="ml-0" />
        <p className="ui-label mt-4">NUS-ISS Practice Module · Team 5</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          METS
        </h1>
        <p className="mt-3 max-w-md text-[0.95rem] leading-6 text-ink-2">
          {signup
            ? "Create an account so we can keep your name, year, and previous chats."
            : "Sign in to pick up your student profile and previous chats, or continue as a guest."}
        </p>
        {configured ? null : (
          <p className="mt-4 text-sm leading-6 text-ink-2" role="status">
            Cloud login needs <code>SUPABASE_URL</code> and a service role or
            publishable key on the server. You can still open the desk as a guest.
          </p>
        )}

        <form
          className="mt-8 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="grid gap-2">
            <span className="ui-label">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="ui-field text-base"
              placeholder="you@school.edu.sg"
              required
              disabled={!configured}
            />
          </label>
          <label className="grid gap-2">
            <span className="ui-label">Password</span>
            <input
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="ui-field text-base"
              placeholder="At least 6 characters"
              minLength={6}
              required
              disabled={!configured}
            />
          </label>
          {error ? <p className="text-sm text-red">{error}</p> : null}
          {busy ? <LoadingState label={signup ? "Creating your desk" : "Signing in"} /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary" disabled={busy || !configured}>
              {signup ? "Create account" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="quiet"
              size="sm"
              disabled={busy}
              onClick={() => {
                setMode(signup ? "login" : "signup");
                setError(null);
              }}
            >
              {signup ? "I already have an account" : "Create an account"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() =>
                onSignedIn({
                  user: { id: "guest", email: "" },
                  profile: null,
                  sessionId: crypto.randomUUID(),
                })
              }
            >
              Continue as guest
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
