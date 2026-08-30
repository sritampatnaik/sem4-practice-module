"use client";

import { useSyncExternalStore } from "react";
import type { StudentProfile } from "@/agents/_shared/types";
import { AuthDesk } from "@/components/auth-desk";
import { OnboardingDesk } from "@/components/onboarding-desk";
import { StudioShell } from "@/components/studio-shell";
import { clearLocalStudent, loadProfile, saveProfile } from "@/lib/profile-storage";

type AuthUser = { id: string; email: string };

type Snapshot = {
  ready: boolean;
  user: AuthUser | null;
  profile: StudentProfile | null;
  sessionId: string | null;
};

let snapshot: Snapshot = {
  ready: false,
  user: null,
  profile: null,
  sessionId: null,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

const SERVER_SNAPSHOT: Snapshot = {
  ready: false,
  user: null,
  profile: null,
  sessionId: null,
};

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function hydrateFromAuth() {
  snapshot = {
    ready: false,
    user: null,
    profile: loadProfile(),
    sessionId: null,
  };
  emit();
  void fetch("/api/auth")
    .then((response) => response.json())
    .then(
      (payload: {
        user?: AuthUser | null;
        profile?: StudentProfile | null;
        sessionId?: string | null;
      }) => {
        if (payload.profile) saveProfile(payload.profile);
        snapshot = {
          ready: true,
          user: payload.user ?? null,
          profile: payload.profile ?? null,
          sessionId: payload.sessionId ?? null,
        };
        emit();
      },
    )
    .catch(() => {
      snapshot = { ready: true, user: null, profile: null, sessionId: null };
      emit();
    });
}

if (typeof window !== "undefined") {
  hydrateFromAuth();
}

export default function Home() {
  const { ready, user, profile, sessionId } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-[var(--bui-ink-2)]">Loading your desk…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthDesk
        onSignedIn={(payload) => {
          if (payload.profile) saveProfile(payload.profile);
          else clearLocalStudent();
          snapshot = {
            ready: true,
            user: payload.user,
            profile: payload.profile,
            sessionId: payload.sessionId,
          };
          emit();
        }}
      />
    );
  }

  if (!profile || !sessionId) {
    return (
      <OnboardingDesk
        onComplete={(next) => {
          saveProfile(next);
          snapshot = { ready: true, user, profile: next, sessionId: user.id };
          emit();
          void fetch("/api/student", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: next }),
          });
        }}
      />
    );
  }

  return (
    <StudioShell
      key={sessionId}
      profile={profile}
      sessionId={sessionId}
      email={user.email}
      onReset={() => {
        clearLocalStudent();
        snapshot = { ready: true, user: null, profile: null, sessionId: null };
        emit();
        void fetch("/api/auth", { method: "DELETE" });
      }}
    />
  );
}
