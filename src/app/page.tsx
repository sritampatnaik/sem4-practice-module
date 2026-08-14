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

function getServerSnapshot() {
  return { profile: null, sessionId: null };
}

function hydrateFromStorage() {
  snapshot = {
    profile: loadProfile(),
    sessionId: getSessionId(),
  };
  emit();
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
          saveProfile(next);
          snapshot = { profile: next, sessionId: getSessionId() };
          emit();
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
        clearLocalStudent();
        snapshot = { profile: null, sessionId: null };
        emit();
      }}
    />
  );
}
