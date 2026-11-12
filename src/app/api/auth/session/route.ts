import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { DEVICE_COOKIE, DEVICE_MAX_AGE_S, makeDeviceToken } from "@/lib/auth/device";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, isEmailAllowed } from "@/lib/auth/session";

const body = z.object({ idToken: z.string().min(20).max(4096) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(parsed.data.idToken, true);
    // Only accept recent sign-ins (5 minutes) when minting a session cookie.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Recent sign-in required." }, { status: 401 });
    }
    // Accounts are created by the owner in the Firebase console (sign-ups are disabled),
    // so email/password users are never "verified". Google sign-ins are always verified.
    const provider = decoded.firebase?.sign_in_provider;
    const trusted = decoded.email_verified === true || provider === "password";
    if (!isEmailAllowed(decoded.email) || !trusted) {
      return NextResponse.json({ error: "This account is not authorised." }, { status: 403 });
    }
    const cookie = await auth.createSessionCookie(parsed.data.idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });
    const device = makeDeviceToken(decoded.uid, decoded.email ?? null);
    if (device) {
      res.cookies.set(DEVICE_COOKIE, device, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: DEVICE_MAX_AGE_S,
      });
    }
    return res;
  } catch {
    return NextResponse.json({ error: "Could not sign in." }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(DEVICE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
