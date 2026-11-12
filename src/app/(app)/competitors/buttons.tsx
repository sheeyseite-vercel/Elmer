"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteSnapshot, setCompetitorStatus } from "./actions";
import { useTr } from "@/lib/i18n/client";

export function ArchiveButton({ id, status }: { id: string; status: "active" | "archived" }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (status === "active" && !window.confirm(tr("Archive this business? Its snapshots are kept."))) return;
          start(async () => setNote((await setCompetitorStatus(id, status === "active" ? "archived" : "active")).message));
        }}
      >
        {status === "active" ? tr("Archive") : tr("Restore")}
      </Button>
      {note && <span role="status" className="text-xs text-muted">{note}</span>}
    </div>
  );
}

export function DeleteSnapshotButton({ id }: { id: string }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      className="min-h-11 px-2 text-danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm(tr("Delete this snapshot?"))) start(async () => void (await deleteSnapshot(id)));
      }}
    >{tr("Delete")}</Button>
  );
}
