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
export function describeChanges(checks: CheckLite[]): Change[] {
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
      if (delta > 0) out.push({ ...base, kind: "improved", text: `Position ${prev.position} → ${cur.position} (${delta} higher), ${span}` });
      else if (delta < 0) out.push({ ...base, kind: "declined", text: `Position ${prev.position} → ${cur.position} (${-delta} lower), ${span}` });
      else out.push({ ...base, kind: "unchanged", text: `Position ${cur.position} in both checks, ${span}` });
    } else if (cur.position !== null) {
      out.push({ ...base, kind: "found", text: `Found at position ${cur.position}; the earlier check did not find it in the top ${prev.depth}, ${span}` });
    } else if (prev.position !== null) {
      out.push({ ...base, kind: "lost", text: `Not found in the top ${cur.depth}; the earlier check had it at position ${prev.position}, ${span}` });
    } else {
      out.push({ ...base, kind: "both_missing", text: `Not found in either check (top ${prev.depth} and top ${cur.depth}), ${span}` });
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

export const positionText = (position: number | null, depth: number) =>
  position === null ? `Not found in top ${depth} checked` : `Position ${position}`;
