import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM encryption for third-party API keys stored in Firestore.
 * ENCRYPTION_KEY must be 32 random bytes, base64-encoded (openssl rand -base64 32).
 * Keys are encrypted at rest and are never sent back to the browser.
 */
function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set.");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must decode to 32 bytes.");
  return buf;
}

export function isEncryptionConfigured(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(payload: string): string {
  const [iv, tag, ct] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  if (!iv || !tag || !ct) throw new Error("Malformed secret.");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
