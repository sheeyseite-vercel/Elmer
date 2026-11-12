import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckList } from "@/components/rank/check-list";
import { Card, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listChecks, listKeywords } from "@/lib/data/keywords";
import { nowMadridLocal } from "@/lib/time";
import { CheckForm } from "./check-form";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Rank checks" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const selectClass = "mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text";

export default async function RankChecksPage({ searchParams }: { searchParams: SP }) {
  const { tr } = await getT();
  const sp = await searchParams;
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const [keywords, all] = await Promise.all([listKeywords(business.id), listChecks(business.id)]);
  const kw = one(sp.keyword) ?? "";
  const surface = one(sp.surface) ?? "";
  const device = one(sp.device) ?? "";
  const checks = all.filter((c) => (!kw || c.keywordId === kw) && (!surface || c.surface === surface) && (!device || c.device === device));
  const selectable = keywords.filter((k) => k.status !== "archived").map((k) => ({ value: k.id, label: k.term }));
  const filtered = Boolean(kw || surface || device);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{tr("Rank checks")}</h1>
        <p className="text-sm text-muted">{tr("Observations you record by hand. Google Maps and Google Search results are kept separate, and every check shows where, when, on which device and how it was made.")}</p>
      </div>

      <CheckForm keywords={selectable} defaultKeywordId={kw || undefined} nowLocal={nowMadridLocal()} />

      <Card className="space-y-3">
        <CardTitle>{tr("History")}</CardTitle>
        <form method="get" action="/rank-checks" className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <label className="text-xs text-muted">
            {tr("Keyword")}
            <select name="keyword" defaultValue={kw} className={selectClass}>
              <option value="">{tr("All")}</option>
              {keywords.map((k) => <option key={k.id} value={k.id}>{k.term}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">
            {tr("Surface")}
            <select name="surface" defaultValue={surface} className={selectClass}>
              <option value="">{tr("All")}</option>
              <option value="maps">{tr("Google Maps")}</option>
              <option value="search">{tr("Google Search")}</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            {tr("Device")}
            <select name="device" defaultValue={device} className={selectClass}>
              <option value="">{tr("All")}</option>
              <option value="mobile">{tr("Mobile")}</option>
              <option value="desktop">{tr("Desktop")}</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-xl border border-border bg-surface-2 px-4 text-sm font-medium">{tr("Filter")}</button>
        </form>
        {filtered && <Link href="/rank-checks" className="inline-flex min-h-11 items-center text-sm text-accent underline">{tr("Clear filters")}</Link>}
        <CheckList checks={checks} showKeyword />
      </Card>
    </div>
  );
}
