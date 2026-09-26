"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { StudentProfile } from "@/agents/_shared/types";
import { schoolGradeLabel } from "@/agents/_shared/types";
import { EntityChip } from "@/components/atoms/EntityChip";
import { ValuePill } from "@/components/atoms/ValuePill";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { TestingProgressPanel } from "./testing-progress-panel";

function gradeLabel(profile: StudentProfile) {
  return schoolGradeLabel(profile.grade, profile.gradeLevel);
}

export function StudentSidebar({
  profile,
  email,
  signedIn,
  children,
}: {
  profile: StudentProfile;
  email?: string;
  signedIn?: boolean;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const diagnosticsActive = pathname === "/diagnostics" || pathname.startsWith("/diagnostics/");

  return (
    <>
      <div>
        <p className="ui-label">Student</p>
        <div className="mt-3">
          <EntityChip
            name={profile.name}
            color={signedIn ? "#2f6fec" : "#64748b"}
            monogram={profile.name.charAt(0).toUpperCase()}
          />
        </div>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">{profile.name}</h1>
        <p className="mt-1 text-sm text-ink-2">{gradeLabel(profile)}</p>
        {email ? <p className="mt-1 truncate text-xs text-ink-3">{email}</p> : null}
        {signedIn ? (
          <ValuePill className="mt-3 ml-0 gap-1" tone="accent">
            <Icon icon="signedIn" size={12} />
            Signed in
          </ValuePill>
        ) : (
          <ValuePill className="mt-3 ml-0 gap-1" tone="neutral">
            <Icon icon="guest" size={12} />
            Guest desk
          </ValuePill>
        )}
        <Link
          href="/diagnostics"
          className={cn(
            "mt-5 inline-flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm no-underline transition-colors",
            diagnosticsActive
              ? "bg-field font-medium text-ink shadow-[var(--bui-shadow-hairline)]"
              : "text-ink-2 hover:bg-hover hover:text-ink",
          )}
        >
          <Icon icon="question" size={14} />
          Diagnostics
        </Link>
      </div>
      <TestingProgressPanel signedIn={signedIn} />
      {children}
    </>
  );
}
