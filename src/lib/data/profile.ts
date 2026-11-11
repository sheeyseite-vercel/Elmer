import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { Priority, TaskStatus } from "@/lib/profile-checklist";

export type TaskView = { key: string; status: TaskStatus; priority: Priority; dueDate: string; note: string; updatedAt: string };

export const taskDocId = (businessId: string, key: string) => `${businessId}_${key}`;

export async function listTasks(businessId: string): Promise<Map<string, TaskView>> {
  const snap = await adminDb().collection("profile_tasks").where("businessId", "==", businessId).limit(100).get();
  const map = new Map<string, TaskView>();
  for (const d of snap.docs) {
    const x = d.data();
    map.set(String(x.itemKey), {
      key: String(x.itemKey),
      status: (["complete", "needs_attention", "unknown"].includes(x.status) ? x.status : "unknown") as TaskStatus,
      priority: (["high", "medium", "low"].includes(x.priority) ? x.priority : "medium") as Priority,
      dueDate: String(x.dueDate ?? ""),
      note: String(x.note ?? ""),
      updatedAt: String(x.updatedAt ?? ""),
    });
  }
  return map;
}
