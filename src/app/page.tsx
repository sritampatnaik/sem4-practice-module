"use client";

import { useSyncExternalStore } from "react";
import type { StudentProfile } from "@/agents/_shared/types";
import { AuthDesk } from "@/components/auth-desk";
import { OnboardingDesk } from "@/components/onboarding-desk";
import { StudioShell } from "@/components/studio-shell";
import { LoadingState } from "@/components/ui/loading-state";
import { clearLocalStudent, loadProfile, saveProfile } from "@/lib/profile-storage";

type AuthUser = { id: string; email: string };

type Snapshot = {
  ready: boolean;
  configured: boolean;
  user: AuthUser | null;
  profile: StudentProfile | null;
  sessionId: string | null;
};

let snapshot: Snapshot = {
  ready: false,
  configured: false,
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
  configured: false,
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
    configured: false,
    user: null,
    profile: loadProfile(),
    sessionId: null,
  };
  emit();
  void fetch("/api/auth")
    .then((response) => response.json())
    .then(
      (payload: {
        configured?: boolean;
        user?: AuthUser | null;
        profile?: StudentProfile | null;
        sessionId?: string | null;
      }) => {
        if (payload.profile) saveProfile(payload.profile);
        snapshot = {
          ready: true,
          configured: Boolean(payload.configured),
          user: payload.user ?? null,
          profile: payload.profile ?? null,
          sessionId: payload.sessionId ?? null,
        };
        emit();
      },
    )
    .catch(() => {
      snapshot = {
        ready: true,
        configured: false,
        user: null,
        profile: null,
        sessionId: null,
      };
      emit();
    });
}

if (typeof window !== "undefined") {
  hydrateFromAuth();
}

export default function Home() {
  const { ready, configured, user, profile, sessionId } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <LoadingState label="Loading your desk" />
      </main>
    );
  }

  if (!user) {
    return (
      <AuthDesk
        configured={configured}
        onSignedIn={(payload) => {
          if (payload.profile) saveProfile(payload.profile);
          else clearLocalStudent();
          snapshot = {
            ready: true,
            configured: configured || Boolean(payload.user.email),
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
          const nextSessionId = sessionId ?? crypto.randomUUID();
          snapshot = {
            ready: true,
            configured,
            user,
            profile: next,
            sessionId: nextSessionId,
          };
          emit();
          if (user.email) {
            void fetch("/api/student", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profile: next }),
            });
          }
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
      signedIn={Boolean(user.email)}
      onReset={() => {
        clearLocalStudent();
        snapshot = {
          ready: true,
          configured,
          user: null,
          profile: null,
          sessionId: null,
        };
        emit();
        void fetch("/api/auth", { method: "DELETE" });
      }}
    />
  );
}
