import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { conversion, totals } from "@/lib/analytics/leads";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listLeadEntries } from "@/lib/data/leads";
import { todayInMadrid } from "@/lib/data/metrics";
import { SOURCES, type SourceKey } from "@/lib/schema/leads";
import { DeleteLeadButton } from "./delete-button";
import { LeadForm } from "./lead-form";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Leads and outcomes" };

const show = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("en-GB").format(n));
const pct = (c: ReturnType<typeof conversion>, tr: (t: string, v?: Record<string, string | number>) => string) =>
  c.rate === null ? tr("Not available") : `${c.rate.toFixed(1)}% (${tr("{b} of {i}", { b: c.bookings, i: c.inquiries })})`;

export default async function LeadsPage() {
  const { tr } = await getT();
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const entries = await listLeadEntries(business.id);
  const today = todayInMadrid();
  const sources = (Object.keys(SOURCES) as SourceKey[]).filter((s) => entries.some((e) => e.source === s));

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{tr("Leads and outcomes")}</h1>
        <p className="text-sm text-muted">{tr("Aggregate counts of calls, inquiries and bookings that you record yourself. No patient identity, appointment details or medical information is stored.")}</p>
      </div>

      <LeadForm today={today} monthStart={`${today.slice(0, 8)}01`} />

      {entries.length === 0 ? (
        <Card className="text-center">
          <p className="text-lg font-semibold">{tr("No data yet")}</p>
          <p className="mt-1 text-sm text-muted">{tr("Record your first period above.")}</p>
        </Card>
      ) : (
        <>
          <Card className="space-y-3">
            <CardTitle>{tr("Totals by source")}</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-start text-sm">
                <thead className="text-xs text-muted">
                  <tr><th className="py-1 pe-3">{tr("Source")}</th><th className="pe-3">{tr("Calls")}</th><th className="pe-3">{tr("Inquiries")}</th><th className="pe-3">{tr("Bookings")}</th><th>{tr("Bookings per inquiry")}</th></tr>
                </thead>
                <tbody>
                  {[...sources.map((s) => ({ key: s, label: tr(SOURCES[s]), list: entries.filter((e) => e.source === s) })), { key: "all", label: tr("All sources"), list: entries }].map((r) => {
                    const t = totals(r.list);
                    return (
                      <tr key={r.key} className={r.key === "all" ? "border-t-2 border-border font-medium" : "border-t border-border"}>
                        <td className="py-2 pe-3">{r.label}</td>
                        <td className="pe-3">{show(t.calls)}</td>
                        <td className="pe-3">{show(t.inquiries)}</td>
                        <td className="pe-3">{show(t.bookings)}</td>
                        <td>{pct(conversion(r.list), tr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="space-y-1 text-xs text-muted">
              <li>{tr("“—” means not recorded, not zero.")}</li>
              <li>
                <strong>{tr("Bookings per inquiry")}</strong>{" "}{tr("= bookings ÷ inquiries, using only entries where you recorded both. It is not shown when either number is missing or inquiries are zero.")}</li>
              <li>{tr("The source is your own judgement. Google does not tell you which person who saw your listing later called or booked, so these counts show activity you tracked, not proof of what caused it.")}</li>
            </ul>
          </Card>

          <Card className="space-y-3">
            <CardTitle>{tr("Entries")}</CardTitle>
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">{e.periodStart} → {e.periodEnd} · {tr(SOURCES[e.source as SourceKey] ?? e.source)}</p>
                  <p className="text-muted">
                    {tr("Calls")}: {show(e.calls ?? null)} · {tr("Inquiries")}: {show(e.inquiries ?? null)} · {tr("Bookings")}: {show(e.bookings ?? null)}
                    {" · "}{tr("Source")}: {tr("Manually entered")}
                  </p>
                  <DeleteLeadButton id={e.id} />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
