"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { SOURCES } from "@/lib/schema/leads";
import { saveLeadEntry, type LeadState } from "./actions";
import { useTr } from "@/lib/i18n/client";

export function LeadForm({ today, monthStart }: { today: string; monthStart: string }) {
  const tr = useTr();
  const [state, action, pending] = useActionState<LeadState, FormData>(saveLeadEntry, {});
  const e = state.errors ?? {};
  return (
    <form action={action}>
      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>{tr("Record counts for a period")}</CardTitle>
          <p className="text-sm text-muted">{tr("Totals only. Do not enter names, appointment details or any health information. Leave a count empty if you did not track it (empty is not the same as zero).")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label={tr("From")} name="periodStart" type="date" max={today} defaultValue={monthStart} required error={e.periodStart} />
          <TextField label={tr("To")} name="periodEnd" type="date" max={today} defaultValue={today} required error={e.periodEnd} />
        </div>
        <SelectField label={tr("Where they came from")} name="source" options={Object.entries(SOURCES).map(([value, label]) => ({ value, label: tr(label) }))} error={e.source} />
        <div className="grid grid-cols-3 gap-3">
          <TextField label={tr("Calls")} name="calls" type="number" inputMode="numeric" min={0} error={e.calls} />
          <TextField label={tr("Inquiries")} name="inquiries" type="number" inputMode="numeric" min={0} error={e.inquiries} />
          <TextField label={tr("Bookings")} name="bookings" type="number" inputMode="numeric" min={0} error={e.bookings} />
        </div>
        {state.message && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{tr(state.message)}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Save counts"}</Button>
      </Card>
    </form>
  );
}
