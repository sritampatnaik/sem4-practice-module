import { getAuthUser, type AuthUser } from "@/lib/auth";

const STAFF_ROLES = ["admin", "tutor", "parent"] as const;

export function parseEmailList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.includes("@"));
}

export function parseRoleList(value: string | undefined) {
  if (!value) return [...STAFF_ROLES];
  const parsed = value
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length ? parsed : [...STAFF_ROLES];
}

export function adminDevBypassEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.METS_ADMIN_DEV === "1";
}

export function isAdminUser(user: Pick<AuthUser, "email" | "role"> | null | undefined) {
  if (!user?.email) return false;
  const emails = parseEmailList(process.env.METS_ADMIN_EMAILS);
  if (emails.includes(user.email.trim().toLowerCase())) return true;
  const roles = parseRoleList(process.env.METS_ADMIN_ROLES);
  return Boolean(user.role && roles.includes(user.role.toLowerCase()));
}

export type AdminAccess =
  | { ok: true; user: AuthUser | null; bypass: boolean }
  | { ok: false; user: AuthUser | null; bypass: false };

export async function getAdminAccess(): Promise<AdminAccess> {
  const user = await getAuthUser();
  if (adminDevBypassEnabled()) {
    return { ok: true, user, bypass: true };
  }
  if (isAdminUser(user)) {
    return { ok: true, user, bypass: false };
  }
  return { ok: false, user, bypass: false };
}
