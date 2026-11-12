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
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Report" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { tr } = await getT();
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
        <Link href="/reports" className="no-print inline-flex min-h-11 items-center text-sm text-accent underline">{tr("← All reports")}</Link>
        <h1 className="text-2xl font-semibold">{report.kind === "ai_analysis" ? tr("AI analysis") : tr("Data summary")}</h1>
        <p className="text-sm text-muted">{tr("Created")} {formatMadrid(report.createdAt)} · {tr("Period")} {f.period.from} → {f.period.to}</p>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        <a href={`/reports/${id}/export?format=csv`} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm">{tr("Download CSV")}</a>
        <a href={`/reports/${id}/export?format=txt`} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm">{tr("Download text")}</a>
        <PrintButton />
        <DeleteReportButton id={id} />
      </div>

      {report.kind === "ai_analysis" && (
        <Card className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{tr("Analysis")}</CardTitle>
            <StatusBadge tone="warning">{tr("AI-generated · estimate")}</StatusBadge>
          </div>
          {report.question && <p className="text-sm text-muted">{tr("Question:")} “{report.question}”</p>}
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{report.text}</p>
          <p className="text-xs text-muted">
            {tr("Written by {provider} from the figures below. It may contain mistakes: check it against the numbers.", { provider: `${report.providerLabel} (${report.model})` })}
          </p>
        </Card>
      )}

      <Card className="space-y-2">
        <CardTitle>{tr("Data this report is based on")}</CardTitle>
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{factsToText(f)}</pre>
        <p className="text-xs text-muted">{tr("Source: data recorded in this app. “Not recorded” means no data, not zero.")}</p>
      </Card>
    </div>
  );
}
