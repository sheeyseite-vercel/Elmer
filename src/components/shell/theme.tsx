"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Choice = "system" | "light" | "dark";
const COOKIE = "elmer_theme";

function current(): Choice {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

function apply(choice: Choice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  try {
    document.cookie = `${COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
  } catch {
    /* the choice still applies for this visit */
  }
}

const isDarkNow = () =>
  current() === "dark" || (current() === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

/** One-tap switch for the header and sidebar. Applies instantly, no page reload. */
export function ThemeToggle({ label, className }: { label: string; className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(isDarkNow()), []);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => { apply(dark ? "light" : "dark"); setDark(!dark); }}
      className={cn("inline-flex size-11 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text", className)}
    >
      {dark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}

/** Three-way choice for Settings. */
export function ThemeChoice({ labels }: { labels: Record<Choice, string> }) {
  const [active, setActive] = useState<Choice>("system");
  useEffect(() => setActive(current()), []);
  return (
    <div role="group" className="flex flex-wrap gap-2">
      {(["system", "light", "dark"] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={active === c}
          onClick={() => { apply(c); setActive(c); }}
          className={cn(
            "min-h-11 rounded-xl border px-4 text-sm font-semibold transition",
            active === c ? "border-primary bg-primary text-primary-fg" : "border-border text-muted hover:bg-surface-2 hover:text-text",
          )}
        >
          {labels[c]}
        </button>
      ))}
    </div>
  );
}
