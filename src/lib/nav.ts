export type NavItem = {
  href: string;
  label: string;
  icon: "layout" | "search" | "tag" | "map" | "list" | "users" | "message" | "check" | "phone" | "sparkles" | "file" | "plug" | "settings" | "upload";
  primary?: boolean; // shown in mobile bottom bar
};

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "layout", primary: true },
  { href: "/data", label: "Data", icon: "upload" },
  { href: "/search-insights", label: "Search insights", icon: "search" },
  { href: "/keywords", label: "Keywords", icon: "tag", primary: true },
  { href: "/geo-visibility", label: "Geo visibility", icon: "map", primary: true },
  { href: "/rank-checks", label: "Rank checks", icon: "list" },
  { href: "/competitors", label: "Competitors", icon: "users" },
  { href: "/reviews", label: "Reviews", icon: "message" },
  { href: "/profile-checklist", label: "Profile checklist", icon: "check" },
  { href: "/leads", label: "Leads & outcomes", icon: "phone" },
  { href: "/ai-analyst", label: "AI analyst", icon: "sparkles", primary: true },
  { href: "/reports", label: "Reports", icon: "file" },
  { href: "/integrations", label: "Integrations", icon: "plug" },
  { href: "/settings", label: "Settings", icon: "settings" },
];
