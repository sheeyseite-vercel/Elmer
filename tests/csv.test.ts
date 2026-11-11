import { describe, expect, it } from "vitest";
import { parseCsv, parseCount, parseDate } from "../src/lib/csv/parse";
import { buildImport } from "../src/lib/csv/import";

describe("parseCsv", () => {
  it("detects semicolons and strips a BOM", () => {
    const r = parseCsv("﻿Fecha;Llamadas\n01/02/2026;5\n");
    expect(r.delimiter).toBe(";");
    expect(r.headers).toEqual(["Fecha", "Llamadas"]);
    expect(r.rows).toEqual([["01/02/2026", "5"]]);
  });
  it("handles quoted fields, escaped quotes and embedded delimiters", () => {
    const r = parseCsv('a,b\n"x, y","He said ""hi"""\n');
    expect(r.rows).toEqual([["x, y", 'He said "hi"']]);
  });
  it("handles CRLF and skips blank lines", () => {
    expect(parseCsv("a,b\r\n1,2\r\n\r\n3,4").rows).toEqual([["1", "2"], ["3", "4"]]);
  });
});

describe("parseCount", () => {
  it("reads Spanish and English number formats", () => {
    expect(parseCount("1.234", "comma")).toBe(1234);
    expect(parseCount("1.234,0", "comma")).toBe(1234);
    expect(parseCount("1,234", "dot")).toBe(1234);
  });
  it("returns null for blank and NaN for junk", () => {
    expect(parseCount("  ", "dot")).toBeNull();
    expect(parseCount("abc", "dot")).toBeNaN();
  });
});

describe("parseDate", () => {
  it("parses by chosen order and rejects impossible dates", () => {
    expect(parseDate("05/03/2026", "dmy")).toBe("2026-03-05");
    expect(parseDate("05/03/2026", "mdy")).toBe("2026-05-03");
    expect(parseDate("2026-03-05", "dmy")).toBe("2026-03-05");
    expect(parseDate("31/02/2026", "dmy")).toBeNull();
    expect(parseDate("hello", "dmy")).toBeNull();
  });
});

describe("buildImport", () => {
  const opts = { dateOrder: "dmy" as const, decimal: "comma" as const, today: "2026-11-11" };
  const headers = ["Fecha", "Llamadas", "Visitas"];
  const mapping = { dateColumn: 0, metricColumns: { 1: "calls", 2: "profile_views" } as const };

  it("accepts good rows and reports every bad one with its line", () => {
    const rows = [
      ["01/02/2026", "5", "10"],
      ["02/02/2026", "", "7"], // blank = no data, not zero
      ["99/02/2026", "1", "1"], // bad date
      ["03/02/2026", "-2", "x"], // negative + not a number
      ["01/02/2027", "1", "1"], // future
    ];
    const r = buildImport(headers, rows, mapping, opts);
    expect(r.accepted).toHaveLength(3);
    expect(r.emptyCells).toBe(1);
    expect(r.rejected.map((x) => x.line)).toEqual([4, 5, 5, 6]);
    expect(r.dateRange).toEqual({ from: "2026-02-01", to: "2026-02-02" });
  });

  it("counts duplicates inside the file; the last value wins", () => {
    const r = buildImport(headers, [["01/02/2026", "5", "1"], ["01/02/2026", "9", "1"]], mapping, opts);
    expect(r.duplicatesInFile).toBe(2);
    expect(r.accepted.find((a) => a.metric === "calls")?.value).toBe(9);
  });
});
