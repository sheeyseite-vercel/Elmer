"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { DEVICES } from "@/lib/schema/keywords";
import { addRankCheck, type CheckState } from "./actions";

type Opt = { value: string; label: string };

export function CheckForm({ keywords, defaultKeywordId, nowLocal }: { keywords: Opt[]; defaultKeywordId?: string; nowLocal: string }) {
  const [state, action, pending] = useActionState<CheckState, FormData>(addRankCheck, {});
  const [found, setFound] = useState<"yes" | "no">("yes");
  const e = state.errors ?? {};

  if (keywords.length === 0) {
    return <Card className="text-sm text-muted">Add an active keyword first, then you can record a check for it.</Card>;
  }

  return (
    <form action={action}>
      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>Record a rank check</CardTitle>
          <p className="text-sm text-muted">
            One observation at one place and time. Results change with location, device, language, personalisation and
            time, so this is not a permanent ranking.
          </p>
        </div>
        <SelectField label="Keyword" name="keywordId" defaultValue={defaultKeywordId ?? keywords[0]?.value} options={keywords} error={e.keywordId} />
        <TextField label="Date and time (Madrid)" name="checkedAt" type="datetime-local" max={nowLocal} defaultValue={nowLocal} required error={e.checkedAt} />
        <TextField label="Location checked" name="locationLabel" required error={e.locationLabel} hint="Where the search was made from, e.g. “Clinic address” or “Grid point 500 m north”." />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Latitude (optional)" name="lat" inputMode="decimal" error={e.lat} />
          <TextField label="Longitude (optional)" name="lng" inputMode="decimal" error={e.lng} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Device" name="device" options={Object.entries(DEVICES).map(([value, label]) => ({ value, label }))} error={e.device} />
          <SelectField label="Search surface" name="surface" options={[{ value: "maps", label: "Google Maps" }, { value: "search", label: "Google Search" }]} error={e.surface} />
        </div>
        <SelectField
          label="Result"
          name="found"
          value={found}
          onChange={(ev) => setFound(ev.target.value as "yes" | "no")}
          options={[{ value: "yes", label: "Elmer appeared in the results" }, { value: "no", label: "Not found in the results I checked" }]}
          error={e.found}
        />
        {found === "yes" && <TextField label="Position" name="position" type="number" inputMode="numeric" min={1} max={200} required error={e.position} />}
        <TextField
          label="Results checked (how far down you looked)"
          name="depth"
          type="number"
          inputMode="numeric"
          min={1}
          max={200}
          defaultValue={20}
          required
          error={e.depth}
          hint={found === "no" ? "“Not found” only means not found within this many results." : undefined}
        />
        <div className="space-y-1.5">
          <label htmlFor="competitors" className="text-sm font-medium">Competitors seen (optional)</label>
          <textarea
            id="competitors"
            name="competitors"
            rows={3}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-base text-text"
            placeholder={"Public business name, position\nClinic B, 2"}
          />
          <p className="text-xs text-muted">One per line, up to 10. Public business names only.</p>
          {e.competitors && <p role="alert" className="text-xs text-danger">{e.competitors.join(" ")}</p>}
        </div>
        <TextField label="How you checked" name="methodology" required error={e.methodology} hint="e.g. Maps app, signed out, location set to the point, language Spanish." />
        <TextField label="Reference link (optional)" name="referenceUrl" type="url" inputMode="url" placeholder="https://" error={e.referenceUrl} />
        {state.message && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{state.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Save rank check"}</Button>
      </Card>
    </form>
  );
}
