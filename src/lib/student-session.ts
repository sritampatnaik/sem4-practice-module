"use client";

import { useSyncExternalStore } from "react";
import type { StudentProfile } from "@/agents/_shared/types";
import { clearLocalStudent, loadProfile, saveProfile } from "@/lib/profile-storage";

export type AuthUser = { id: string; email: string };

export type StudentSnapshot = {
  ready: boolean;
  configured: boolean;
  user: AuthUser | null;
  profile: StudentProfile | null;
  sessionId: string | null;
};

let snapshot: StudentSnapshot = {
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

const SERVER_SNAPSHOT: StudentSnapshot = {
  ready: false,
  configured: false,
  user: null,
  profile: null,
  sessionId: null,
};

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function persistRemoteProfile(profile: StudentProfile, email?: string) {
  if (!email) return;
  void fetch("/api/student", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
}

export function useStudentSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function hydrateFromAuth() {
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

export function acceptSignedIn(payload: {
  user: AuthUser;
  profile: StudentProfile | null;
  sessionId: string;
}) {
  if (payload.profile) saveProfile(payload.profile);
  else clearLocalStudent();
  snapshot = {
    ready: true,
    configured: snapshot.configured || Boolean(payload.user.email),
    user: payload.user,
    profile: payload.profile,
    sessionId: payload.sessionId,
  };
  emit();
}

export function completeOnboarding(profile: StudentProfile) {
  saveProfile(profile);
  const nextSessionId = snapshot.sessionId ?? crypto.randomUUID();
  snapshot = {
    ...snapshot,
    profile,
    sessionId: nextSessionId,
  };
  emit();
  persistRemoteProfile(profile, snapshot.user?.email);
}

export function persistStudentProfile(profile: StudentProfile) {
  saveProfile(profile);
  snapshot = { ...snapshot, profile };
  emit();
  persistRemoteProfile(profile, snapshot.user?.email);
}

export function resetStudentSession() {
  clearLocalStudent();
  snapshot = {
    ready: true,
    configured: snapshot.configured,
    user: null,
    profile: null,
    sessionId: null,
  };
  emit();
  void fetch("/api/auth", { method: "DELETE" });
}

if (typeof window !== "undefined") {
  hydrateFromAuth();
}
