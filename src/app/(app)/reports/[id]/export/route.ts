import { NextResponse } from "next/server";
import { factsToCsv, factsToText } from "@/lib/analytics/facts";
import { getSessionUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { getReport } from "@/lib/data/reports";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const business = await getBusinessForUser(user.uid);
  if (!business) return new NextResponse("Not found", { status: 404 });
  const report = await getReport(business.id, id);
  if (!report) return new NextResponse("Not found", { status: 404 });

  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "txt";
  const base = `elmer-report-${report.facts.period.to}`;
  const body =
    format === "csv"
      ? factsToCsv(report.facts)
      : (report.kind === "ai_analysis" ? `AI ANALYSIS (estimate, may contain mistakes)\n${report.text}\n\n` : "") + factsToText(report.facts) + "\n";
  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
