import { describe, expect, it } from "vitest";
import { classify, isMonth, matchesTarget, monthSummary, parseTermLines, sortRows } from "../src/lib/analytics/search-terms";

describe("parseTermLines", () => {
  it("reads counts, thresholds and missing counts", () => {
    const r = parseTermLines("osteópata madrid, 120\nfisio\t45\nquiropráctico, <15\nsolo frase");
    expect(r.errors).toEqual([]);
    expect(r.rows).toEqual([
      { phrase: "osteópata madrid", impressions: 120, belowThreshold: false },
      { phrase: "fisio", impressions: 45, belowThreshold: false },
      { phrase: "quiropráctico", impressions: null, belowThreshold: true },
      { phrase: "solo frase", impressions: null, belowThreshold: false },
    ]);
  });
  it("handles thousands separators and quoted phrases with commas", () => {
    const r = parseTermLines('"dolor, espalda", 1.200');
    expect(r.rows[0]).toEqual({ phrase: "dolor, espalda", impressions: 1200, belowThreshold: false });
  });
  it("reports duplicates and bad phrases by line", () => {
    const r = parseTermLines("a\nosteopata, 3\nOsteopata, 4");
    expect(r.errors.map((e) => e.line)).toEqual([1, 3]);
    expect(r.rows).toHaveLength(1);
  });
  it("enforces the row limit", () => {
    const many = Array.from({ length: 6 }, (_, i) => `frase ${i}`).join("\n");
    expect(parseTermLines(many, 5).rows).toEqual([]);
  });
});

describe("classify (estimate)", () => {
  const ctx = { name: "Elmer Osteopatía", city: "Madrid", serviceArea: "Chamberí, Retiro" };
  it("flags the business name, ignoring accents and case", () => {
    expect(classify("elmer osteopatia horario", ctx)).toBe("branded");
  });
  it("flags places and near me", () => {
    expect(classify("osteópata en madrid", ctx)).toBe("local");
    expect(classify("osteopata chamberi", ctx)).toBe("local");
    expect(classify("osteópata cerca de mí", ctx)).toBe("local");
  });
  it("defaults to service", () => expect(classify("dolor lumbar", ctx)).toBe("service"));
});

describe("monthSummary", () => {
  it("never turns thresholds or unknowns into numbers", () => {
    const s = monthSummary([
      { id: "1", month: "2026-10", phrase: "a", impressions: 10, belowThreshold: false },
      { id: "2", month: "2026-10", phrase: "b", impressions: null, belowThreshold: true },
      { id: "3", month: "2026-10", phrase: "c", impressions: null, belowThreshold: false },
    ]);
    expect(s).toEqual({ phrases: 3, knownTotal: 10, withCount: 1, below: 1, unknown: 1 });
  });
  it("has no total when no exact counts exist", () => {
    expect(monthSummary([{ id: "1", month: "2026-10", phrase: "a", impressions: null, belowThreshold: true }]).knownTotal).toBeNull();
  });
});

describe("misc", () => {
  it("validates months", () => {
    expect(isMonth("2026-10")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
  });
  it("matches target keywords exactly, ignoring accents", () => {
    expect(matchesTarget("Osteópata Madrid", ["osteopata madrid"])).toBe(true);
    expect(matchesTarget("osteopata madrid centro", ["osteopata madrid"])).toBe(false);
  });
  it("sorts known counts first", () => {
    const rows = sortRows([
      { id: "1", month: "m", phrase: "x", impressions: null, belowThreshold: true },
      { id: "2", month: "m", phrase: "y", impressions: 5, belowThreshold: false },
    ]);
    expect(rows[0]?.phrase).toBe("y");
  });
});
