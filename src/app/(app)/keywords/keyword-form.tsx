"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { SURFACES } from "@/lib/schema/keywords";
import type { KeywordView } from "@/lib/data/keywords";
import { saveKeyword, type KeywordState } from "./actions";
import { useTr } from "@/lib/i18n/client";

export function KeywordForm({ initial }: { initial?: KeywordView }) {
  const tr = useTr();
  const [state, action, pending] = useActionState<KeywordState, FormData>(saveKeyword, {});
  const e = state.errors ?? {};
  return (
    <form action={action}>
      <Card className="space-y-4">
        <CardTitle>{initial ? tr("Edit keyword") : tr("Add a target keyword")}</CardTitle>
        {initial && <input type="hidden" name="id" value={initial.id} />}
        <TextField label={tr("Keyword")} name="term" required defaultValue={initial?.term} error={e.term} placeholder={tr("e.g. osteópata")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label={tr("Language")}
            name="language"
            defaultValue={initial?.language ?? "es"}
            options={[{ value: "es", label: "Español" }, { value: "en", label: "English" }]}
            error={e.language}
          />
          <SelectField
            label={tr("Where to check")}
            name="surface"
            defaultValue={initial?.surface ?? "both"}
            options={Object.entries(SURFACES).map(([value, label]) => ({ value, label: tr(label) }))}
            error={e.surface}
          />
        </div>
        <TextField label={tr("Target area (optional)")} name="targetArea" defaultValue={initial?.targetArea} error={e.targetArea} hint={tr("A city or neighbourhood you confirmed.")} />
        <TextField label={tr("Group (optional)")} name="group" defaultValue={initial?.group} error={e.group} hint={tr("For example: services, local, brand.")} />
        <TextField label={tr("Tags (optional)")} name="tags" defaultValue={initial?.tags.join(", ")} error={e.tags} hint={tr("Separate with commas.")} />
        <TextField label={tr("Notes (optional)")} name="notes" defaultValue={initial?.notes} error={e.notes} />
        {state.message && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{tr(state.message)}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Add keyword"}</Button>
      </Card>
    </form>
  );
}
