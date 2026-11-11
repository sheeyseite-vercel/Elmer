"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { PRIORITIES, STATUSES, type ChecklistItem, type TaskStatus } from "@/lib/profile-checklist";
import type { TaskView } from "@/lib/data/profile";
import { saveTask, type TaskState } from "./actions";

const field = "mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text";
const tone = (s: TaskStatus) => (s === "complete" ? "success" : s === "needs_attention" ? "warning" : "neutral");

export function TaskRow({ item, task, hint }: { item: ChecklistItem; task?: TaskView; hint?: string }) {
  const [state, action, pending] = useActionState<TaskState, FormData>(saveTask, {});
  const e = state.errors ?? {};
  const status = task?.status ?? "unknown";
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle>{item.title}</CardTitle>
        <StatusBadge tone={tone(status)}>{STATUSES[status]}</StatusBadge>
      </div>
      <p className="text-sm text-muted">{item.guidance}</p>
      {hint && <p className="text-sm">From your saved details: {hint}</p>}
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm text-accent">Update status</summary>
        <form action={action} className="mt-2 space-y-3">
          <input type="hidden" name="itemKey" value={item.key} />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-muted">
              Status
              <select name="status" defaultValue={status} className={field}>
                {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted">
              Priority
              <select name="priority" defaultValue={task?.priority ?? "medium"} className={field}>
                {Object.entries(PRIORITIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted">
              Due date (optional)
              <input type="date" name="dueDate" defaultValue={task?.dueDate} className={field} />
              {e.dueDate && <span role="alert" className="text-danger">{e.dueDate.join(" ")}</span>}
            </label>
          </div>
          <label className="block text-xs text-muted">
            Note (optional)
            <input name="note" maxLength={300} defaultValue={task?.note} className={field} />
          </label>
          {state.message && (
            <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{state.message}</p>
          )}
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
      </details>
      {task?.note && <p className="text-sm">Note: {task.note}</p>}
      {task?.dueDate && <p className="text-xs text-muted">Due {task.dueDate}</p>}
      {task?.updatedAt && <p className="text-xs text-muted">Last updated {new Date(task.updatedAt).toLocaleDateString("en-GB", { timeZone: "Europe/Madrid" })} · recorded by you</p>}
    </Card>
  );
}
