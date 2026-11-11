"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { METRICS } from "@/lib/metrics";
import { addManualMetric, type ManualState } from "./actions";

export function ManualForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<ManualState, FormData>(addManualMetric, {});
  const e = state.errors ?? {};
  return (
    <form action={action}>
      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>Enter a daily value by hand</CardTitle>
          <p className="text-sm text-muted">
            Saved and labelled as <strong>manually entered</strong>. One value per metric per day; saving the same day
            again replaces your earlier manual value.
          </p>
        </div>
        <SelectField
          label="Metric"
          name="metric"
          options={METRICS.map((m) => ({ value: m.key, label: m.label }))}
          error={e.metric}
        />
        <TextField label="Date" name="date" type="date" max={today} defaultValue={today} required error={e.date} />
        <TextField label="Count" name="value" type="number" inputMode="numeric" min={0} step={1} required error={e.value} />
        <TextField label="Note (optional)" name="note" maxLength={200} error={e.note} hint="Do not enter patient names or health details." />
        {state.message && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>
            {state.message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Save value"}</Button>
      </Card>
    </form>
  );
}
