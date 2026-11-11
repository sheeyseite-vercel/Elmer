"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { taskDocId } from "@/lib/data/profile";
import { parseDate } from "@/lib/csv/parse";
import { ITEMS } from "@/lib/profile-checklist";

export type TaskState = { ok?: boolean; errors?: Record<string, string[] | undefined>; message?: string };

const input = z.object({
  itemKey: z.string().refine((k) => ITEMS.some((i) => i.key === k), "Unknown item"),
  status: z.enum(["complete", "needs_attention", "unknown"]),
  priority: z.enum(["high", "medium", "low"]),
  dueDate: z
    .string()
    .optional()
    .default("")
    .refine((d) => d === "" || parseDate(d, "ymd") !== null, "Enter a valid date"),
  note: z.string().trim().max(300).optional().default(""),
});

export async function saveTask(_prev: TaskState, formData: FormData): Promise<TaskState> {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const raw = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v === "" ? undefined : v]));
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  const v = parsed.data;

  const now = new Date().toISOString();
  await adminDb().collection("profile_tasks").doc(taskDocId(business.id, v.itemKey)).set({
    businessId: business.id,
    itemKey: v.itemKey,
    status: v.status,
    priority: v.priority,
    dueDate: v.dueDate,
    note: v.note,
    updatedAt: now,
  });
  await adminDb().collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "profile_task.updated", itemKey: v.itemKey, status: v.status, createdAt: now,
  });
  revalidatePath("/profile-checklist");
  return { ok: true, message: "Saved." };
}
