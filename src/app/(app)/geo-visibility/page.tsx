import Link from "next/link";
import { redirect } from "next/navigation";
import { GeoMap, type MapData } from "@/components/map/geo-map";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badges";
import { BAND_TEXT, filterGeo, latestPerPoint } from "@/lib/analytics/geo";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listChecks, listKeywords } from "@/lib/data/keywords";
import { formatMadrid, madridDay } from "@/lib/time";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Geographic visibility" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const selectClass = "mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text";
const SURFACE_LABEL = { maps: "Google Maps", search: "Google Search" } as const;

export default async function GeoPage({ searchParams }: { searchParams: SP }) {
  const { tr } = await getT();
  const sp = await searchParams;
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const [keywords, checks] = await Promise.all([listKeywords(business.id), listChecks(business.id)]);
  const usable = keywords.filter((k) => k.status !== "archived");
  const located = checks.filter((c) => c.lat !== undefined && c.lng !== undefined);

  // Default to a keyword that actually has located checks, so the first view is not empty by accident.
  const withPoints = new Set(located.map((c) => c.keywordId));
  const defaultKeyword = usable.find((k) => withPoints.has(k.id)) ?? usable[0];
  const keywordId = usable.find((k) => k.id === one(sp.keyword))?.id ?? defaultKeyword?.id ?? "";
  const surface = one(sp.surface) === "search" ? "search" : "maps";
  const device = one(sp.device) === "desktop" ? "desktop" : "mobile";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.from) ?? "") ? one(sp.from) : undefined;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.to) ?? "") ? one(sp.to) : undefined;

  const keyword = usable.find((k) => k.id === keywordId);
  const filtered = filterGeo(located, { keywordId, surface, device, from, to });
  const points = latestPerPoint(filtered);

  const hasClinic = business.latitude !== undefined && business.longitude !== undefined;
  const map: MapData = {
    clinic: hasClinic ? { lat: business.latitude!, lng: business.longitude!, name: business.name } : null,
    points: points.map((p) => ({
      key: p.key, lat: p.lat, lng: p.lng, label: p.label, position: p.position, depth: p.depth, band: p.band,
      checkedAtText: formatMadrid(p.checkedAt), methodology: p.methodology, checksAtPoint: p.checksAtPoint,
    })),
    surface,
    surfaceLabel: tr(SURFACE_LABEL[surface]),
    keyword: keyword?.term ?? "",
  };
  const withoutCoords = checks.length - located.length;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{tr("Geographic visibility")}</h1>
        <p className="text-sm text-muted">{tr("Your recorded rank checks placed on a map. Each pin is one observation at one place and time. A handful of points does not represent what every searcher sees.")}</p>
      </div>

      {!keyword ? (
        <EmptyState>
          Add a target keyword on the <Link href="/keywords" className="text-accent underline">{tr("Keywords page")}</Link>, then
          record rank checks with latitude and longitude on <Link href="/rank-checks" className="text-accent underline">{tr("Rank checks")}</Link>.
        </EmptyState>
      ) : (
        <>
          <Card>
            <form method="get" action="/geo-visibility" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:items-end">
              <label className="text-xs text-muted sm:col-span-3 lg:col-span-2">
                {tr("Keyword")}
                <select name="keyword" defaultValue={keywordId} className={selectClass}>
                  {usable.map((k) => <option key={k.id} value={k.id}>{k.term}</option>)}
                </select>
              </label>
              <label className="text-xs text-muted">
                {tr("Surface")}
                <select name="surface" defaultValue={surface} className={selectClass}>
                  <option value="maps">{tr("Google Maps")}</option>
                  <option value="search">{tr("Google Search")}</option>
                </select>
              </label>
              <label className="text-xs text-muted">
                {tr("Device")}
                <select name="device" defaultValue={device} className={selectClass}>
                  <option value="mobile">{tr("Mobile")}</option>
                  <option value="desktop">{tr("Desktop")}</option>
                </select>
              </label>
              <label className="text-xs text-muted">
                {tr("From")}
                <input type="date" name="from" defaultValue={from} className={selectClass} />
              </label>
              <label className="text-xs text-muted">
                {tr("To")}
                <input type="date" name="to" defaultValue={to} max={madridDay(new Date().toISOString())} className={selectClass} />
              </label>
              <button type="submit" className="min-h-11 rounded-xl border border-border bg-surface-2 px-4 text-sm font-medium">{tr("Apply")}</button>
            </form>
            <p className="mt-2 text-xs text-muted">{tr("Keyword, surface and device are chosen one at a time so a map never mixes results that cannot be compared.")}</p>
          </Card>

          {!hasClinic && (
            <p className="text-sm text-warning">
              {tr("Your clinic location is not set, so it is not marked. Add latitude and longitude in")}{" "}
              <Link href="/onboarding" className="underline">{tr("business details")}</Link>.
            </p>
          )}

          {points.length === 0 ? (
            <EmptyState>
              {tr("No located checks match these filters.")} {withoutCoords > 0 ? tr("{n} recorded checks have no coordinates and cannot be placed.", { n: withoutCoords }) + " " : ""}
              {tr("Record a rank check with latitude and longitude on the")}{" "}
              <Link href="/rank-checks" className="text-accent underline">{tr("Rank checks page")}</Link>{tr(". No heatmap is drawn without real location-based checks.")}</EmptyState>
          ) : (
            <>
              <GeoMap data={map} />
              <Card className="space-y-2">
                <CardTitle>{tr("How to read the pins")}</CardTitle>
                <ul className="flex flex-wrap gap-2 text-xs">
                  {(Object.keys(BAND_TEXT) as (keyof typeof BAND_TEXT)[]).map((b) => (
                    <li key={b}><StatusBadge tone={b === "top3" ? "success" : b === "mid" ? "warning" : b === "low" ? "danger" : "neutral"}>{BAND_TEXT[b]}</StatusBadge></li>
                  ))}
                </ul>
                <p className="text-xs text-muted">{tr("The number inside a pin is the position observed (– means not found). Round pins are Google Maps checks; square pins are Google Search checks. The star is your clinic.")}</p>
              </Card>

              <Card className="space-y-3">
                <CardTitle>{tr("The same data as a table")}</CardTitle>
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-sm">
                    <thead className="text-xs text-muted">
                      <tr><th className="py-1 pe-3">{tr("Place")}</th><th className="pe-3">{tr("Result")}</th><th className="pe-3">{tr("Checked")}</th><th>{tr("Method")}</th></tr>
                    </thead>
                    <tbody>
                      {points.map((p) => (
                        <tr key={p.key} className="border-t border-border align-top">
                          <td className="py-2 pe-3">{p.label}</td>
                          <td className="pe-3">{p.position === null ? tr("Not found in top {d}", { d: p.depth }) : tr("Position {p}", { p: p.position })}</td>
                          <td className="pe-3">{formatMadrid(p.checkedAt)}</td>
                          <td>{p.methodology}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted">
                  {tr("Source: manually recorded checks. Where a place has several checks, only the newest is shown.")}
                  {withoutCoords > 0 ? ` ${tr("{n} checks without coordinates are not shown.", { n: withoutCoords })}` : ""}
                </p>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
