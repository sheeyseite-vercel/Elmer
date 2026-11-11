import { describe, expect, it } from "vitest";
import { changeText, csvCell, factsToCsv, factsToText, hasAnyData, type Facts } from "../src/lib/analytics/facts";

const base = (over: Partial<Facts> = {}): Facts => ({
  generatedAt: "2026-11-11T10:00:00Z", timezone: "Europe/Madrid", business: { name: "=Clinic", city: "Madrid" },
  period: { from: "2026-10-15", to: "2026-11-11", days: 28, previousFrom: "2026-09-17", previousTo: "2026-10-14" },
  metrics: [], rankChecks: [], leads: null, reviews: null, searchTerms: null,
  checklist: { complete: 0, needsAttention: 0, unknown: 10 }, limits: ["a limit"], ...over,
});

describe("changeText", () => {
  it("formats numbers and unavailable comparisons", () => {
    expect(changeText({ kind: "ok", delta: 5, pct: 12.5 })).toBe("+5 (+12.5%)");
    expect(changeText({ kind: "ok", delta: -3, pct: null })).toBe("-3");
    expect(changeText({ kind: "unavailable", reason: "No data in this period." })).toBe("Not comparable: No data in this period.");
  });
});

describe("hasAnyData", () => {
  it("is false when nothing is recorded", () => expect(hasAnyData(base())).toBe(false));
  it("is true with a recorded metric", () => {
    expect(hasAnyData(base({ metrics: [{ label: "Calls", total: 4, daysWithData: 4, days: 28, previousTotal: null, change: "x" }] }))).toBe(true);
  });
});

describe("csvCell", () => {
  it("neutralises formulas and quotes special characters", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell('a, "b"')).toBe('"a, ""b"""');
    expect(csvCell(null)).toBe("");
  });
});

describe("exports", () => {
  it("never print null as zero", () => {
    const f = base({ metrics: [{ label: "Calls", total: null, daysWithData: 0, days: 28, previousTotal: null, change: "Not comparable" }] });
    expect(factsToText(f)).toContain("Calls: not recorded");
    expect(factsToCsv(f)).toContain("performance,Calls,,");
  });
});
