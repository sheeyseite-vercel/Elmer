import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { BusinessProfile } from "@/lib/schema/business";

/** Returns the first business the user belongs to, or null if onboarding is not done. */
export async function getBusinessForUser(uid: string): Promise<BusinessProfile | null> {
  const snap = await adminDb()
    .collection("business_profiles")
    .where("memberUids", "array-contains", uid)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;
  return { id: doc.id, ...(doc.data() as Omit<BusinessProfile, "id">) };
}
