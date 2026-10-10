"use client";

import { useState } from "react";
import { EntityChip } from "@/components/atoms/EntityChip";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
    if (!configured || busy) return;
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-canvas via-page to-canvas px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-line/50 bg-surface/95 px-8 py-10 shadow-overlay backdrop-blur-sm sm:px-10 sm:py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-accent/10 p-4">
            <EntityChip name="METS" color="#111827" monogram="M" className="ml-0 shadow-md" />
          </div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
            <Icon icon="school" size={14} />
            NUS-ISS Practice Module · Team 5
          </p>
          <h1 className="mt-4 bg-gradient-to-r from-ink to-ink-2 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            METS
          </h1>
          <p className="mt-2 text-sm font-medium text-ink-3">Multi-Agent Educational & Testing System</p>
        </div>
        
        <div className="mb-8 rounded-xl border border-line/50 bg-inset/30 p-5">
          <p className="text-center text-sm leading-relaxed text-ink-2">
            {signup
              ? "Create an account to save your profile, progress, and chat history across sessions."
              : "Sign in to access your student profile and previous chats, or continue as a guest for a quick session."}
          </p>
        </div>
        
        {configured ? null : (
          <div className="mb-6 rounded-lg border border-orange/30 bg-orange-tint p-4">
            <p className="text-sm leading-6 text-ink-2" role="status">
              Cloud login requires <code className="rounded bg-field px-2 py-0.5 font-mono text-xs">SUPABASE_URL</code> and a publishable key. 
              You can still use the desk as a guest.
            </p>
          </div>
        )}

        <form
          className="space-y-5"
          aria-busy={busy}
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
                <Icon icon="mail" size={13} />
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-line bg-field px-4 py-3 text-base text-ink shadow-hairline transition-all placeholder:text-ink-3 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="you@school.edu.sg"
                required
                disabled={!configured || busy}
              />
            </label>
            
            <label className="block space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
                <Icon icon="password" size={13} />
                Password
              </span>
              <input
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-line bg-field px-4 py-3 text-base text-ink shadow-hairline transition-all placeholder:text-ink-3 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="At least 6 characters"
                minLength={6}
                required
                disabled={!configured || busy}
              />
            </label>
          </div>
          
          {error ? (
            <div className="rounded-lg border border-red/30 bg-red-tint p-4">
              <p className="text-sm font-medium text-red">{error}</p>
            </div>
          ) : null}
          
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              className="h-12 w-full gap-2 text-base font-semibold shadow-btn transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={busy || !configured}
              aria-busy={busy}
            >
              {busy ? (
                <Spinner />
              ) : (
                <Icon icon={signup ? "createAccount" : "signIn"} size={16} />
              )}
              {busy
                ? signup
                  ? "Creating account..."
                  : "Signing in..."
                : signup
                  ? "Create account"
                  : "Sign in"}
            </Button>
            
            <div className="space-y-2">
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full font-medium transition-all hover:scale-[1.01]"
                disabled={busy}
                onClick={() => {
                  setMode(signup ? "login" : "signup");
                  setError(null);
                }}
              >
                {signup ? "Already have an account? Sign in" : "New to METS? Create account"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-2 text-ink-3">Or</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full gap-2 font-medium transition-all hover:scale-[1.01]"
                disabled={busy}
                onClick={() =>
                  onSignedIn({
                    user: { id: "guest", email: "" },
                    profile: null,
                    sessionId: crypto.randomUUID(),
                  })
                }
              >
                <Icon icon="guest" size={16} />
                Continue as guest
              </Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
