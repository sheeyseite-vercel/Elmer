import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * "Stay signed in on this device": a signed cookie, valid for one year, issued only after a normal
 * Firebase sign-in has been verified. It lets the owner skip the sign-in screen on a trusted device.
 * Signing out clears it. Changing ENCRYPTION_KEY signs out every device.
 */
export const DEVICE_COOKIE = "elmer_device";
export const DEVICE_MAX_AGE_S = 60 * 60 * 24 * 365;

type Payload = { uid: string; email: string | null; exp: number };

function secret(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;
  return createHmac("sha256", Buffer.from(raw, "base64")).update("elmer-device-cookie-v1").digest();
}

const sign = (data: string, key: Buffer) => createHmac("sha256", key).update(data).digest("base64url");

export function makeDeviceToken(uid: string, email: string | null): string | null {
  const key = secret();
  if (!key) return null;
  const data = Buffer.from(JSON.stringify({ uid, email, exp: Date.now() + DEVICE_MAX_AGE_S * 1000 } satisfies Payload)).toString("base64url");
  return `${data}.${sign(data, key)}`;
}

export function readDeviceToken(token: string | undefined): { uid: string; email: string | null } | null {
  const key = secret();
  if (!key || !token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = sign(data, key);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Payload;
    if (typeof p.uid !== "string" || typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return { uid: p.uid, email: typeof p.email === "string" ? p.email : null };
  } catch {
    return null;
  }
}
