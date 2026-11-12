"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { guessDateColumn, guessMetric } from "@/lib/csv/import";
import { MAX_CSV_CHARS } from "@/lib/csv/limits";
import { parseCsv, type DateOrder, type DecimalStyle, type ParsedCsv } from "@/lib/csv/parse";
import { METRICS, metricLabel, type MetricKey } from "@/lib/metrics";
import { useTr } from "@/lib/i18n/client";
import { commitImport, previewImport, type ImportRequest, type PreviewResult } from "./actions";

const selectClass = "min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text";

export function ImportWizard() {
  const tr = useTr();
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
      setMessage({ tone: "error", text: tr("This file is too large (limit about 700 KB). Export a shorter date range.") });
      return;
    }
    const content = await file.text();
    const parsed = parseCsv(content);
    if (parsed.headers.length < 2 || parsed.rows.length === 0) {
      setMessage({ tone: "error", text: tr("Could not read any data rows from this file. Is it a CSV export?") });
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
        text:
          tr("Imported {n} values", { n: r.written }) +
          (r.skipped ? tr(", kept {n} existing", { n: r.skipped }) : "") +
          (r.rejectedCount ? tr(", {n} problems were not imported", { n: r.rejectedCount }) : "") +
          ".",
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
        <CardTitle>{tr("Import a CSV file")}</CardTitle>
        <p className="text-sm text-muted">
          {tr("Upload a report you exported yourself. The app does not assume any particular column names: you choose what each column means. Blank cells are treated as “no data”, never as zero. The original file is not stored.")}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="csv-file" className="text-sm font-medium">{tr("CSV file")}</label>
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
            {fileName}: {tr("{rows} rows, {cols} columns.", { rows: csv.rows.length, cols: csv.headers.length })}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="date-order" className="text-sm font-medium">{tr("Date format")}</label>
              <select id="date-order" className={selectClass} value={dateOrder} onChange={(e) => setDateOrder(e.target.value as DateOrder)}>
                <option value="dmy">{tr("Day / Month / Year (Spain)")}</option>
                <option value="mdy">{tr("Month / Day / Year (US)")}</option>
                <option value="ymd">{tr("Year-Month-Day")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="decimal" className="text-sm font-medium">{tr("Number format")}</label>
              <select id="decimal" className={selectClass} value={decimal} onChange={(e) => setDecimal(e.target.value as DecimalStyle)}>
                <option value="comma">{tr("1.234,5 (Spain)")}</option>
                <option value="dot">{tr("1,234.5 (US)")}</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{tr("Column mapping")}</p>
            <div className="space-y-1.5">
              <label htmlFor="date-col" className="text-sm text-muted">{tr("Date column")}</label>
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
                  <option key={i} value={i}>{h || tr("Column {n}", { n: i + 1 })}</option>
                ))}
              </select>
            </div>
            {csv.headers.map((h, i) =>
              i === dateColumn ? null : (
                <div key={i} className="space-y-1.5">
                  <label htmlFor={`col-${i}`} className="text-sm text-muted">
                    “{h || tr("Column {n}", { n: i + 1 })}” {tr("is…")}
                    {csv.rows[0]?.[i] ? <span className="ms-1 text-xs">({tr("e.g.")} {csv.rows[0][i]})</span> : null}
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
                    <option value="">{tr("Ignore this column")}</option>
                    {METRICS.map((m) => (
                      <option key={m.key} value={m.key}>{tr(m.label)}</option>
                    ))}
                  </select>
                </div>
              ),
            )}
            <p className="text-xs text-muted">{tr("Suggestions are guesses from the column names. Check them before importing.")}</p>
          </div>

          <Button className="w-full" disabled={pending || mappedCount === 0} onClick={runPreview}>
            {pending && !preview ? tr("Checking…") : tr("Check file (nothing is saved yet)")}
          </Button>
        </>
      )}

      {preview && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-3">
          <p className="font-semibold">{tr("Preview")}</p>
          <ul className="space-y-1 text-sm">
            <li>{tr("Valid values:")} <strong>{preview.acceptedCount}</strong> {tr("from {n} rows", { n: preview.totalRows })}</li>
            {preview.dateRange && <li>{tr("Dates:")} {preview.dateRange.from} → {preview.dateRange.to}</li>}
            <li className="text-muted">
              {Object.entries(preview.byMetric).map(([k, n]) => `${tr(metricLabel(k))}: ${n}`).join(" · ")}
            </li>
            {preview.emptyCells > 0 && <li className="text-muted">{tr("{n} blank cells treated as no data", { n: preview.emptyCells })}</li>}
            {preview.duplicatesInFile > 0 && (
              <li className="text-warning">{tr("{n} repeated day/metric entries inside the file (the last one is used)", { n: preview.duplicatesInFile })}</li>
            )}
            {preview.sameFileImportedAt && (
              <li className="text-warning">{tr("This exact file was already imported on {date}.", { date: new Date(preview.sameFileImportedAt).toLocaleString() })}</li>
            )}
          </ul>

          {preview.rejectedCount > 0 && (
            <div className="space-y-1">
              <StatusBadge tone="danger">{tr("{n} problems, these will NOT be imported", { n: preview.rejectedCount })}</StatusBadge>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="text-muted">
                    <tr><th className="py-1 pe-2">{tr("Line")}</th><th className="pe-2">{tr("Column")}</th><th>{tr("Reason")}</th></tr>
                  </thead>
                  <tbody>
                    {preview.rejected.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1 pe-2">{r.line}</td><td className="pe-2">{r.column}</td><td>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.rejectedCount > preview.rejected.length && (
                <p className="text-xs text-muted">{tr("…and {n} more.", { n: preview.rejectedCount - preview.rejected.length })}</p>
              )}
            </div>
          )}

          {preview.existing > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{tr("{n} of these days already have imported values", { n: preview.existing })}</legend>
              {(["skip", "replace"] as const).map((p) => (
                <label key={p} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="policy" checked={policy === p} onChange={() => setPolicy(p)} />
                  {p === "skip" ? tr("Keep the existing values (skip these)") : tr("Replace the existing values with this file")}
                </label>
              ))}
            </fieldset>
          )}

          <Button className="w-full" disabled={pending || preview.acceptedCount === 0} onClick={runCommit}>
            {pending ? tr("Importing…") : tr("Import {n} values", { n: preview.acceptedCount })}
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
