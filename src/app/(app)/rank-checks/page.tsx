import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckList } from "@/components/rank/check-list";
import { Card, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listChecks, listKeywords } from "@/lib/data/keywords";
import { nowMadridLocal } from "@/lib/time";
import { CheckForm } from "./check-form";

export const metadata = { title: "Rank checks" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const selectClass = "mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text";

export default async function RankChecksPage({ searchParams }: { searchParams: SP }) {
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
        <h1 className="text-2xl font-semibold">Rank checks</h1>
        <p className="text-sm text-muted">
          Observations you record by hand. Google Maps and Google Search results are kept separate, and every check shows
          where, when, on which device and how it was made.
        </p>
      </div>

      <CheckForm keywords={selectable} defaultKeywordId={kw || undefined} nowLocal={nowMadridLocal()} />

      <Card className="space-y-3">
        <CardTitle>History</CardTitle>
        <form method="get" action="/rank-checks" className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <label className="text-xs text-muted">
            Keyword
            <select name="keyword" defaultValue={kw} className={selectClass}>
              <option value="">All</option>
              {keywords.map((k) => <option key={k.id} value={k.id}>{k.term}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">
            Surface
            <select name="surface" defaultValue={surface} className={selectClass}>
              <option value="">All</option>
              <option value="maps">Google Maps</option>
              <option value="search">Google Search</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            Device
            <select name="device" defaultValue={device} className={selectClass}>
              <option value="">All</option>
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-xl border border-border bg-surface-2 px-4 text-sm font-medium">Filter</button>
        </form>
        {filtered && <Link href="/rank-checks" className="inline-flex min-h-11 items-center text-sm text-accent underline">Clear filters</Link>}
        <CheckList checks={checks} showKeyword />
      </Card>
    </div>
  );
}
