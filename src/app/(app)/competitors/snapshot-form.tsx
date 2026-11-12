"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { addSnapshot, type FormState } from "./actions";
import { useTr } from "@/lib/i18n/client";

export function SnapshotForm({ competitorId, today }: { competitorId: string; today: string }) {
  const tr = useTr();
  const [state, action, pending] = useActionState<FormState, FormData>(addSnapshot, {});
  const e = state.errors ?? {};
  return (
    <form action={action}>
      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>{tr("Record what you see on the public listing")}</CardTitle>
          <p className="text-sm text-muted">{tr("Enter only what is publicly visible, with the date you looked. Each save creates a new dated snapshot; older ones are kept. Ratings and review counts alone do not determine ranking.")}</p>
        </div>
        <input type="hidden" name="competitorId" value={competitorId} />
        <TextField label={tr("Date you checked")} name="checkedOn" type="date" max={today} defaultValue={today} required error={e.checkedOn} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={tr("Public rating (0–5)")} name="rating" type="number" inputMode="decimal" step="0.1" min={0} max={5} error={e.rating} />
          <TextField label={tr("Number of reviews")} name="reviewCount" type="number" inputMode="numeric" min={0} error={e.reviewCount} />
        </div>
        <TextField label={tr("Categories (optional)")} name="categories" error={e.categories} hint={tr("Separate with commas, as shown on the listing.")} />
        <TextField label={tr("Listed services (optional)")} name="services" error={e.services} hint={tr("Separate with commas.")} />
        <TextField label={tr("Source link")} name="sourceUrl" type="url" inputMode="url" placeholder={tr("https://")} error={e.sourceUrl} />
        <TextField label={tr("Or a source note")} name="sourceNote" error={e.sourceNote} hint={tr("For example: seen on the public Google Maps listing.")} />
        {state.message && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{tr(state.message)}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Save snapshot"}</Button>
      </Card>
    </form>
  );
}
