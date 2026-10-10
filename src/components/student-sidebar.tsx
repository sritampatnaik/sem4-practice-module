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
      <div className="rounded-xl border border-line/50 bg-inset/50 p-5 shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-3">Student Profile</p>
        <div className="mb-4">
          <EntityChip
            name={profile.name}
            color={signedIn ? "#2f6fec" : "#64748b"}
            monogram={profile.name.charAt(0).toUpperCase()}
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-ink">{profile.name}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-2">
          <Icon icon="tutor" size={14} className="text-ink-3" />
          {gradeLabel(profile)}
        </p>
        {email ? (
          <p className="mt-2 flex items-center gap-2 truncate text-xs text-ink-3">
            <Icon icon="signedIn" size={12} />
            {email}
          </p>
        ) : null}
        <div className="mt-4 pt-4 border-t border-line/50">
          {signedIn ? (
            <ValuePill className="ml-0 gap-1.5 shadow-sm" tone="accent">
              <Icon icon="signedIn" size={12} />
              <span className="font-medium">Signed in</span>
            </ValuePill>
          ) : (
            <ValuePill className="ml-0 gap-1.5 shadow-sm" tone="neutral">
              <Icon icon="guest" size={12} />
              <span className="font-medium">Guest desk</span>
            </ValuePill>
          )}
        </div>
      </div>
      
      <Link
        href="/diagnostics"
        className={cn(
          "group mt-4 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium no-underline transition-all",
          diagnosticsActive
            ? "bg-accent/10 text-accent shadow-[0_0_0_1px_var(--accent-tint)]"
            : "bg-surface/50 text-ink-2 shadow-hairline hover:bg-hover hover:text-ink hover:shadow-card",
        )}
      >
        <Icon 
          icon="question" 
          size={16} 
          className={cn(
            "transition-transform group-hover:scale-110",
            diagnosticsActive ? "text-accent" : "text-ink-3"
          )}
        />
        <span>Diagnostics</span>
      </Link>
      
      <div className="mt-4">
        <TestingProgressPanel signedIn={signedIn} />
      </div>
      
      {children}
    </>
  );
}
