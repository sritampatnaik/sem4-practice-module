"use client";

import type { ReactNode } from "react";
import { AuthDesk } from "@/components/auth-desk";
import { OnboardingDesk } from "@/components/onboarding-desk";
import { Spinner } from "@/components/ui/spinner";
import type { StudentProfile } from "@/agents/_shared/types";
import {
  acceptSignedIn,
  completeOnboarding,
  persistStudentProfile,
  resetStudentSession,
  useStudentSession,
} from "@/lib/student-session";

export type DeskSession = {
  profile: StudentProfile;
  sessionId: string;
  email?: string;
  signedIn: boolean;
  persistProfile: (profile: StudentProfile) => void;
  onReset: () => void;
};

export function StudentGate({
  children,
}: {
  children: (session: DeskSession) => ReactNode;
}) {
  const { ready, configured, user, profile, sessionId } = useStudentSession();

  if (!ready) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4"
        aria-busy="true"
        aria-label="Loading"
      >
        <Spinner className="size-5 text-ink-2" />
      </main>
    );
  }

  if (!user) {
    return <AuthDesk configured={configured} onSignedIn={acceptSignedIn} />;
  }

  if (!profile || !sessionId) {
    return <OnboardingDesk onComplete={completeOnboarding} />;
  }

  return children({
    profile,
    sessionId,
    email: user.email,
    signedIn: Boolean(user.email),
    persistProfile: persistStudentProfile,
    onReset: resetStudentSession,
  });
}
