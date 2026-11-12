"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare, FileText, LayoutDashboard, List, Map, MessageSquare, MoreHorizontal, Phone,
  Plug, Search, Settings, Sparkles, Tag, Upload, Users,
} from "lucide-react";
import { useState } from "react";
import { NAV, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

export type NavLabels = { items: Record<string, string>; more: string; close: string; main: string; moreNav: string };

const icons = {
  layout: LayoutDashboard, search: Search, tag: Tag, map: Map, list: List, users: Users,
  message: MessageSquare, check: CheckSquare, phone: Phone, sparkles: Sparkles, file: FileText,
  plug: Plug, settings: Settings, upload: Upload,
} as const;

function Item({ item, active, compact, label }: { item: NavItem; active: boolean; compact?: boolean; label: string }) {
  const Icon = icons[item.icon];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 text-sm font-medium transition",
        compact ? "min-h-12 flex-1 flex-col justify-center gap-0.5 px-1 text-[11px]" : "min-h-11 rounded-lg px-3",
        active ? "text-text" : "text-muted hover:text-text",
        !compact && (active ? "bg-surface-2" : "hover:bg-surface-2/60"),
      )}
    >
      {active && (
        <span
          aria-hidden
          className={cn("absolute bg-primary", compact ? "inset-x-3 top-0 h-0.5 rounded-b" : "inset-y-2 start-0 w-0.5 rounded-e")}
        />
      )}
      <Icon size={compact ? 20 : 18} aria-hidden className={active ? "text-primary" : undefined} />
      <span className={compact ? "truncate" : ""}>{label}</span>
    </Link>
  );
}

export function Sidebar({ labels }: { labels: NavLabels }) {
  const path = usePathname();
  return (
    <nav aria-label={labels.main} className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Item key={n.href} item={n} label={labels.items[n.href] ?? n.label} active={path.startsWith(n.href)} />
      ))}
    </nav>
  );
}

export function BottomNav({ labels }: { labels: NavLabels }) {
  const path = usePathname();
  // The menu is "open for" a specific path, so it closes by itself after any navigation
  // without needing an effect or a click handler that could interfere with the links.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === path;
  const primary = NAV.filter((n) => n.primary);
  const more = NAV.filter((n) => !n.primary);
  return (
    <>
      {open && (
        <>
          <button
            type="button"
            aria-label={labels.close}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpenFor(null)}
          />
          <div
            role="dialog"
            aria-label={labels.moreNav}
            className="fixed end-3 z-50 w-64 max-w-[calc(100vw-1.5rem)] rounded-sheet border border-border bg-surface p-2 shadow-card"
            style={{ bottom: "calc(var(--nav-h) + env(safe-area-inset-bottom) + 8px)" }}
          >
            <div className="flex flex-col gap-1">
              {more.map((n) => (
                <Item key={n.href} item={n} label={labels.items[n.href] ?? n.label} active={path.startsWith(n.href)} />
              ))}
            </div>
          </div>
        </>
      )}
      <nav
        aria-label={labels.main}
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)]"
        style={{ minHeight: "var(--nav-h)" }}
      >
        {primary.map((n) => (
          <Item key={n.href} item={n} label={labels.items[n.href] ?? n.label} active={path.startsWith(n.href)} compact />
        ))}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpenFor(open ? null : path)}
          className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted"
        >
          <MoreHorizontal size={20} aria-hidden />
          {labels.more}
        </button>
      </nav>
    </>
  );
}
