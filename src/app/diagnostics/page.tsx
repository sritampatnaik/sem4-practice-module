"use client";

import { DiagnosticsDesk } from "@/components/diagnostics-desk";
import { StudentGate } from "@/components/student-gate";

export default function DiagnosticsPage() {
  return (
    <StudentGate>
      {(session) => (
        <DiagnosticsDesk
          profile={session.profile}
          email={session.email}
          signedIn={session.signedIn}
          onReset={session.onReset}
          onSaved={session.persistProfile}
        />
      )}
    </StudentGate>
  );
}
