"use client";

import { useSyncExternalStore } from "react";
import type { StudentProfile } from "@/agents/_shared/types";
import { OnboardingDesk } from "@/components/onboarding-desk";
import { StudioShell } from "@/components/studio-shell";
import {
  clearLocalStudent,
  getSessionId,
  loadProfile,
  saveProfile,
} from "@/lib/profile-storage";

let snapshot: { profile: StudentProfile | null; sessionId: string | null } = {
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

const SERVER_SNAPSHOT = { profile: null, sessionId: null };

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function hydrateFromStorage() {
  const sessionId = getSessionId();
  snapshot = {
    profile: loadProfile(),
    sessionId,
  };
  emit();
  void fetch(`/api/student?sessionId=${encodeURIComponent(sessionId)}`)
    .then((response) => response.json())
    .then((payload: { profile?: StudentProfile | null }) => {
      if (!payload.profile) return;
      saveProfile(payload.profile);
      snapshot = { profile: payload.profile, sessionId };
      emit();
    })
    .catch(() => {
      // Keep the local profile if the database is offline.
    });
}

if (typeof window !== "undefined") {
  hydrateFromStorage();
}

export default function Home() {
  const { profile, sessionId } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!profile || !sessionId) {
    return (
      <OnboardingDesk
        onComplete={(next) => {
          const sessionId = getSessionId();
          saveProfile(next);
          snapshot = { profile: next, sessionId };
          emit();
          void fetch("/api/student", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, profile: next }),
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
      onReset={() => {
        const previous = sessionId;
        clearLocalStudent();
        snapshot = { profile: null, sessionId: null };
        emit();
        if (previous) {
          void fetch(`/api/student?sessionId=${encodeURIComponent(previous)}`, {
            method: "DELETE",
          });
        }
      }}
    />
  );
}
