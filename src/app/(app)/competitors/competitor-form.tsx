"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import type { CompetitorView } from "@/lib/data/competitors";
import { saveCompetitor, type FormState } from "./actions";
import { useTr } from "@/lib/i18n/client";

export function CompetitorForm({ initial, allowOwn }: { initial?: CompetitorView; allowOwn?: boolean }) {
  const tr = useTr();
  const [state, action, pending] = useActionState<FormState, FormData>(saveCompetitor, {});
  const e = state.errors ?? {};
  return (
    <form action={action}>
      <Card className="space-y-4">
        <CardTitle>{initial ? tr("Edit business") : tr("Add a business to compare")}</CardTitle>
        {initial && <input type="hidden" name="id" value={initial.id} />}
        <TextField label={tr("Public business name")} name="name" required defaultValue={initial?.name} error={e.name} />
        <TextField label={tr("Public profile link (optional)")} name="profileUrl" type="url" inputMode="url" placeholder={tr("https://")} defaultValue={initial?.profileUrl} error={e.profileUrl} />
        <TextField label={tr("Location (optional)")} name="location" defaultValue={initial?.location} error={e.location} />
        <TextField
          label={tr("Notes (optional)")}
          name="notes"
          defaultValue={initial?.notes}
          error={e.notes}
          hint={tr("Factual notes only. No opinions about the quality of care, and no personal data.")}
        />
        {!initial && allowOwn && (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="own" value="own" />{tr("This is my own listing (to compare against the others)")}</label>
        )}
        {e.own && <p role="alert" className="text-xs text-danger">{e.own.join(" ")}</p>}
        {state.message && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{tr(state.message)}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Add"}</Button>
      </Card>
    </form>
  );
}
