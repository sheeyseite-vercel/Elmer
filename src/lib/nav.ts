import type { Key } from "@/lib/i18n/dict";
export type NavItem = {
  href: string;
  label: string;
  labelKey: Key;
  icon: "layout" | "search" | "tag" | "map" | "list" | "users" | "message" | "check" | "phone" | "sparkles" | "file" | "plug" | "settings" | "upload";
  primary?: boolean; // shown in mobile bottom bar
};

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", labelKey: "nav.dashboard", icon: "layout", primary: true },
  { href: "/data", label: "Data", labelKey: "nav.data", icon: "upload" },
  { href: "/search-insights", label: "Search insights", labelKey: "nav.searchInsights", icon: "search" },
  { href: "/keywords", label: "Keywords", labelKey: "nav.keywords", icon: "tag", primary: true },
  { href: "/geo-visibility", label: "Geo visibility", labelKey: "nav.geo", icon: "map", primary: true },
  { href: "/rank-checks", label: "Rank checks", labelKey: "nav.rankChecks", icon: "list" },
  { href: "/competitors", label: "Competitors", labelKey: "nav.competitors", icon: "users" },
  { href: "/reviews", label: "Reviews", labelKey: "nav.reviews", icon: "message" },
  { href: "/profile-checklist", label: "Profile checklist", labelKey: "nav.checklist", icon: "check" },
  { href: "/leads", label: "Leads & outcomes", labelKey: "nav.leads", icon: "phone" },
  { href: "/ai-analyst", label: "AI analyst", labelKey: "nav.ai", icon: "sparkles", primary: true },
  { href: "/reports", label: "Reports", labelKey: "nav.reports", icon: "file" },
  { href: "/integrations", label: "Integrations", labelKey: "nav.integrations", icon: "plug" },
  { href: "/settings", label: "Settings", labelKey: "nav.settings", icon: "settings" },
];
