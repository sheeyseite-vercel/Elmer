"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
import { runAnalysis, type AnalystState } from "./actions";

export function AnalystForm() {
  const [state, action, pending] = useActionState<AnalystState, FormData>(runAnalysis, {});
  return (
    <form action={action}>
      <Card className="space-y-4">
        <CardTitle>Ask for an analysis</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Period" name="range" defaultValue="28"
            options={[{ value: "7", label: "Last 7 days" }, { value: "28", label: "Last 28 days" }, { value: "90", label: "Last 3 months" }]} />
          <SelectField label="Answer language" name="language" defaultValue="en"
            options={[{ value: "en", label: "English" }, { value: "es", label: "Español" }]} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="question" className="text-sm font-medium">Your question (optional)</label>
          <textarea id="question" name="question" rows={3} maxLength={300}
            placeholder="e.g. Did calls change compared with the previous period?"
            className="w-full rounded-xl border border-border bg-surface-2 p-3 text-base text-text placeholder:text-muted/70" />
        </div>
        {state.message && <p role="alert" className="text-sm text-danger">{state.message}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Analysing… this can take up to a minute" : "Run analysis"}</Button>
      </Card>
    </form>
  );
}
