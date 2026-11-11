import type { Point } from "@/lib/analytics/dashboard";

const W = 600;
const H = 220;
const M = { top: 12, right: 8, bottom: 28, left: 40 };

const niceMax = (v: number) => {
  if (v <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
};

/**
 * Server-rendered SVG bar chart. Days without data are left EMPTY (never drawn as zero).
 * No animation, so nothing implies that data changed. A text table is provided for screen readers.
 */
export function DailyBars({
  points,
  title,
  unit,
  period,
  source,
}: {
  points: Point[];
  title: string;
  unit: string;
  period: string;
  source: string;
}) {
  const values = points.filter((p) => p.value !== null).map((p) => p.value as number);
  const max = niceMax(Math.max(0, ...values));
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const slot = plotW / points.length;
  const barW = Math.max(1, slot * 0.7);
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const labelIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const id = "chart-" + title.replace(/\W+/g, "-").toLowerCase();

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm">
        <span className="font-semibold">{title}</span>
        <span className="block text-xs text-muted">
          {unit} · {period} · Source: {source}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <title id={`${id}-t`}>{`${title}, ${unit}, ${period}`}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={M.left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          p.value === null ? null : (
            <rect
              key={p.date}
              x={M.left + i * slot + (slot - barW) / 2}
              y={y(p.value)}
              width={barW}
              height={Math.max(0, M.top + plotH - y(p.value))}
              rx={Math.min(3, barW / 2)}
              fill={p.source === "manual" ? "var(--accent)" : "var(--primary)"}
            >
              <title>{`${p.date}: ${p.value}`}</title>
            </rect>
          ),
        )}
        {labelIdx.map((i, k) => (
          <text
            key={k}
            x={M.left + i * slot + slot / 2}
            y={H - 8}
            textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
            fontSize="11"
            fill="var(--text-muted)"
          >
            {points[i]?.date}
          </text>
        ))}
      </svg>
      <p className="text-xs text-muted">
        Empty spaces are days with no data (not zero). Teal bars are imported values; blue bars are manual entries.
      </p>
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer py-2 text-accent">View values as a table</summary>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-start text-xs">
            <thead className="text-muted">
              <tr><th className="py-1 pe-3">Date</th><th className="pe-3">Value</th><th>Source</th></tr>
            </thead>
            <tbody>
              {points.filter((p) => p.value !== null).map((p) => (
                <tr key={p.date} className="border-t border-border">
                  <td className="py-1 pe-3">{p.date}</td>
                  <td className="pe-3">{p.value}</td>
                  <td>{p.source === "manual" ? "Manually entered" : "Imported CSV"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
