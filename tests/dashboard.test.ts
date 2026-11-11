import { describe, expect, it } from "vitest";
import { compare, previousRange, recommendedActions, resolveDaily, resolveRange, series, summarize, type Rec } from "../src/lib/analytics/dashboard";

const rec = (date: string, value: number, sourceKind: Rec["sourceKind"] = "google_csv", metric = "calls"): Rec => ({
  metric, date, value, sourceKind, createdAt: "2026-11-01T00:00:00Z",
});

describe("resolveRange", () => {
  const today = "2026-11-11";
  it("builds presets that include today", () => {
    const r = resolveRange({ range: "7" }, today).range;
    expect(r.from).toBe("2026-11-05");
    expect(r.days).toBe(7);
    expect(resolveRange({}, today).range.days).toBe(28);
    expect(resolveRange({ range: "90" }, today).range.from).toBe("2026-08-12");
  });
  it("validates custom ranges and falls back with an error", () => {
    expect(resolveRange({ range: "custom", from: "2026-11-01", to: "2026-11-10" }, today).range.days).toBe(10);
    expect(resolveRange({ range: "custom", from: "2026-11-10", to: "2026-11-01" }, today).error).toBeTruthy();
    expect(resolveRange({ range: "custom", from: "2026-11-01", to: "2027-01-01" }, today).error).toBeTruthy();
    expect(resolveRange({ range: "custom", from: "2026-13-01", to: "2026-11-01" }, today).error).toBeTruthy();
  });
  it("previous period has equal length and ends the day before", () => {
    const r = resolveRange({ range: "7" }, today).range;
    expect(previousRange(r)).toEqual({ from: "2026-10-29", to: "2026-11-04", days: 7 });
  });
});

describe("summaries", () => {
  it("never adds imported and manual values for the same day", () => {
    const d = resolveDaily([rec("2026-11-01", 5, "manual"), rec("2026-11-01", 9, "google_csv")]);
    expect(summarize(d, "calls", "2026-11-01", "2026-11-01").total).toBe(9);
  });
  it("returns null, not zero, when nothing is stored", () => {
    const s = summarize(resolveDaily([]), "calls", "2026-11-01", "2026-11-07");
    expect(s.total).toBeNull();
    expect(s.daysWithData).toBe(0);
  });
  it("keeps gaps as null in the series", () => {
    const pts = series(resolveDaily([rec("2026-11-02", 3)]), "calls", "2026-11-01", "2026-11-03");
    expect(pts.map((p) => p.value)).toEqual([null, 3, null]);
  });
});

describe("compare", () => {
  it("is unavailable when the previous period is empty", () => {
    const cur = summarize(resolveDaily([rec("2026-11-01", 4)]), "calls", "2026-11-01", "2026-11-01");
    const prev = summarize(resolveDaily([]), "calls", "2026-10-31", "2026-10-31");
    expect(compare(cur, prev).kind).toBe("unavailable");
  });
  it("is unavailable when coverage is below 80%", () => {
    const cur = { total: 10, daysWithData: 2, days: 7, sources: [] };
    const prev = { total: 10, daysWithData: 7, days: 7, sources: [] };
    expect(compare(cur, prev).kind).toBe("unavailable");
  });
  it("computes delta and percent when both periods are well covered", () => {
    const cur = { total: 60, daysWithData: 7, days: 7, sources: [] };
    const prev = { total: 50, daysWithData: 7, days: 7, sources: [] };
    const c = compare(cur, prev);
    expect(c.kind).toBe("ok");
    if (c.kind === "ok") { expect(c.delta).toBe(10); expect(c.pct).toBe(20); }
  });
});

describe("recommendedActions", () => {
  it("asks for data when nothing is stored, and cites why", () => {
    const a = recommendedActions({ today: "2026-11-11", records: [], metricLabels: {}, currentCoverage: [], missingProfileFields: [] });
    expect(a[0]?.title).toBe("Add your first data");
    expect(a[0]?.evidence).toContain("No performance values");
  });
  it("flags stale data using the real latest date", () => {
    const a = recommendedActions({ today: "2026-11-11", records: [rec("2026-10-01", 1)], metricLabels: {}, currentCoverage: [], missingProfileFields: [] });
    expect(a[0]?.evidence).toContain("2026-10-01");
  });
  it("returns at most three actions", () => {
    const a = recommendedActions({
      today: "2026-11-11", records: [rec("2026-09-01", 1)], metricLabels: { calls: "Calls" },
      currentCoverage: [{ metric: "calls", daysWithData: 1, days: 28 }], missingProfileFields: ["phone"],
    });
    expect(a.length).toBeLessThanOrEqual(3);
  });
});
