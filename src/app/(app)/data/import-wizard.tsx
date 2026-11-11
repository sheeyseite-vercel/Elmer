"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { guessDateColumn, guessMetric } from "@/lib/csv/import";
import { MAX_CSV_CHARS } from "@/lib/csv/limits";
import { parseCsv, type DateOrder, type DecimalStyle, type ParsedCsv } from "@/lib/csv/parse";
import { METRICS, metricLabel, type MetricKey } from "@/lib/metrics";
import { commitImport, previewImport, type ImportRequest, type PreviewResult } from "./actions";

const selectClass = "min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text";

export function ImportWizard() {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [dateColumn, setDateColumn] = useState(0);
  const [metricMap, setMetricMap] = useState<Record<number, MetricKey | "">>({});
  const [dateOrder, setDateOrder] = useState<DateOrder>("dmy");
  const [decimal, setDecimal] = useState<DecimalStyle>("comma");
  const [policy, setPolicy] = useState<"skip" | "replace">("skip");
  const [preview, setPreview] = useState<Extract<PreviewResult, { ok: true }> | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, start] = useTransition();

  async function onFile(file: File | undefined) {
    setPreview(null);
    setMessage(null);
    setCsv(null);
    if (!file) return;
    if (file.size > MAX_CSV_CHARS) {
      setMessage({ tone: "error", text: "This file is too large (limit about 700 KB). Export a shorter date range." });
      return;
    }
    const content = await file.text();
    const parsed = parseCsv(content);
    if (parsed.headers.length < 2 || parsed.rows.length === 0) {
      setMessage({ tone: "error", text: "Could not read any data rows from this file. Is it a CSV export?" });
      return;
    }
    const dc = guessDateColumn(parsed.headers);
    const map: Record<number, MetricKey | ""> = {};
    parsed.headers.forEach((h, i) => {
      if (i !== dc) map[i] = guessMetric(h) ?? "";
    });
    setFileName(file.name);
    setText(content);
    setCsv(parsed);
    setDateColumn(dc);
    setMetricMap(map);
  }

  function buildRequest(): ImportRequest {
    const metricColumns: Record<string, MetricKey> = {};
    Object.entries(metricMap).forEach(([i, m]) => {
      if (m && Number(i) !== dateColumn) metricColumns[i] = m;
    });
    return { text, fileName, dateColumn, metricColumns, dateOrder, decimal, policy };
  }

  const mappedCount = Object.entries(metricMap).filter(([i, m]) => m && Number(i) !== dateColumn).length;

  function runPreview() {
    setMessage(null);
    start(async () => {
      const r = await previewImport(buildRequest());
      if (!r.ok) {
        setPreview(null);
        setMessage({ tone: "error", text: r.message });
      } else setPreview(r);
    });
  }

  function runCommit() {
    setMessage(null);
    start(async () => {
      const r = await commitImport(buildRequest());
      if (!r.ok) return setMessage({ tone: "error", text: r.message });
      setMessage({
        tone: "success",
        text: `Imported ${r.written} values${r.skipped ? `, kept ${r.skipped} existing` : ""}${r.rejectedCount ? `, ${r.rejectedCount} problems were not imported` : ""}.`,
      });
      setPreview(null);
      setCsv(null);
      setText("");
      setFileName("");
    });
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <CardTitle>Import a CSV file</CardTitle>
        <p className="text-sm text-muted">
          Upload a report you exported yourself. The app does not assume any particular column names: you choose what
          each column means. Blank cells are treated as “no data”, never as zero. The original file is not stored.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="csv-file" className="text-sm font-medium">CSV file</label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void onFile(e.target.files?.[0])}
          className="block min-h-11 w-full rounded-xl border border-border bg-surface-2 p-2 text-sm"
        />
      </div>

      {csv && (
        <>
          <p className="text-sm text-muted">
            {fileName}: {csv.rows.length} rows, {csv.headers.length} columns.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="date-order" className="text-sm font-medium">Date format</label>
              <select id="date-order" className={selectClass} value={dateOrder} onChange={(e) => setDateOrder(e.target.value as DateOrder)}>
                <option value="dmy">Day / Month / Year (Spain)</option>
                <option value="mdy">Month / Day / Year (US)</option>
                <option value="ymd">Year-Month-Day</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="decimal" className="text-sm font-medium">Number format</label>
              <select id="decimal" className={selectClass} value={decimal} onChange={(e) => setDecimal(e.target.value as DecimalStyle)}>
                <option value="comma">1.234,5 (Spain)</option>
                <option value="dot">1,234.5 (US)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Column mapping</p>
            <div className="space-y-1.5">
              <label htmlFor="date-col" className="text-sm text-muted">Date column</label>
              <select
                id="date-col"
                className={selectClass}
                value={dateColumn}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setDateColumn(next);
                  setMetricMap((m) => ({ ...m, [next]: "" }));
                  setPreview(null);
                }}
              >
                {csv.headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                ))}
              </select>
            </div>
            {csv.headers.map((h, i) =>
              i === dateColumn ? null : (
                <div key={i} className="space-y-1.5">
                  <label htmlFor={`col-${i}`} className="text-sm text-muted">
                    “{h || `Column ${i + 1}`}” is…
                    {csv.rows[0]?.[i] ? <span className="ml-1 text-xs">(e.g. {csv.rows[0][i]})</span> : null}
                  </label>
                  <select
                    id={`col-${i}`}
                    className={selectClass}
                    value={metricMap[i] ?? ""}
                    onChange={(e) => {
                      setMetricMap((m) => ({ ...m, [i]: e.target.value as MetricKey | "" }));
                      setPreview(null);
                    }}
                  >
                    <option value="">Ignore this column</option>
                    {METRICS.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
              ),
            )}
            <p className="text-xs text-muted">Suggestions are guesses from the column names. Check them before importing.</p>
          </div>

          <Button className="w-full" disabled={pending || mappedCount === 0} onClick={runPreview}>
            {pending && !preview ? "Checking…" : "Check file (nothing is saved yet)"}
          </Button>
        </>
      )}

      {preview && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-3">
          <p className="font-semibold">Preview</p>
          <ul className="space-y-1 text-sm">
            <li>Valid values: <strong>{preview.acceptedCount}</strong> from {preview.totalRows} rows</li>
            {preview.dateRange && <li>Dates: {preview.dateRange.from} to {preview.dateRange.to}</li>}
            <li className="text-muted">
              {Object.entries(preview.byMetric).map(([k, n]) => `${metricLabel(k)}: ${n}`).join(" · ")}
            </li>
            {preview.emptyCells > 0 && <li className="text-muted">{preview.emptyCells} blank cells treated as no data</li>}
            {preview.duplicatesInFile > 0 && (
              <li className="text-warning">{preview.duplicatesInFile} repeated day/metric entries inside the file (the last one is used)</li>
            )}
            {preview.sameFileImportedAt && (
              <li className="text-warning">This exact file was already imported on {new Date(preview.sameFileImportedAt).toLocaleString()}.</li>
            )}
          </ul>

          {preview.rejectedCount > 0 && (
            <div className="space-y-1">
              <StatusBadge tone="danger">{preview.rejectedCount} problems, these will NOT be imported</StatusBadge>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-muted">
                    <tr><th className="py-1 pr-2">Line</th><th className="pr-2">Column</th><th>Reason</th></tr>
                  </thead>
                  <tbody>
                    {preview.rejected.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1 pr-2">{r.line}</td><td className="pr-2">{r.column}</td><td>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.rejectedCount > preview.rejected.length && (
                <p className="text-xs text-muted">…and {preview.rejectedCount - preview.rejected.length} more.</p>
              )}
            </div>
          )}

          {preview.existing > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{preview.existing} of these days already have imported values</legend>
              {(["skip", "replace"] as const).map((p) => (
                <label key={p} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="policy" checked={policy === p} onChange={() => setPolicy(p)} />
                  {p === "skip" ? "Keep the existing values (skip these)" : "Replace the existing values with this file"}
                </label>
              ))}
            </fieldset>
          )}

          <Button className="w-full" disabled={pending || preview.acceptedCount === 0} onClick={runCommit}>
            {pending ? "Importing…" : `Import ${preview.acceptedCount} values`}
          </Button>
        </div>
      )}

      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-danger" : "text-sm text-success"}>
          {message.text}
        </p>
      )}
    </Card>
  );
}
