"use server";

import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { businessProfileInput } from "@/lib/schema/business";

export type OnboardingState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

export async function saveBusinessProfile(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();

  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v === "" ? undefined : v]),
  );
  // Keep empty optional strings valid; only numbers must be omitted when blank.
  const parsed = businessProfileInput.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  }

  const db = adminDb();
  const now = new Date().toISOString();
  const existing = await getBusinessForUser(user.uid);

  const ref = existing
    ? db.collection("business_profiles").doc(existing.id)
    : db.collection("business_profiles").doc();

  // Firestore rejects `undefined`; blank optional fields (e.g. latitude) are removed instead.
  const clean = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === undefined ? FieldValue.delete() : v]),
  );

  await ref.set(
    {
      ...clean,
      ownerUid: existing?.ownerUid ?? user.uid,
      memberUids: existing?.memberUids ?? [user.uid],
      timezone: "Europe/Madrid",
      currency: "EUR",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
    { merge: true },
  );

  await db.collection("audit_logs").add({
    businessId: ref.id,
    actorUid: user.uid,
    action: existing ? "business_profile.updated" : "business_profile.created",
    // Field names only — never values — to keep the log free of personal data.
    changedFields: Object.keys(parsed.data),
    createdAt: now,
  });

  redirect("/dashboard");
}
