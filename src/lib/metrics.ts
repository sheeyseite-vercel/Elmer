/**
 * Aggregate performance metrics the app can store. These are COUNTS per day.
 * Which of them a given Google export contains is decided by the owner's column
 * mapping; the app never assumes a particular Google file layout.
 */
export const METRICS = [
  { key: "profile_views", label: "Profile views" },
  { key: "search_appearances", label: "Searches / visibility" },
  { key: "calls", label: "Calls" },
  { key: "website_clicks", label: "Website clicks" },
  { key: "direction_requests", label: "Direction requests" },
] as const;

export type MetricKey = (typeof METRICS)[number]["key"];
export const METRIC_KEYS = METRICS.map((m) => m.key) as [MetricKey, ...MetricKey[]];

export const metricLabel = (k: string) => METRICS.find((m) => m.key === k)?.label ?? k;
