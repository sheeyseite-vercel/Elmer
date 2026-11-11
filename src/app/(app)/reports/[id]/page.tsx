import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { factsToText } from "@/lib/analytics/facts";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { getReport } from "@/lib/data/reports";
import { formatMadrid } from "@/lib/time";
import { DeleteReportButton } from "./delete-report";
import { PrintButton } from "./print-button";

export const metadata = { title: "Report" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const report = await getReport(business.id, id);
  if (!report) notFound();
  const f = report.facts;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href="/reports" className="no-print inline-flex min-h-11 items-center text-sm text-accent underline">← All reports</Link>
        <h1 className="text-2xl font-semibold">{report.kind === "ai_analysis" ? "AI analysis" : "Data summary"}</h1>
        <p className="text-sm text-muted">Created {formatMadrid(report.createdAt)} · Period {f.period.from} to {f.period.to}</p>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        <a href={`/reports/${id}/export?format=csv`} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm">Download CSV</a>
        <a href={`/reports/${id}/export?format=txt`} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm">Download text</a>
        <PrintButton />
        <DeleteReportButton id={id} />
      </div>

      {report.kind === "ai_analysis" && (
        <Card className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Analysis</CardTitle>
            <StatusBadge tone="warning">AI-generated · estimate</StatusBadge>
          </div>
          {report.question && <p className="text-sm text-muted">Question: “{report.question}”</p>}
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{report.text}</p>
          <p className="text-xs text-muted">
            Written by {report.providerLabel} ({report.model}) from the figures below. It may contain mistakes: check it against the numbers.
          </p>
        </Card>
      )}

      <Card className="space-y-2">
        <CardTitle>Data this report is based on</CardTitle>
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{factsToText(f)}</pre>
        <p className="text-xs text-muted">Source: data recorded in this app. “Not recorded” means no data, not zero.</p>
      </Card>
    </div>
  );
}
