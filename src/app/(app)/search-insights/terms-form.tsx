"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { importTerms, type TermsState } from "./actions";

export function TermsForm({ thisMonth }: { thisMonth: string }) {
  const [state, action, pending] = useActionState<TermsState, FormData>(importTerms, {});
  const e = state.errors ?? {};
  return (
    <form action={action}>
      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>Add the search phrases Google reported</CardTitle>
          <p className="text-sm text-muted">
            Copy them from your Business Profile performance report (the list of searches that showed your profile). One
            per line: <code>phrase, count</code>. Where Google shows “&lt;15” type <code>&lt;15</code>. Leave the count out if
            you do not have it. Do not paste anything that is not a search phrase.
          </p>
        </div>
        <TextField label="Month" name="month" type="month" max={thisMonth} defaultValue={thisMonth} required error={e.month} />
        <SelectField
          label="Where the list came from"
          name="source"
          options={[
            { value: "google_report", label: "Google report (copied by me)" },
            { value: "manual", label: "Other / typed by me" },
          ]}
        />
        <div className="space-y-1.5">
          <label htmlFor="terms" className="text-sm font-medium">Phrases</label>
          <textarea
            id="terms"
            name="terms"
            rows={8}
            required
            placeholder={"osteópata madrid, 120\ndolor lumbar, <15"}
            className="w-full rounded-xl border border-border bg-surface-2 p-3 text-base text-text placeholder:text-muted/70"
          />
          {e.terms && <p role="alert" className="text-xs text-danger">{e.terms.join(" ")}</p>}
        </div>
        {state.lineErrors && (
          <ul role="alert" className="space-y-1 text-sm text-danger">
            {state.lineErrors.map((l) => <li key={`${l.line}-${l.reason}`}>Line {l.line}: {l.reason}</li>)}
          </ul>
        )}
        {state.message && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{state.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Save phrases"}</Button>
      </Card>
    </form>
  );
}
