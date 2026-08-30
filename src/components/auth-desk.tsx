"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type AuthPayload = {
  user: { id: string; email: string };
  profile: import("@/agents/_shared/types").StudentProfile | null;
  sessionId: string;
};

export function AuthDesk({
  onSignedIn,
}: {
  onSignedIn: (payload: AuthPayload) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signup = mode === "signup";

  async function submit() {
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
        <p className="ui-label">NUS-ISS Practice Module · Team 5</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--bui-ink)] sm:text-5xl">
          METS
        </h1>
        <p className="mt-3 max-w-md text-[0.95rem] leading-6 text-[var(--bui-ink-2)]">
          {signup
            ? "Create an account so we can keep your name, grade band, and chat memory."
            : "Sign in to pick up your student profile and the last ten chats."}
        </p>

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
            />
          </label>
          {error ? <p className="text-sm text-[var(--bui-red)]">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setMode(signup ? "login" : "signup");
                setError(null);
              }}
            >
              {signup ? "I already have an account" : "Create an account"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
