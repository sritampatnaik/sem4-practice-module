"use client";

import { StudentGate } from "@/components/student-gate";
import { StudioShell } from "@/components/studio-shell";

export default function Home() {
  return (
    <StudentGate>
      {(session) => (
        <StudioShell
          key={session.sessionId}
          profile={session.profile}
          sessionId={session.sessionId}
          email={session.email}
          signedIn={session.signedIn}
          onReset={session.onReset}
        />
      )}
    </StudentGate>
  );
}
