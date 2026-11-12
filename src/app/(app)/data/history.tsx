"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SourceBadge } from "@/components/ui/badges";
import { metricLabel } from "@/lib/metrics";
import type { ImportView, ManualMetricView } from "@/lib/data/metrics";
import { useTr } from "@/lib/i18n/client";
import { deleteImport, deleteManualMetric } from "./actions";

export function History({ imports, manual }: { imports: ImportView[]; manual: ManualMetricView[] }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function run(fn: () => Promise<{ message: string }>) {
    setNotice(null);
    start(async () => setNotice((await fn()).message));
  }

  return (
    <Card className="space-y-5">
      <CardTitle>{tr("Source and import history")}</CardTitle>

      <section className="space-y-2" aria-label={tr("Imports")}>
        <h3 className="flex items-center gap-2 text-sm font-medium">
          {tr("CSV imports")} <SourceBadge kind="google_csv" tr={tr} />
        </h3>
        {imports.length === 0 ? (
          <p className="text-sm text-muted">{tr("No imports yet.")}</p>
        ) : (
          <ul className="space-y-2">
            {imports.map((i) => (
              <li key={i.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="break-all font-medium">{i.fileName}</p>
                <p className="text-muted">
                  {new Date(i.createdAt).toLocaleString()} · {tr("{n} values added", { n: i.written })}
                  {i.skipped ? ` · ${tr("{n} kept as before", { n: i.skipped })}` : ""}
                  {i.rejected ? ` · ${tr("{n} problems not imported", { n: i.rejected })}` : ""}
                </p>
                {i.dateRange && <p className="text-muted">{tr("Covers {from} to {to}", { from: i.dateRange.from, to: i.dateRange.to })}</p>}
                <Button
                  variant="ghost"
                  className="mt-1 min-h-11 px-2 text-danger"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(tr("Delete this import and the values it added?"))) run(() => deleteImport(i.id));
                  }}
                >
                  {tr("Delete import")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2" aria-label={tr("Manual values")}>
        <h3 className="flex items-center gap-2 text-sm font-medium">
          {tr("Manual values")} <SourceBadge kind="manual" tr={tr} />
        </h3>
        {manual.length === 0 ? (
          <p className="text-sm text-muted">{tr("No manual values yet.")}</p>
        ) : (
          <ul className="space-y-2">
            {manual.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                <span>
                  <strong>{tr(metricLabel(m.metric))}</strong>: {m.value} · {m.date}
                  {m.note ? <span className="block text-xs text-muted">{m.note}</span> : null}
                </span>
                <Button variant="ghost" className="min-h-11 px-2 text-danger" disabled={pending} onClick={() => run(() => deleteManualMetric(m.id))}>
                  {tr("Delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {notice && <p role="status" className="text-sm text-muted">{notice}</p>}
    </Card>
  );
}
