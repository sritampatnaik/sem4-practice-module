import { getAuthUser, type AuthUser } from "@/lib/auth";

export function parseEmailList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.includes("@"));
}

/** `/admin` is Auth `app_metadata.role === "admin"` only. Students get a 404. */
export function isAdminUser(user: Pick<AuthUser, "email" | "role"> | null | undefined) {
  if (!user?.email) return false;
  return user.role === "admin";
}

export type AdminAccess =
  | { ok: true; user: AuthUser }
  | { ok: false; user: AuthUser | null };

export async function getAdminAccess(): Promise<AdminAccess> {
  const user = await getAuthUser();
  if (isAdminUser(user) && user) {
    return { ok: true, user };
  }
  return { ok: false, user };
}
