import { describe, expect, it } from "vitest";
import { describeChanges, type CheckLite } from "../src/lib/analytics/rank";
import { madridLocalToIso } from "../src/lib/time";
import { parseCompetitors, rankCheckInput } from "../src/lib/schema/keywords";

const c = (id: string, at: string, position: number | null, over: Partial<CheckLite> = {}): CheckLite => ({
  id, checkedAt: at, locationLabel: "Clinic", device: "mobile", surface: "maps", position, depth: 20, ...over,
});

describe("describeChanges", () => {
  it("needs two like-for-like checks", () => {
    expect(describeChanges([c("1", "2026-11-01T10:00:00Z", 5)])).toHaveLength(0);
  });
  it("does not compare different devices, surfaces or places", () => {
    const r = describeChanges([c("1", "2026-11-01T10:00:00Z", 5), c("2", "2026-11-05T10:00:00Z", 2, { device: "desktop" })]);
    expect(r).toHaveLength(0);
  });
  it("lower position number is an improvement", () => {
    const r = describeChanges([c("1", "2026-11-01T10:00:00Z", 7), c("2", "2026-11-05T10:00:00Z", 4)]);
    expect(r[0]?.kind).toBe("improved");
    expect(r[0]?.text).toContain("3 higher");
  });
  it("handles not-found transitions and states the depth checked", () => {
    const lost = describeChanges([c("1", "2026-11-01T10:00:00Z", 6), c("2", "2026-11-05T10:00:00Z", null, { depth: 30 })]);
    expect(lost[0]?.kind).toBe("lost");
    expect(lost[0]?.text).toContain("top 30");
    const found = describeChanges([c("1", "2026-11-01T10:00:00Z", null), c("2", "2026-11-05T10:00:00Z", 9)]);
    expect(found[0]?.kind).toBe("found");
  });
  it("uses the newest two checks regardless of input order", () => {
    const r = describeChanges([c("3", "2026-11-09T10:00:00Z", 2), c("1", "2026-11-01T10:00:00Z", 9), c("2", "2026-11-05T10:00:00Z", 3)]);
    expect(r[0]?.text).toContain("Position 3 → 2");
    expect(r[0]?.checks).toBe(3);
  });
});

describe("madridLocalToIso", () => {
  it("applies winter and summer offsets", () => {
    expect(madridLocalToIso("2026-11-10T12:00")).toBe("2026-11-10T11:00:00.000Z");
    expect(madridLocalToIso("2026-07-10T12:00")).toBe("2026-07-10T10:00:00.000Z");
  });
});

describe("parseCompetitors", () => {
  it("parses names with optional positions", () => {
    const r = parseCompetitors("Clinica A, 2\nClinica B");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.list).toEqual([{ name: "Clinica A", position: 2 }, { name: "Clinica B" }]);
  });
  it("rejects more than 10", () => {
    expect(parseCompetitors(Array.from({ length: 11 }, (_, i) => `Clinic ${i}`).join("\n")).ok).toBe(false);
  });
});

describe("rankCheckInput", () => {
  const base = {
    keywordId: "k1", checkedAt: "2026-11-10T12:00", locationLabel: "Clinic", device: "mobile", surface: "maps",
    found: "yes", position: "4", depth: "20", methodology: "Manual check in Maps app",
  };
  it("accepts a valid found check", () => expect(rankCheckInput.safeParse(base).success).toBe(true));
  it("requires a position when found", () => expect(rankCheckInput.safeParse({ ...base, position: undefined }).success).toBe(false));
  it("rejects a position beyond the results checked", () => expect(rankCheckInput.safeParse({ ...base, position: "25" }).success).toBe(false));
  it("accepts not-found with depth", () => expect(rankCheckInput.safeParse({ ...base, found: "no", position: undefined }).success).toBe(true));
  it("requires both coordinates or neither", () => expect(rankCheckInput.safeParse({ ...base, lat: "40.4" }).success).toBe(false));
});
