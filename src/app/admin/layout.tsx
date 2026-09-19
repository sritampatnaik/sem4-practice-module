import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAdminAccess } from "@/agents/guardrail";
import { AppFrame } from "@/components/app-frame";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const access = await getAdminAccess();
  if (!access.ok) {
    return { title: "METS", robots: { index: false, follow: false } };
  }
  return {
    title: "METS · Staff alerts",
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAdminAccess();
  if (!access.ok) notFound();

  return (
    <AppFrame
      actions={
        <p className="text-xs text-ink-3">
          {access.user?.email || (access.bypass ? "Local staff bypass" : "Staff")}
        </p>
      }
    >
      {children}
    </AppFrame>
  );
}
