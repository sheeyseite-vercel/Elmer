import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { DEVICE_COOKIE, readDeviceToken } from "@/lib/auth/device";

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

/**
 * Sign-in is switched off: the app opens straight to the dashboard as the single owner.
 * Set REQUIRE_LOGIN=1 in Vercel to bring the sign-in screen back (all the sign-in code is kept).
 */
export const loginRequired = () => process.env.REQUIRE_LOGIN === "1";

/** The existing owner is whoever already belongs to the real (non-demo) business, so no data is orphaned. */
const soleOwner = cache(async (): Promise<SessionUser> => {
  const email = (process.env.OWNER_EMAILS ?? "").split(",")[0]?.trim() || null;
  try {
    const snap = await adminDb().collection("business_profiles").limit(20).get();
    const real = snap.docs.find((d) => d.data().isDemo !== true);
    const uid = (real?.data().memberUids as string[] | undefined)?.[0];
    if (uid) return { uid, email };
  } catch {
    // fall through to the default owner id
  }
  return { uid: "owner", email };
});

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
  if (!loginRequired()) return soleOwner();
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE)?.value;
  if (cookie) {
    try {
      const decoded = await adminAuth().verifySessionCookie(cookie, false);
      if (isEmailAllowed(decoded.email)) return { uid: decoded.uid, email: decoded.email ?? null };
    } catch {
      // fall through to the trusted-device cookie
    }
  }
  const device = readDeviceToken(jar.get(DEVICE_COOKIE)?.value);
  if (device && isEmailAllowed(device.email)) return device;
  return null;
});

/** Use at the top of every protected server component / action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
