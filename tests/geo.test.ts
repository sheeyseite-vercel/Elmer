import { describe, expect, it } from "vitest";
import { bandOf, filterGeo, latestPerPoint, type GeoCheck } from "../src/lib/analytics/geo";

const c = (id: string, at: string, position: number | null, over: Partial<GeoCheck> = {}): GeoCheck => ({
  id, keywordId: "k1", keyword: "osteópata", checkedAt: at, lat: 40.4, lng: -3.7, device: "mobile", surface: "maps",
  position, depth: 20, locationLabel: "Clinic", methodology: "manual", ...over,
});

describe("bandOf", () => {
  it("bands positions and keeps not-found separate from low ranks", () => {
    expect(bandOf(1)).toBe("top3");
    expect(bandOf(3)).toBe("top3");
    expect(bandOf(4)).toBe("mid");
    expect(bandOf(10)).toBe("mid");
    expect(bandOf(11)).toBe("low");
    expect(bandOf(null)).toBe("none");
  });
});

describe("filterGeo", () => {
  const all = [
    c("1", "2026-11-01T10:00:00Z", 4),
    c("2", "2026-11-02T10:00:00Z", 2, { surface: "search" }),
    c("3", "2026-11-03T10:00:00Z", 5, { device: "desktop" }),
    c("4", "2026-11-04T10:00:00Z", 6, { keywordId: "k2" }),
    c("5", "2026-11-05T10:00:00Z", 7, { lat: undefined, lng: undefined }),
  ];
  it("never mixes surfaces, devices or keywords and drops checks without coordinates", () => {
    const r = filterGeo(all, { keywordId: "k1", surface: "maps", device: "mobile" });
    expect(r.map((x) => x.id)).toEqual(["1"]);
  });
  it("applies the date range using Madrid days", () => {
    const more = [...all, c("6", "2026-11-10T09:00:00Z", 3)];
    const r = filterGeo(more, { keywordId: "k1", surface: "maps", device: "mobile", from: "2026-11-05" });
    expect(r.map((x) => x.id)).toEqual(["6"]);
  });
});

describe("latestPerPoint", () => {
  it("keeps the newest check per location and counts how many there were", () => {
    const pts = latestPerPoint([
      c("1", "2026-11-01T10:00:00Z", 9),
      c("2", "2026-11-08T10:00:00Z", 3),
      c("3", "2026-11-02T10:00:00Z", 5, { lat: 40.41, lng: -3.71, locationLabel: "North" }),
    ]);
    expect(pts).toHaveLength(2);
    const clinic = pts.find((p) => p.label === "Clinic");
    expect(clinic?.position).toBe(3);
    expect(clinic?.checksAtPoint).toBe(2);
  });
});
