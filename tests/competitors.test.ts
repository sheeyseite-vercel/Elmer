import { describe, expect, it } from "vitest";
import { appearances, isStale, type ObservedCheck } from "../src/lib/analytics/competitors";
import { normalizeName, snapshotInput } from "../src/lib/schema/competitors";

const chk = (id: string, at: string, position: number | null, names: string[], over: Partial<ObservedCheck> = {}): ObservedCheck => ({
  id, keyword: "osteópata", checkedAt: at, locationLabel: "Clinic", surface: "maps", position,
  competitors: names.map((name) => ({ name })), ...over,
});

describe("normalizeName", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalizeName("Clínica  Osteo-Vida!")).toBe(normalizeName("clinica osteo vida"));
  });
});

describe("isStale", () => {
  it("flags snapshots older than 30 days only", () => {
    expect(isStale("2026-10-12", "2026-11-11")).toBe(false); // exactly 30 days
    expect(isStale("2026-10-11", "2026-11-11")).toBe(true);
  });
});

describe("appearances", () => {
  const comps = [{ id: "c1", name: "Clínica Vida" }, { id: "c2", name: "Otro Centro" }];
  it("counts only checks where the competitor appeared and Elmer was not found", () => {
    const r = appearances(
      [
        chk("1", "2026-11-01T10:00:00Z", null, ["clinica vida"]),
        chk("2", "2026-11-05T10:00:00Z", null, ["Clinica Vida"], { keyword: "osteopatía", locationLabel: "North" }),
        chk("3", "2026-11-06T10:00:00Z", 3, ["Clínica Vida"]), // Elmer found: not counted as missing
        chk("4", "2026-11-07T10:00:00Z", null, ["Someone else"]),
      ],
      comps,
    );
    expect(r).toHaveLength(1);
    expect(r[0]?.checksWhereElmerMissing).toBe(2);
    expect(r[0]?.totalAppearances).toBe(3);
    expect(r[0]?.keywords).toEqual(["osteopatía", "osteópata"]);
    expect(r[0]?.firstDate).toBe("2026-11-01");
    expect(r[0]?.lastDate).toBe("2026-11-05");
  });
  it("returns nothing when no competitor was recorded", () => {
    expect(appearances([chk("1", "2026-11-01T10:00:00Z", null, [])], comps)).toHaveLength(0);
  });
});

describe("snapshotInput", () => {
  const base = { competitorId: "c1", checkedOn: "2026-11-10", rating: "4.6", reviewCount: "120", sourceUrl: "https://example.com/p" };
  it("accepts a dated, sourced snapshot", () => expect(snapshotInput.safeParse(base).success).toBe(true));
  it("needs at least one public detail", () => expect(snapshotInput.safeParse({ ...base, rating: undefined, reviewCount: undefined }).success).toBe(false));
  it("needs a source link or note", () => expect(snapshotInput.safeParse({ ...base, sourceUrl: undefined }).success).toBe(false));
  it("rejects a rating above 5", () => expect(snapshotInput.safeParse({ ...base, rating: "6" }).success).toBe(false));
});
