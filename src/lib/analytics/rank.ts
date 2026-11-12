/** Text goes through tr() so pages can show it in the reader's language; the default is English. */
export type TrFn = (text: string, vars?: Record<string, string | number>) => string;
const en: TrFn = (t, v) => (v ? t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m)) : t);

export type CheckLite = {
  id: string;
  checkedAt: string; // ISO
  locationLabel: string;
  device: string;
  surface: string;
  position: number | null; // null = not found in the results that were checked
  depth: number;
};

export type Change = {
  key: string;
  surface: string;
  device: string;
  location: string;
  checks: number;
  kind: "improved" | "declined" | "unchanged" | "found" | "lost" | "both_missing";
  text: string;
};

/** Only checks made on the same surface, device and location are comparable. */
export const groupKey = (c: CheckLite) => `${c.surface}|${c.device}|${c.locationLabel.trim().toLowerCase()}`;

const day = (iso: string) => iso.slice(0, 10);

/**
 * For every like-for-like group with at least two checks, compares the newest check with the one
 * before it. A lower position number is better. This describes two observations, not a trend.
 */
export function describeChanges(checks: CheckLite[], tr: TrFn = en): Change[] {
  const groups = new Map<string, CheckLite[]>();
  for (const c of checks) groups.set(groupKey(c), [...(groups.get(groupKey(c)) ?? []), c]);

  const out: Change[] = [];
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
    const cur = sorted[0]!;
    const prev = sorted[1]!;
    const span = `${day(prev.checkedAt)} → ${day(cur.checkedAt)}`;
    const base = { key, surface: cur.surface, device: cur.device, location: cur.locationLabel, checks: list.length };

    if (cur.position !== null && prev.position !== null) {
      const delta = prev.position - cur.position;
      if (delta > 0) out.push({ ...base, kind: "improved", text: tr("Position {a} → {b} ({n} higher), {span}", { a: prev.position, b: cur.position, n: delta, span }) });
      else if (delta < 0) out.push({ ...base, kind: "declined", text: tr("Position {a} → {b} ({n} lower), {span}", { a: prev.position, b: cur.position, n: -delta, span }) });
      else out.push({ ...base, kind: "unchanged", text: tr("Position {a} in both checks, {span}", { a: cur.position, span }) });
    } else if (cur.position !== null) {
      out.push({ ...base, kind: "found", text: tr("Found at position {a}; the earlier check did not find it in the top {d}, {span}", { a: cur.position, d: prev.depth, span }) });
    } else if (prev.position !== null) {
      out.push({ ...base, kind: "lost", text: tr("Not found in the top {d}; the earlier check had it at position {a}, {span}", { d: cur.depth, a: prev.position, span }) });
    } else {
      out.push({ ...base, kind: "both_missing", text: tr("Not found in either check (top {a} and top {b}), {span}", { a: prev.depth, b: cur.depth, span }) });
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

export const positionText = (position: number | null, depth: number, tr: TrFn = en) =>
  position === null ? tr("Not found in top {d} checked", { d: depth }) : tr("Position {p}", { p: position });
