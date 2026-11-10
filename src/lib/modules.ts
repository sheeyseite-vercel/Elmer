/**
 * Phase 1 route placeholders. Each module renders an honest "No data yet" state
 * with guidance. They are replaced by real implementations in Phases 2-5, and
 * are NOT marked as complete features.
 */
export type ModuleInfo = {
  title: string;
  phase: 2 | 3 | 4 | 5 | 6;
  blurb: string;
  empty: string;
};

export const MODULES: Record<string, ModuleInfo> = {
  dashboard: {
    title: "Dashboard",
    phase: 3,
    blurb: "KPIs, time series and recommended actions from your imported or manually entered data.",
    empty: "Import a Google Business Profile CSV or enter metrics manually to see results here. Nothing is shown until real data exists.",
  },
  "search-insights": {
    title: "Search insights",
    phase: 3,
    blurb: "Actual search phrases reported by Google, kept separate from your target keywords.",
    empty: "Search phrases appear only when they come from an authorised Google source or an imported report.",
  },
  keywords: {
    title: "Keyword tracker",
    phase: 3,
    blurb: "Target keywords you choose to monitor, with their rank-check history.",
    empty: "Add target keywords once this module is built. One rank change does not establish a lasting trend.",
  },
  "geo-visibility": {
    title: "Geographic visibility",
    phase: 3,
    blurb: "Rank checks plotted by place. No heatmap is drawn until real location-based checks exist.",
    empty: "Record location-based rank checks to see them here. A limited grid does not represent every searcher's result.",
  },
  "rank-checks": {
    title: "Rank checks",
    phase: 3,
    blurb: "Point-in-time observations by keyword, place, device and surface (Google Maps or Search).",
    empty: "No rank checks recorded yet.",
  },
  competitors: {
    title: "Competitors",
    phase: 3,
    blurb: "Dated, publicly visible competitor information entered by you.",
    empty: "No competitors added yet. Only public, verifiable information is tracked.",
  },
  reviews: {
    title: "Reviews",
    phase: 3,
    blurb: "Public reviews you record, with draft replies that always need your approval.",
    empty: "No reviews recorded yet. Nothing is ever published automatically.",
  },
  "profile-checklist": {
    title: "Profile checklist",
    phase: 3,
    blurb: "A practical checklist for your Google Business Profile. The live profile is never edited automatically.",
    empty: "Checklist items are unknown until you review them.",
  },
  leads: {
    title: "Leads & outcomes",
    phase: 3,
    blurb: "Aggregate counts of calls, bookings and inquiries. No patient identity or health data is stored.",
    empty: "No aggregate counts recorded yet.",
  },
  "ai-analyst": {
    title: "AI analyst",
    phase: 4,
    blurb: "Evidence-based analysis of only the data stored in this app.",
    empty: "Not available yet. It needs recorded data and a server-side AI provider to be configured.",
  },
  reports: {
    title: "Reports",
    phase: 4,
    blurb: "Weekly and monthly reports with PDF and CSV export.",
    empty: "No reports yet.",
  },
  integrations: {
    title: "Integrations",
    phase: 5,
    blurb: "Google Business Profile API and optional local-rank provider.",
    empty: "Google Business Profile API: not connected. It stays disabled until credentials are configured and a real connection test succeeds. The app works without it.",
  },
  settings: {
    title: "Settings",
    phase: 2,
    blurb: "Business details, language, access, audit log and data controls.",
    empty: "Edit your business details on the onboarding page for now.",
  },
};
