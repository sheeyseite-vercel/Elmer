import { z } from "zod";

export const SURFACES = { maps: "Google Maps", search: "Google Search", both: "Maps and Search" } as const;
export const DEVICES = { mobile: "Mobile", desktop: "Desktop" } as const;

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Must start with http:// or https://")
  .optional()
  .default("");

/** A TARGET keyword the owner chose to monitor. Not an actual search phrase reported by Google. */
export const keywordInput = z.object({
  id: z.string().optional(),
  term: z.string().trim().min(2, "Enter the keyword").max(120),
  language: z.enum(["es", "en"]),
  targetArea: z.string().trim().max(120).optional().default(""),
  surface: z.enum(["maps", "search", "both"]),
  group: z.string().trim().max(60).optional().default(""),
  tags: z
    .string()
    .trim()
    .max(300)
    .optional()
    .default("")
    .transform((s) => s.split(",").map((t) => t.trim().slice(0, 30)).filter(Boolean).slice(0, 10)),
  notes: z.string().trim().max(500).optional().default(""),
});

export const normalizeTerm = (term: string, language: string, area: string) =>
  [term, language, area].map((s) => s.trim().toLowerCase().replace(/\s+/g, " ")).join("|");

export type Competitor = { name: string; position?: number };

/** One per line: "Name" or "Name, 3". Public business names only. */
export function parseCompetitors(raw: string): { ok: true; list: Competitor[] } | { ok: false; error: string } {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 10) return { ok: false, error: "At most 10 competitors per check." };
  const list: Competitor[] = [];
  for (const line of lines) {
    const m = line.match(/^(.*?)(?:\s*[,;|]\s*(\d{1,3}))?$/);
    const name = (m?.[1] ?? "").trim();
    if (name.length < 2 || name.length > 80) return { ok: false, error: `Check this line: "${line.slice(0, 40)}"` };
    const position = m?.[2] ? Number(m[2]) : undefined;
    if (position !== undefined && (position < 1 || position > 200)) return { ok: false, error: `Invalid position on: "${line.slice(0, 40)}"` };
    list.push(position === undefined ? { name } : { name, position });
  }
  return { ok: true, list };
}

export const rankCheckInput = z
  .object({
    keywordId: z.string().min(1, "Choose a keyword"),
    checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter the date and time"),
    locationLabel: z.string().trim().min(2, "Describe the location checked").max(120),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    device: z.enum(["mobile", "desktop"]),
    surface: z.enum(["maps", "search"]),
    found: z.enum(["yes", "no"]),
    position: z.coerce.number().int("Whole number").min(1).max(200).optional(),
    depth: z.coerce.number().int("Whole number").min(1, "Enter how many results you looked through").max(200),
    competitors: z.string().max(1500).optional().default(""),
    methodology: z.string().trim().min(5, "Describe how you checked").max(300),
    referenceUrl: httpsUrl,
  })
  .superRefine((v, ctx) => {
    if (v.found === "yes" && v.position === undefined) ctx.addIssue({ code: "custom", path: ["position"], message: "Enter the position where it appeared" });
    if (v.found === "yes" && v.position !== undefined && v.position > v.depth)
      ctx.addIssue({ code: "custom", path: ["depth"], message: "Results checked must be at least the position found" });
    if ((v.lat === undefined) !== (v.lng === undefined)) ctx.addIssue({ code: "custom", path: ["lat"], message: "Enter both latitude and longitude, or neither" });
  });
