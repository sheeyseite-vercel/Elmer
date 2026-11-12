"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { KeywordStatus } from "@/lib/data/keywords";
import { setKeywordStatus } from "./actions";
import { useTr } from "@/lib/i18n/client";

export function StatusButtons({ id, status }: { id: string; status: KeywordStatus }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  const go = (next: KeywordStatus, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setNote(null);
    start(async () => setNote((await setKeywordStatus(id, next)).message));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "active" && <Button variant="secondary" disabled={pending} onClick={() => go("paused")}>{tr("Pause")}</Button>}
      {status === "paused" && <Button variant="secondary" disabled={pending} onClick={() => go("active")}>{tr("Resume")}</Button>}
      {status === "archived" && <Button variant="secondary" disabled={pending} onClick={() => go("active")}>{tr("Restore")}</Button>}
      {status !== "archived" && (
        <Button variant="ghost" disabled={pending} onClick={() => go("archived", "Archive this keyword? Its past checks are kept.")}>{tr("Archive")}</Button>
      )}
      {note && <span role="status" className="text-xs text-muted">{note}</span>}
    </div>
  );
}
