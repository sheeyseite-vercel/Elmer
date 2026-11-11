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

const icons = {
  layout: LayoutDashboard, search: Search, tag: Tag, map: Map, list: List, users: Users,
  message: MessageSquare, check: CheckSquare, phone: Phone, sparkles: Sparkles, file: FileText,
  plug: Plug, settings: Settings, upload: Upload,
} as const;

function Item({ item, active, compact }: { item: NavItem; active: boolean; compact?: boolean }) {
  const Icon = icons[item.icon];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition",
        compact ? "min-h-12 flex-1 flex-col justify-center gap-0.5 px-1 text-[11px]" : "min-h-11 px-3",
        active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      <Icon size={compact ? 20 : 18} aria-hidden />
      <span className={compact ? "truncate" : ""}>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Item key={n.href} item={n} active={path.startsWith(n.href)} />
      ))}
    </nav>
  );
}

export function BottomNav() {
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
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpenFor(null)}
          />
          <div
            role="dialog"
            aria-label="More navigation"
            className="fixed right-3 z-50 w-64 max-w-[calc(100vw-1.5rem)] rounded-sheet border border-border bg-surface p-2 shadow-card"
            style={{ bottom: "calc(var(--nav-h) + env(safe-area-inset-bottom) + 8px)" }}
          >
            <div className="flex flex-col gap-1">
              {more.map((n) => (
                <Item key={n.href} item={n} active={path.startsWith(n.href)} />
              ))}
            </div>
          </div>
        </>
      )}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)]"
        style={{ minHeight: "var(--nav-h)" }}
      >
        {primary.map((n) => (
          <Item key={n.href} item={n} active={path.startsWith(n.href)} compact />
        ))}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpenFor(open ? null : path)}
          className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted"
        >
          <MoreHorizontal size={20} aria-hidden />
          More
        </button>
      </nav>
    </>
  );
}
