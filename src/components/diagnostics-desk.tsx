"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { StudentProfile } from "@/agents/_shared/types";
import { schoolGradeLabel } from "@/agents/_shared/types";
import { AppFrame, DeskNav } from "@/components/app-frame";
import { StudentSidebar } from "@/components/student-sidebar";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DIAGNOSTICS,
  applyDiagnosticAnswers,
} from "@/lib/profile-storage";

export function DiagnosticsDesk({
  profile,
  email,
  signedIn,
  onReset,
  onSaved,
}: {
  profile: StudentProfile;
  email?: string;
  signedIn?: boolean;
  onReset: () => void;
  onSaved: (profile: StudentProfile) => void;
}) {
  const router = useRouter();
  const questions = useMemo(() => DIAGNOSTICS[profile.gradeLevel], [profile.gradeLevel]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const yearLabel = schoolGradeLabel(profile.grade, profile.gradeLevel);
  const hasSnapshot = Object.keys(profile.diagnostic).length > 0;

  return (
    <AppFrame
      nav={<DeskNav />}
      actions={
        <Button type="button" variant="quiet" size="sm" className="gap-1.5" onClick={onReset}>
          <Icon icon={signedIn ? "signOut" : "guest"} size={14} />
          {signedIn ? "Sign out" : "Leave desk"}
        </Button>
      }
      sidebar={
        <StudentSidebar profile={profile} email={email} signedIn={signedIn} />
      }
    >
      <div className="mx-auto w-full max-w-xl px-5 py-8 sm:px-8">
        <p className="ui-label">Optional check</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Diagnostics</h1>
        <p className="mt-3 text-sm leading-6 text-ink-2">
          Three quick checks for {yearLabel} so the specialists can pitch
          explanations. Guessing is allowed. You can skip this and come back later.
        </p>
        {hasSnapshot ? (
          <p className="mt-3 text-sm text-ink-2">
            Saved snapshot: Math {profile.diagnostic.math ?? "unseen"}, Physics{" "}
            {profile.diagnostic.physics ?? "unseen"}, Chemistry{" "}
            {profile.diagnostic.chemistry ?? "unseen"}. Submit again to replace it.
          </p>
        ) : null}

        <form
          className="mt-8 grid gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSaved(applyDiagnosticAnswers(profile, answers));
            setSaved(true);
          }}
        >
          {questions.map((question) => (
            <label key={question.id} className="grid gap-2">
              <span className="ui-label">{question.id}</span>
              <span className="text-sm">{question.prompt}</span>
              <input
                value={answers[question.id] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                className="ui-field"
              />
            </label>
          ))}
          {saved ? (
            <p className="text-sm text-ink-2" role="status">
              Snapshot saved. Specialists will use it on the next turn.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Save snapshot</Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/")}>
              {saved ? "Back to tutor" : "Skip for now"}
            </Button>
          </div>
        </form>
      </div>
    </AppFrame>
  );
}
