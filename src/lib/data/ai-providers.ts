import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { decryptSecret } from "@/lib/crypto";
import type { ProviderKind, ProviderView } from "@/lib/ai/providers";

type Stored = {
  businessId: string;
  kind: ProviderKind;
  label: string;
  baseUrl: string;
  model: string;
  encryptedKey: string;
  keyLast4: string;
  active: boolean;
  lastTest?: { ok: boolean; at: string; detail: string };
  createdAt: string;
  updatedAt: string;
};

/** Server-only collection: Firestore rules deny all client access to it. */
const col = () => adminDb().collection("ai_providers");

export async function listProviders(businessId: string): Promise<ProviderView[]> {
  const snap = await col().where("businessId", "==", businessId).get();
  return snap.docs
    .map((d) => {
      const s = d.data() as Stored;
      return {
        id: d.id,
        kind: s.kind,
        label: s.label,
        baseUrl: s.baseUrl,
        model: s.model,
        keyLast4: s.keyLast4,
        active: s.active,
        lastTest: s.lastTest,
      } satisfies ProviderView;
    })
    .sort((a, b) => Number(b.active) - Number(a.active) || a.label.localeCompare(b.label));
}

export async function getOwnedProvider(businessId: string, id: string) {
  const doc = await col().doc(id).get();
  const data = doc.data() as Stored | undefined;
  if (!doc.exists || !data || data.businessId !== businessId) return null;
  return { ref: doc.ref, data };
}

/** For the future AI analyst: returns the active provider with its decrypted key (server use only). */
export async function getActiveProviderWithKey(businessId: string) {
  const snap = await col().where("businessId", "==", businessId).where("active", "==", true).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return null;
  const s = doc.data() as Stored;
  return { baseUrl: s.baseUrl, model: s.model, apiKey: decryptSecret(s.encryptedKey), label: s.label };
}
