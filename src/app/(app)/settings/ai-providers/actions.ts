"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { getOwnedProvider } from "@/lib/data/ai-providers";
import { decryptSecret, encryptSecret, isEncryptionConfigured } from "@/lib/crypto";
import { providerInput } from "@/lib/ai/providers";

export type ProviderState = {
  ok?: boolean;
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

const PATH = "/settings/ai-providers";

async function audit(businessId: string, actorUid: string, action: string, providerId: string) {
  // Never log keys or URLs with credentials: only the action and provider id.
  await adminDb().collection("audit_logs").add({
    businessId,
    actorUid,
    action,
    providerId,
    createdAt: new Date().toISOString(),
  });
}

export async function saveProvider(_prev: ProviderState, formData: FormData): Promise<ProviderState> {
  const { user, business } = await context();
  if (!isEncryptionConfigured()) {
    return { message: "ENCRYPTION_KEY is not configured on the server, so keys cannot be stored safely." };
  }

  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v === "" ? undefined : v]),
  );
  const parsed = providerInput.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  }
  const { id, apiKey, ...fields } = parsed.data;
  const now = new Date().toISOString();
  const col = adminDb().collection("ai_providers");

  if (id) {
    const owned = await getOwnedProvider(business.id, id);
    if (!owned) return { message: "Provider not found." };
    const update: Record<string, unknown> = { ...fields, updatedAt: now };
    if (apiKey) {
      update.encryptedKey = encryptSecret(apiKey);
      update.keyLast4 = apiKey.slice(-4);
      update.lastTest = null; // a new key must be tested again
    }
    await owned.ref.update(update);
    await audit(business.id, user.uid, "ai_provider.updated", id);
  } else {
    if (!apiKey) return { errors: { apiKey: ["Enter the API key"] }, message: "Please fix the highlighted fields." };
    const existing = await col.where("businessId", "==", business.id).limit(1).get();
    const ref = col.doc();
    await ref.set({
      ...fields,
      businessId: business.id,
      encryptedKey: encryptSecret(apiKey),
      keyLast4: apiKey.slice(-4),
      active: existing.empty, // the first provider becomes active automatically
      createdAt: now,
      updatedAt: now,
    });
    await audit(business.id, user.uid, "ai_provider.created", ref.id);
  }
  revalidatePath(PATH);
  return { ok: true, message: "Saved." };
}

export async function activateProvider(id: string): Promise<ProviderState> {
  const { user, business } = await context();
  const owned = await getOwnedProvider(business.id, id);
  if (!owned) return { message: "Provider not found." };

  const db = adminDb();
  const all = await db.collection("ai_providers").where("businessId", "==", business.id).get();
  const batch = db.batch();
  all.docs.forEach((d) => batch.update(d.ref, { active: d.id === id }));
  await batch.commit();
  await audit(business.id, user.uid, "ai_provider.activated", id);
  revalidatePath(PATH);
  return { ok: true, message: "Active provider switched." };
}

export async function deleteProvider(id: string): Promise<ProviderState> {
  const { user, business } = await context();
  const owned = await getOwnedProvider(business.id, id);
  if (!owned) return { message: "Provider not found." };
  const wasActive = owned.data.active;
  await owned.ref.delete();

  if (wasActive) {
    // Promote another provider so the app is never left without an active one by accident.
    const rest = await adminDb().collection("ai_providers").where("businessId", "==", business.id).limit(1).get();
    await rest.docs[0]?.ref.update({ active: true });
  }
  await audit(business.id, user.uid, "ai_provider.deleted", id);
  revalidatePath(PATH);
  return { ok: true, message: "Deleted." };
}

/** Calls GET {baseUrl}/models with the stored key. It proves the key and URL work; nothing else. */
export async function testProvider(id: string): Promise<ProviderState> {
  const { business } = await context();
  const owned = await getOwnedProvider(business.id, id);
  if (!owned) return { message: "Provider not found." };

  let ok = false;
  let detail = "";
  try {
    const key = decryptSecret(owned.data.encryptedKey);
    const res = await fetch(`${owned.data.baseUrl.replace(/\/+$/, "")}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
    ok = res.ok;
    detail = ok ? "Connection and key accepted." : `Provider answered HTTP ${res.status}.`;
  } catch (e) {
    detail = e instanceof Error && e.name === "TimeoutError" ? "Timed out after 10 s." : "Could not reach the provider.";
  }
  await owned.ref.update({ lastTest: { ok, at: new Date().toISOString(), detail } });
  revalidatePath(PATH);
  return { ok, message: detail };
}
