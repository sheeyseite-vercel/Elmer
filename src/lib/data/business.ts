import "server-only";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import type { BusinessProfile } from "@/lib/schema/business";

export const DEMO_COOKIE = "elmer_demo";

/**
 * Returns the business the user is working in. Normally their real business. When demo mode is on
 * (cookie set) it returns the separate, clearly marked DEMO business instead, so demo and real data
 * can never mix. Pass { real: true } where only the real business is meant (e.g. onboarding).
 */
export async function getBusinessForUser(uid: string, opts?: { real?: boolean }): Promise<BusinessProfile | null> {
  const snap = await adminDb().collection("business_profiles").where("memberUids", "array-contains", uid).limit(5).get();
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BusinessProfile, "id">) }));
  const wantDemo = !opts?.real && (await cookies()).get(DEMO_COOKIE)?.value === "1";
  return (wantDemo ? all.find((b) => b.isDemo === true) : all.find((b) => b.isDemo !== true)) ?? null;
}
