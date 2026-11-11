"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { overlaps } from "@/lib/analytics/leads";
import { getBusinessForUser } from "@/lib/data/business";
import { leadDocId, listLeadEntries } from "@/lib/data/leads";
import { todayInMadrid } from "@/lib/data/metrics";
import { leadInput } from "@/lib/schema/leads";

export type LeadState = { ok?: boolean; errors?: Record<string, string[] | undefined>; message?: string };

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

export async function saveLeadEntry(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const { user, business } = await context();
  const raw = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v === "" ? undefined : v]));
  const parsed = leadInput.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (v.periodEnd > todayInMadrid()) return { errors: { periodEnd: ["The period cannot end in the future"] }, message: "Please fix the highlighted fields." };

  const id = leadDocId(business.id, v.periodStart, v.periodEnd, v.source);
  const existing = await listLeadEntries(business.id);
  // Overlapping periods for the same source would count the same days twice.
  const clash = existing.find((e) => e.source === v.source && e.id !== id && overlaps(e, v));
  if (clash) {
    return {
      errors: { periodStart: [`Overlaps an existing entry for this source (${clash.periodStart} to ${clash.periodEnd}). Delete it or choose different dates.`] },
      message: "Please fix the highlighted fields.",
    };
  }

  const now = new Date().toISOString();
  const replaced = existing.some((e) => e.id === id);
  await adminDb().collection("lead_aggregates").doc(id).set({
    businessId: business.id,
    periodStart: v.periodStart,
    periodEnd: v.periodEnd,
    source: v.source,
    ...(v.calls !== undefined ? { calls: v.calls } : {}),
    ...(v.inquiries !== undefined ? { inquiries: v.inquiries } : {}),
    ...(v.bookings !== undefined ? { bookings: v.bookings } : {}),
    entry: "manual",
    updatedAt: now,
  });
  await adminDb().collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: replaced ? "lead_aggregate.replaced" : "lead_aggregate.created", leadId: id, createdAt: now,
  });
  revalidatePath("/leads");
  return { ok: true, message: replaced ? "Saved. It replaced the earlier entry for this exact period and source." : "Saved." };
}

export async function deleteLeadEntry(id: string): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  const ref = adminDb().collection("lead_aggregates").doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.businessId !== business.id) return { ok: false, message: "Entry not found." };
  await ref.delete();
  await adminDb().collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "lead_aggregate.deleted", leadId: id, createdAt: new Date().toISOString(),
  });
  revalidatePath("/leads");
  return { ok: true, message: "Deleted." };
}
