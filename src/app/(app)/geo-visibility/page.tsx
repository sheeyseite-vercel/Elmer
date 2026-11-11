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

export const metadata = { title: "Geographic visibility" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const selectClass = "mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text";
const SURFACE_LABEL = { maps: "Google Maps", search: "Google Search" } as const;

export default async function GeoPage({ searchParams }: { searchParams: SP }) {
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
    surfaceLabel: SURFACE_LABEL[surface],
    keyword: keyword?.term ?? "",
  };
  const withoutCoords = checks.length - located.length;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Geographic visibility</h1>
        <p className="text-sm text-muted">
          Your recorded rank checks placed on a map. Each pin is one observation at one place and time. A handful of
          points does not represent what every searcher sees.
        </p>
      </div>

      {!keyword ? (
        <EmptyState>
          Add a target keyword on the <Link href="/keywords" className="text-accent underline">Keywords page</Link>, then
          record rank checks with latitude and longitude on <Link href="/rank-checks" className="text-accent underline">Rank checks</Link>.
        </EmptyState>
      ) : (
        <>
          <Card>
            <form method="get" action="/geo-visibility" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:items-end">
              <label className="text-xs text-muted sm:col-span-3 lg:col-span-2">
                Keyword
                <select name="keyword" defaultValue={keywordId} className={selectClass}>
                  {usable.map((k) => <option key={k.id} value={k.id}>{k.term}</option>)}
                </select>
              </label>
              <label className="text-xs text-muted">
                Surface
                <select name="surface" defaultValue={surface} className={selectClass}>
                  <option value="maps">Google Maps</option>
                  <option value="search">Google Search</option>
                </select>
              </label>
              <label className="text-xs text-muted">
                Device
                <select name="device" defaultValue={device} className={selectClass}>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                </select>
              </label>
              <label className="text-xs text-muted">
                From
                <input type="date" name="from" defaultValue={from} className={selectClass} />
              </label>
              <label className="text-xs text-muted">
                To
                <input type="date" name="to" defaultValue={to} max={madridDay(new Date().toISOString())} className={selectClass} />
              </label>
              <button type="submit" className="min-h-11 rounded-xl border border-border bg-surface-2 px-4 text-sm font-medium">Apply</button>
            </form>
            <p className="mt-2 text-xs text-muted">
              Keyword, surface and device are chosen one at a time so a map never mixes results that cannot be compared.
            </p>
          </Card>

          {!hasClinic && (
            <p className="text-sm text-warning">
              Your clinic location is not set, so it is not marked. Add latitude and longitude in{" "}
              <Link href="/onboarding" className="underline">business details</Link>.
            </p>
          )}

          {points.length === 0 ? (
            <EmptyState>
              No located checks match these filters. {withoutCoords > 0 ? `${withoutCoords} recorded checks have no coordinates and cannot be placed. ` : ""}
              Record a rank check with latitude and longitude on the{" "}
              <Link href="/rank-checks" className="text-accent underline">Rank checks page</Link>. No heatmap is drawn
              without real location-based checks.
            </EmptyState>
          ) : (
            <>
              <GeoMap data={map} />
              <Card className="space-y-2">
                <CardTitle>How to read the pins</CardTitle>
                <ul className="flex flex-wrap gap-2 text-xs">
                  {(Object.keys(BAND_TEXT) as (keyof typeof BAND_TEXT)[]).map((b) => (
                    <li key={b}><StatusBadge tone={b === "top3" ? "success" : b === "mid" ? "warning" : b === "low" ? "danger" : "neutral"}>{BAND_TEXT[b]}</StatusBadge></li>
                  ))}
                </ul>
                <p className="text-xs text-muted">
                  The number inside a pin is the position observed (– means not found). Round pins are Google Maps checks;
                  square pins are Google Search checks. The star is your clinic.
                </p>
              </Card>

              <Card className="space-y-3">
                <CardTitle>The same data as a table</CardTitle>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-muted">
                      <tr><th className="py-1 pr-3">Place</th><th className="pr-3">Result</th><th className="pr-3">Checked</th><th>Method</th></tr>
                    </thead>
                    <tbody>
                      {points.map((p) => (
                        <tr key={p.key} className="border-t border-border align-top">
                          <td className="py-2 pr-3">{p.label}</td>
                          <td className="pr-3">{p.position === null ? `Not found in top ${p.depth}` : `Position ${p.position}`}</td>
                          <td className="pr-3">{formatMadrid(p.checkedAt)}</td>
                          <td>{p.methodology}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted">
                  Source: manually recorded checks. Where a place has several checks, only the newest is shown.
                  {withoutCoords > 0 ? ` ${withoutCoords} checks without coordinates are not shown.` : ""}
                </p>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
