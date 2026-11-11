import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

export type SessionUser = { uid: string; email: string | null };

/** Emails permitted to sign in. In production an empty list refuses everyone. */
export function isEmailAllowed(email: string | undefined | null): boolean {
  const allowed = (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return process.env.NODE_ENV !== "production";
  return !!email && allowed.includes(email.toLowerCase());
}

/**
 * Verifies the session cookie's signature and expiry locally (no network call). Revocation is not
 * checked on every request: that added a round trip to Firebase per page view, and sessions already
 * expire after 5 days and are limited to the allow-listed owner emails.
 * cache() makes the layout and the page share one check per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, false);
    if (!isEmailAllowed(decoded.email)) return null;
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
});

/** Use at the top of every protected server component / action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
